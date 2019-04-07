const NAMESPACE_KEY = '_group_compound_layout';
const BOUNDING_BOX = 'bounding-box';
const CHILDREN_KEY = 'children';
const STYLES_KEY = 'styles';
const BETWEEN_NODES_PADDING = 3;

/**
 * Synthetic edge generator takes care of creating edges without repeating the same edge (targetA -> targetB) twice
 */
class SyntheticEdgeGenerator {
  constructor() {
    this.nextId = 0;
    this.generatedMap = {};
  }

  getEdge(source, target) {
    const sourceId = this.normalizeToParent(source).id();
    const targetId = this.normalizeToParent(target).id();
    const key = `${ sourceId }->${ targetId }`;

    if (this.generatedMap[key]) {
      return false;
    }

    this.generatedMap[key] = true;

    return {
      group: 'edges',
      data:  {
        id:     `synthetic-edge-${  this.nextId++ }`,
        source: sourceId,
        target: targetId
      }
    };
  }

  // Returns the parent if any or the element itself.
  normalizeToParent(element) {
    return element.isChild() ? element.parent() : element;
  }
}

class VerticalLayout {
  /**
   * This will get the size required for a vertical layout by:
   * adding all the heights of the contents plus a padding for every space between a node.
   * finding the max width value to use.
   */
  size(compound) {
    const size = compound.children().reduce(
      (accBoundingBox, child) => {
        const localBoundingBox = child.boundingBox();

        // The bounding box reported before adding and after adding differs, I think is related to removing/adding
        // in a batch, save that value for later
        child.data(NAMESPACE_KEY + BOUNDING_BOX, localBoundingBox);
        accBoundingBox.height += localBoundingBox.h;
        accBoundingBox.width = Math.max(accBoundingBox.width, localBoundingBox.w);

        return accBoundingBox;
      },
      {
        width:  0,
        height: 0
      }
    );

    size.height += (compound.children().length - 1) * BETWEEN_NODES_PADDING;

    return size;
  }

  /**
   * This will layout the children using a vertical layout, starting on 0,0 we position the nodes relative to the parent
   * and saving the previous position to use as starting point for the news child.
   */
  layout(compound) {
    const position = {
      x: 0,
      y: 0
    };

    compound.children().each((child) => {
      // Retrieve saved bounding box to use, immediately delete as won't be used anymore.
      const boundingBox = child.data(NAMESPACE_KEY + BOUNDING_BOX);

      child.removeData(NAMESPACE_KEY + BOUNDING_BOX);
      // It looks like the relativePosition is given by the center, i haven't been able to confirm this (in the code) but
      // i'm using its bounding box to place it
      child.relativePosition({
        x: position.x - boundingBox.w * 0.5,
        y: position.y - boundingBox.h * 0.5
      });
      position.y += boundingBox.h + BETWEEN_NODES_PADDING;
    });
  }
}

export default class GroupCompoundLayout {
  constructor(options) {
    this.options = options;
    this.cy = this.options.cy;
    this.elements = this.options.eles;
    this.syntheticEdgeGenerator = new SyntheticEdgeGenerator();
    this.compoundLayout = new VerticalLayout();
  }

  /**
   * This code gets executed on the cy.layout(...).run() is our entrypoint of this algorithm.
   */
  run() {
    console.log('run')
    const { realLayout } = this.options;
    const parents = this.parents();

    // (1.a) Prepare parents by assigning a size
    parents.each((parent) => {
      const boundingBox = this.compoundLayout.size(parent);
      const backupStyles = {
        shape:  parent.style('shape'),
        height: parent.style('height'),
        width:  parent.style('width')
      };

      const newStyles = {
        shape:  'rectangle',
        height: `${ boundingBox.height }px`,
        width:  `${ boundingBox.width }px`
      };

      // Saves a backup of current styles to restore them after we finish
      this.setScratch(parent, STYLES_KEY, backupStyles);
      // (1.b) Set the size
      parent.style(newStyles);
      // Save the children as jsons in the parent scratchpad for later
      this.setScratch(parent, CHILDREN_KEY, parent.children().jsons());
    });

    //  Remove the children and its edges and add synthetic edges for every edge that touches a child node.
    let syntheticEdges = this.cy.collection();
    // Removed elements are being stored because later we will add them back.
    const elementsToRemove = parents.children().reduce((children, child) => {
      children.push(child);

      return children.concat(
        child.connectedEdges().reduce((edges, edge) => {
          // (1.c) Create synthetic edges.
          const syntheticEdge = this.syntheticEdgeGenerator.getEdge(edge.source(), edge.target());

          if (syntheticEdge) {
            syntheticEdges = syntheticEdges.add(this.cy.add(syntheticEdge));
          }
          edges.push(edge);

          return edges;
        }, [])
      );
    }, []);

    // (1.d) Remove children and edges that touch a child node.
    this.cy.remove(this.cy.collection().add(elementsToRemove));

    let payload = this.options

    Object.assign(payload, {
      name:       realLayout, // but using the real layout
      eles:       this.cy.elements(), // and the current elements
      realLayout: undefined // We don't want this realLayout stuff in there.
    })

    const layout = this.cy.layout(payload);

    console.log(payload, 'payload')
    // (2) Add a one-time callback to be fired when the layout stops
    layout.one('layoutstop', () => {
      // (3) Remove synthetic edges
      this.cy.remove(syntheticEdges);

      // Add and position the children nodes according to the layout
      parents.each((parent) => {
        // (4.a) Add back the children and the edges
        this.cy.add(this.getScratch(parent, CHILDREN_KEY));
        // (4.b) Layout the children using our compound layout.
        this.compoundLayout.layout(parent);
        parent.style(this.getScratch(parent, STYLES_KEY));

        // Discard the saved values
        this.setScratch(parent, CHILDREN_KEY, undefined);
        this.setScratch(parent, STYLES_KEY, undefined);
      });
      // (4.a) Add the real edges, we already added the children nodes.
      this.cy.add(
        this.cy
          .collection()
          .add(elementsToRemove)
          .edges()
      );
    });
    layout.run();
  }

  parents() {
    return this.elements.nodes('$node > node');
  }

  getScratch(element, key) {
    return element.scratch(NAMESPACE_KEY + key);
  }

  setScratch(element, key, value) {
    element.scratch(NAMESPACE_KEY + key, value);
  }
}

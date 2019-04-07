import Mixin from '@ember/object/mixin';
import { get, set, setProperties } from '@ember/object';

const HIGHLIGHT_CLASS = 'mousehighlight';
const DIM_CLASS = 'mousedim';

export default Mixin.create({
  selected: {},

  init() {
    this._super(...arguments)
    const { selected } = this

    setProperties(selected, {
      summaryType:   'graph',
      summaryTarget: get(this, 'cy'),
    })
  },

  onClick(event) {
    // ignore clicks on the currently selected element
    if (get(this, 'selected.summaryTarget') === event.summaryTarget) {
      return;
    }

    setProperties(this, {
      selected: event,
      hovered:  undefined,
    })

    this.unhighlight();

    // only highlight when selecting something other than the graph background
    if (get(this, 'selected.summaryTarget') !== 'graph') {
      this.refresh();
    }
  },

  onMouseIn(event) {
    if (get(this, 'selected.summaryType') === 'graph' && ['node', 'edge', 'group'].indexOf(event.summaryType) !== -1) {
      set(this, 'hovered', event)
      this.refresh();
    }
  },

  onMouseOut(event) {
    if (get(this, 'hovered') && get(this, 'hovered.summaryTarget') === event.summaryTarget) {
      set(this, 'hovered', undefined);
      this.unhighlight();
    }
  },

  refresh() {
    let toHighlight = this.getHighlighted();

    if (!toHighlight) {
      return;
    }

    toHighlight
      .filter((ele) => {
        return !ele.isParent();
      })
      .addClass(HIGHLIGHT_CLASS);

    get(this, 'cy')
      .elements()
      .difference(toHighlight)
      .addClass(DIM_CLASS);
  },

  getHighlighted() {
    if (get(this, 'selected.summaryType') === 'graph') {
      return this.getHighlightedByEvent(get(this, 'hovered'));
    }

    return this.getHighlightedByEvent(get(this, 'selected'));
  },

  getHighlightedByEvent(event) {
    if (event) {
      if (event.summaryType === 'node') {
        return this.getNodeHighlight(event.summaryTarget);
      } else if (event.summaryType === 'edge') {
        return this.getEdgeHighlight(event.summaryTarget);
      } else if (event.summaryType === 'group') {
        return this.getGroupHighlight(event.summaryTarget);
      }
    }

    return undefined;
  },

  getNodeHighlight(node) {
    return this.includeParentNodes(node.closedNeighborhood());
  },

  getEdgeHighlight(edge) {
    return this.includeParentNodes(edge.connectedNodes().add(edge));
  },

  // return the children and children relations, including edges
  getGroupHighlight(groupBox) {
    return this.includeParentNodes(
      groupBox.children().reduce((prev, child) => {
        return prev.add(child.closedNeighborhood());
      }, get(this, 'cy').collection())
    );
  },

  includeParentNodes(nodes) {
    return nodes.reduce((all, current) => {
      all = all.add(current);
      if (current.isChild()) {
        all = all.add(current.parent());
      }

      return all;
    }, get(this, 'cy').collection());
  },

  unhighlight() {
    const { cy } = this

    cy.elements(`.${  DIM_CLASS }`).removeClass(DIM_CLASS);
    cy.elements(`.${  HIGHLIGHT_CLASS }`).removeClass(HIGHLIGHT_CLASS);
  },
});

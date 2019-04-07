import { get, set, observer } from '@ember/object';
import Component from '@ember/component';
import layout from './template';
import cytoscape from 'cytoscape';
import Kiali from 'ui/utils/kiali';
import cycola from 'cytoscape-cola';
import Hightlighter from 'istio/mixins/graph-hightlighter';
import GraphStyles from 'istio/mixins/graph-styles';
import { assign } from '@ember/polyfills';
import GroupCompoundLayout from 'ui/utils/group-compound-layout';
import TrafficRender from 'ui/utils/traffic-renderer';
import ThrottledResize from 'shared/mixins/throttled-resize';

cytoscape.use(cycola);
cytoscape('layout', 'group-compound-layout', GroupCompoundLayout);

export default Component.extend(Hightlighter, GraphStyles, ThrottledResize, {
  layout,

  init() {
    this._super(...arguments)
  },

  didInsertElement() {
    const cy = cytoscape({
      container: $('#cy'), // eslint-disable-line
      style:               this.getStyles(),
      boxSelectionEnabled: false,
      wheelSensitivity:    0.1,
      autounselectify:     false,
      autoungrabify:       true,
    });

    set(this, 'cy', cy)

    this.cyInitialization(cy)
    // this.processGraphUpdate(cy)
  },

  willDestroyElement() {
    const { cy } = this

    if (cy) {
      cy.destroy()
      set(this, 'cy', null)
    }
  },

  elemtsChange: observer('elements', function() {
    const { cy } = this

    this.processGraphUpdate(cy, true)
    // this.safeFit(cy);
  }),

  processGraphUpdate(cy, updateLayout) {
    if (!cy) {
      return;
    }

    get(this, 'trafficRenderer').stop()

    const globalScratchData = {
      graphType:           get(this, 'graphType'),
      edgeLabelMode:       get(this, 'edgeLabelMode'),
      showCircuitBreakers: get(this, 'showCircuitBreakers'),
      showMissingSidecars: get(this, 'showMissingSidecars'),
      showNodeLabels:      get(this, 'showNodeLabels'),
      showSecurity:        get(this, 'showSecurity'),
      showVirtualServices: get(this, 'showVirtualServices'),
    }

    cy.scratch(Kiali.CytoscapeGlobalScratchNamespace, globalScratchData);

    cy.startBatch();

    cy.json({ elements: get(this, 'elements'), });

    const layoutOptions = {
      name:                        'cola',
      animate:                     false,
      fit:                         false,
      flow:                        { axis: 'x', },
      nodeDimensionsIncludeLabels: true,
      randomize:                   false
    }

    if (updateLayout) {
      if (cy.nodes('$node > node').length > 0) {
        // if there is any parent node, run the group-compound-layout
        assign(layoutOptions, {
          name:       'group-compound-layout',
          realLayout: 'cola'
        })
      }
    }

    cy.layout(layoutOptions).run();

    cy.endBatch();

    if (updateLayout) {
      this.safeFit(cy);
    }

    // Update TrafficRenderer
    // get(this, 'trafficRenderer').setEdges(cy.edges());
    // if (get(this, 'showTrafficAnimation')) {
    //   get(this, 'trafficRenderer').start();
    // }
  },

  safeFit(cy) {
    if (!cy) {
      return;
    }

    cy.fit('', Kiali.ZoomOptions.fitPadding);
    if (cy.zoom() > 2.5) {
      cy.zoom(2.5);
      cy.center();
    }
  },

  cyInitialization(cy) {
    if (!cy) {
      return;
    }

    set(this, 'trafficRenderer', TrafficRender.create({
      cy,
      edges: cy.edges(),
    }))

    cy.on('tap', (event) => {
      // let tapped = event.target;
      const cytoscapeEvent = this.getCytoscapeBaseEvent(event, cy);

      if (cytoscapeEvent) {
        this.handleTap(cytoscapeEvent);
        this.selectTarget(event.target);
      }
    });

    cy.on('mouseover', 'node,edge', (evt) => {
      const cytoscapeEvent = this.getCytoscapeBaseEvent(evt, cy);

      if (cytoscapeEvent) {
        this.handleMouseIn(cytoscapeEvent);
      }
    });

    cy.on('mouseout', 'node,edge', (evt) => {
      const cytoscapeEvent = this.getCytoscapeBaseEvent(evt, cy);

      if (cytoscapeEvent) {
        this.handleMouseOut(cytoscapeEvent);
      }
    });

    cy.ready(() => {
      // this.onReady(evt.cy);
      this.processGraphUpdate(cy, true);
    });

    cy.on('destroy', () => {
      get(this, 'trafficRenderer').stop();
      set(this, 'cy', undefined)
    });

    // cy.userPanningEnabled( false );
  },

  getCytoscapeBaseEvent(event, cy) {
    const target = event.target;

    if (target === cy) {
      return {
        summaryType:   'graph',
        summaryTarget: cy
      };
    } else if (target.isNode()) {
      if (target.data('isGroup') === 'version') {
        return {
          summaryType:   'group',
          summaryTarget: target
        };
      } else {
        return {
          summaryType:   'node',
          summaryTarget: target
        };
      }
    } else if (target.isEdge()) {
      return {
        summaryType:   'edge',
        summaryTarget: target
      };
    } else {
      return null;
    }
  },

  handleMouseIn(event) {
    this.onMouseIn(event);
  },

  handleMouseOut(event) {
    this.onMouseOut(event)
  },

  handleTap(event) {
    this.onClick(event);
  },

  selectTarget(target) {
    const { cy } = this

    if (!target) {
      target = cy;
    }
    cy.$(':selected')
      .selectify()
      .unselect()
      .unselectify();
    if (target !== cy) {
      target.selectify()
        .select()
        .unselectify();
    }
  },

  onResize() {
    this._super(...arguments);
    this.safeFit(get(this, 'cy'));
  },

});

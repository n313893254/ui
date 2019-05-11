import Component from '@ember/component';
import Metrics from 'shared/mixins/metrics';
import layout from './template';
import { get, set, observer } from '@ember/object';
import $ from 'jquery';

export default Component.extend(Metrics, {
  layout,

  actions: {
    query(){
      set(this, 'graphs', [{
        graph: {
          title:    'success-rate',
          priority: 1,
          unit:     'percent',
        },
        series:   [
          {
            name:   'success rate',
            points: [[1, 1554817482000], [1, 1554817542000]]
          }
        ]
      }, {
        graph: {
          title:    'fail-4xx',
          priority: 2,
          unit:     'number'
        },
        series:   [
          {
            name:   '4xx',
            points: [[2, 1554817482000], [30, 1554817542000]]
          }
        ]
      }, {
        graph: {
          title:    'fail-5xx',
          priority: 3,
          unit:     'number'
        },
        series:   [
          {
            name:   '5xx',
            points: [[1, 1554817482000], [100, 1554817542000]]
          }
        ]
      }, {
        graph: {
          title:    'fail-by-service-4xx',
          priority: 4,
          unit:     'number'
        },
        series:   [
          {
            name:   'service-a',
            points: [[50, 1554817482000], [20, 1554817542000]]
          },
          {
            name:   'service-b',
            points: [[30, 1554817482000], [100, 1554817542000]]
          },
          {
            name:   'service-c',
            points: [[1, 1554817482000], [1, 1554817542000]]
          }
        ]
      }, {
        graph: {
          title:    'fail-by-service-5xx',
          priority: 5,
          unit:     'number'
        },
        series:   [
          {
            name:   'service-a',
            points: [[23, 1554817482000], [20, 1554817542000]]
          },
          {
            name:   'service-b',
            points: [[40, 1554817482000], [100, 1554817542000]]
          },
          {
            name:   'service-c',
            points: [[2, 1554817482000], [1, 1554817542000]]
          }
        ]
      }])
      set(this, 'state.loading', false);
    }
  },

  expandedDidChange: observer('expanded', function() {
    if ( get(this, 'expanded') ) {
      $(window).trigger('resize');
    }
  }),

});

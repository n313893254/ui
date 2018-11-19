import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed, observer, get, set } from '@ember/object';
import { htmlSafe } from '@ember/string';
import EmberObject from '@ember/object';
import layout from './template';

export default Component.extend({
  globalStore: service(),
  scope:       service(),
  editing:     true,
  option:      {
    xAxis: {
      type:        'category',
      boundaryGap: false,
      data:        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis:  { type: 'value' },
    series: [{
      data:      [820, 932, 901, 934, 1290, 1330, 1320],
      type:      'line',
      areaStyle: {}
    }]
  },
  condictions: [],
  layout,

  clusterId:   reads('scope.currentCluster.id'),
  init() {
    this._super(...arguments);
  },

  actions: {
    addRule() {
      console.log('addCondiction')
      const rule = EmberObject.create({
        host:  '',
        new:   true,
        paths: {},
      });

      get(this, 'condictions').pushObject(rule);
    },

    removeRule(rule) {
      console.log(rule, 'removeRule')
      get(this, 'condictions').removeObject(rule);
    },
  },

  targetTypeChanged: observer('model._targetType', function() {
    const t = get(this, 'model._targetType');

    this.setEventType(t);
  }),

  nodes: computed('clusterId', function() {
    const clusterId = get(this, 'clusterId');

    return get(this, 'globalStore').all('node').filterBy('clusterId', clusterId);
  }),

  isEventTarget: computed('model._targetType', function() {
    const t = get(this, 'model._targetType');

    return t === 'warningEvent' || t ===  'normalEvent';
  }),

  verbStyles: computed('model._targetType', function() {
    const tt = get(this, 'model._targetType');
    let out = '';

    if (tt === 'node' || tt === 'nodeSelector') {
      out = `padding-top: 6px;`;
    }

    return htmlSafe(out);
  }),

  addCondiction() {
    this.send('addRule')
  },

  setEventType(t) {
    if (t === 'warningEvent') {
      set(this, 'model.eventRule.eventType', 'Warning');
    }
    if (t === 'normalEvent') {
      set(this, 'model.eventRule.eventType', 'Normal');
    }
  },
});

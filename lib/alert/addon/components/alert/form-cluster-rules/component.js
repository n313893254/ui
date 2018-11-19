import { get, set } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';
import EmberObject from '@ember/object';
import layout from './template';

export default Component.extend({
  globalStore:       service(),
  scope:             service(),
  condictions:       [],
  layout,
  editing:           true,
  monitoringEnabled: false,

  clusterId:   reads('scope.currentCluster.id'),
  monitoringEnabled: reads('scope.currentCluster.enableClusterMonitoring'),

  init() {
    this._super(...arguments);
    const resourceKinds = get(this, 'globalStore')
      .getById('schema', 'eventrule')
      .optionsFor('resourceKind').sort()
      .map((value) => ({
        label: value,
        value,
      }));
    const systemServices = get(this, 'globalStore')
      .getById('schema', 'systemservicerule')
      .optionsFor('condition').sort()
      .map((value) => ({
        label: value,
        value,
      }));

    this.set('resourceKinds', resourceKinds);
    this.set('systemServices', systemServices);
    const condictions = get(this, 'condictions') || []

    if (condictions.length === 0) {
      this.addCondiction()
    }
  },

  actions: {
    addRule() {
      console.log('addCondiction')
      const rule = EmberObject.create({
        host:        '',
        new:         true,
        paths:       {},
        operator:    'above',
        threshold:   null,
        chartOption: {},
      });

      get(this, 'condictions').pushObject(rule);
    },

    removeRule(rule) {
      console.log(rule, 'removeRule')
      get(this, 'condictions').removeObject(rule);
    },

    enbaleMonitoring() {
      set(this, 'monitoringEnabled', true)
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

  setEventType(t) {
    if (t === 'warningEvent') {
      set(this, 'model.eventRule.eventType', 'Warning');
    }
    if (t === 'normalEvent') {
      set(this, 'model.eventRule.eventType', 'Normal');
    }
  },

  addCondiction() {
    this.send('addRule')
  },
});

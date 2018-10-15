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

  clusterId:         reads('scope.currentCluster.id'),
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
    const alertRules = get(this, 'alertRules') || []

    if (alertRules.length === 0) {
      this.addCondiction()
    }
  },

  actions: {
    addRule() {
      const rule = this.getNewProjectAlert()

      get(this, 'alertRules').pushObject(rule);
    },

    removeRule(rule) {
      get(this, 'alertRules').removeObject(rule);
    },

    enbaleMonitoring() {
      set(this, 'monitoringEnabled', true)
    },
  },

  nodes: computed('clusterId', function() {
    const clusterId = get(this, 'clusterId');

    return get(this, 'globalStore').all('node').filterBy('clusterId', clusterId);
  }),

  addCondiction() {
    this.send('addRule')
  },

  getNewProjectAlert() {
    const gs = get(this, 'globalStore');
    const projectId = get(this, 'scope.currentProject.id')
    const podRule = gs.createRecord({ type: 'podRule' });
    const workloadRule = gs.createRecord({ type: 'workloadRule' });
    const metricRule = gs.createRecord({ type: 'metricRule' })

    const opt = {
      type:                  'projectAlertRule',
      projectId,
      displayName:           null,
      initialWaitSeconds:    180,
      repeatIntervalSeconds: 3600,
      targetName:            null,

      podRule,
      workloadRule,
      metricRule,
    };

    const newAlert = gs.createRecord(opt);

    return newAlert;
  },
});

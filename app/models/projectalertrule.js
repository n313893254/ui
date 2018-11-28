import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import alertMixin from 'ui/mixins/model-alert';

const projectAlertRule = Resource.extend(alertMixin, {
  intl:         service(),
  projectStore: service('store'),
  canClone:     true,

  type:              'projectAlertRule',
  // _targetType is used for edit,
  _targetType: 'pod',

  displayTargetType: function() {
    const t = get(this, 'targetType');
    const intl = get(this, 'intl');

    return intl.t(`alertPage.targetTypes.${ t }`);
  }.property('targetType'),

  podName: computed('podRule.podId', function() {
    const id = get(this, 'podRule.podId');
    const pod = get(this, 'projectStore').all('pod').filterBy('id', id).get('firstObject');

    if (!pod) {
      return null;
    }

    return pod.get('displayName');
  }),

  workloadName: computed('workloadRule.workloadId', function() {
    const id = get(this, 'workloadRule.workloadId');
    const workload = get(this, 'projectStore').all('workload').filterBy('id', id).get('firstObject');

    if (!workload) {
      return null;
    }

    return workload.get('displayName');
  }),

  displayCondition: computed('targetType', 'podRule.{condition,restartTimes,restartIntervalSeconds}', 'workloadRule.{availablePercentage}', function() {
    const t = get(this, 'targetType');
    const intl = get(this, 'intl');

    if (t === 'pod') {
      const c = get(this, 'podRule.condition');

      if (c === 'restarts') {
        const times = get(this, 'podRule.restartTimes');
        const interval = get(this, 'podRule.restartIntervalSeconds');

        return intl.t('alertPage.index.table.displayCondition.restarted', {
          times,
          interval: interval / 60
        });
      }
      if (c === 'notscheduled') {
        return intl.t('alertPage.index.table.displayCondition.notScheduled');
      }
      if (c === 'notrunning') {
        return intl.t('alertPage.index.table.displayCondition.notRunning');
      }

      return intl.t('alertPage.na');
    }
    if (t === 'workload' || t === 'workloadSelector') {
      const percent = get(this, 'workloadRule.availablePercentage');

      return intl.t('alertPage.index.table.displayCondition.available', { percent });
    }
  }),

  targetType: computed('podRule.{podId}', 'workloadRule.{workloadId,selector}', 'metricRule.expression', function() {
    const tp = get(this, 'podRule');
    const tw = get(this, 'workloadRule');
    const metric = get(this, 'metricRule')

    if (tp && tp.podId) {
      return 'pod';
    }
    if (tw && tw.workloadId) {
      return 'workload'
    }
    if (tw && tw.selector) {
      return 'workloadSelector';
    }
    if (metric && metric.expression) {
      return 'metric'
    }
  }),

  actions: {
    clone() {
      get(this, 'router').transitionTo('authenticated.project.alert.new', { queryParams: { id: get(this, 'id'),  } });
    }
  },

});

export default projectAlertRule;

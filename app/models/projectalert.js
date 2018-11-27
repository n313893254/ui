import Resource from 'ember-api-store/models/resource';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import alertMixin from 'ui/mixins/model-alert';

const ProjectAlert = Resource.extend(alertMixin, {
  intl:         service(),
  projectStore: service('store'),
  canClone:     true,

  type:              'projectalert',
  // _targetType is used for edit,
  _targetType: 'pod',

  displayTargetType: function() {
    const t = get(this, 'targetType');
    const intl = get(this, 'intl');

    return intl.t(`alertPage.targetTypes.${ t }`);
  }.property('targetType'),

  podName: function() {
    const id = get(this, 'podRule.podId');
    const pod = get(this, 'projectStore').all('pod').filterBy('id', id).get('firstObject');

    if (!pod) {
      return null;
    }

    return pod.get('displayName');
  }.property('podRule.podId'),

  workloadName: function() {
    const id = get(this, 'targetWorkload.workloadId');
    const workload = get(this, 'projectStore').all('workload').filterBy('id', id).get('firstObject');

    if (!workload) {
      return null;
    }

    return workload.get('displayName');
  }.property('targetWorkload.workloadId'),

  displayCondition: function() {
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
      const percent = get(this, 'targetWorkload.availablePercentage');

      return intl.t('alertPage.index.table.displayCondition.available', { percent });
    }
  }.property('targetType', 'podRule.{condition,restartTimes,restartIntervalSeconds}', 'targetWorkload.{availablePercentage}'),

  targetType: function() {
    const tp = get(this, 'podRule');
    const tw = get(this, 'targetWorkload');

    if (tp && tp.podId) {
      return 'pod';
    }
    if (tw && tw.workloadId) {
      return 'workload'
    }
    if (tw && tw.selector) {
      return 'workloadSelector';
    }
  }.property('podRule.{podId}', 'targetWorkload.{workloadId,selector}'),

  actions: {
    clone() {
      get(this, 'router').transitionTo('authenticated.project.alert.new', { queryParams: { id: get(this, 'id'),  } });
    }
  },

});

export default ProjectAlert;

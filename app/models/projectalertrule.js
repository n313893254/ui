import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Alert from 'ui/mixins/model-alert';

const projectAlertRule = Resource.extend(Alert, {
  intl:         service(),
  projectStore: service('store'),

  canClone:     true,
  canEdit:      true,

  type:        'projectAlertRule',
  _targetType: 'pod',

  displayTargetType: computed('targetType', function() {
    return get(this, 'intl').t(`alertPage.targetTypes.${ get(this, 'targetType') }`);
  }),

  podName: computed('podRule.podId', function() {
    const id = get(this, 'podRule.podId');
    const pod = get(this, 'projectStore').all('pod').filterBy('id', id).get('firstObject');

    if (!pod) {
      return null;
    }

    return get(pod, 'displayName')
  }),

  workloadName: computed('workloadRule.workloadId', function() {
    const id = get(this, 'workloadRule.workloadId');
    const workload = get(this, 'projectStore').all('workload').filterBy('id', id).get('firstObject');

    if (!workload) {
      return null;
    }

    return get(workload, 'displayName')
  }),

  displayCondition: computed('targetType', 'podRule.{condition,restartTimes,restartIntervalSeconds}', 'workloadRule.availablePercentage', function() {
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

    if (t === 'metric') {
      const metricRule = get(this, 'metricRule')

      return `${ intl.t(`alertPage.comparison.${ metricRule.comparison }`) } ${ metricRule.thresholdValue }`
    }
  }),

  targetType: computed('podRule.podId', 'workloadRule.{workloadId,selector}', 'metricRule.expression', function() {
    if ( get(this, 'podRule.podId') ) {
      return 'pod';
    }
    if ( get(this, 'workloadRule.workloadId') ) {
      return 'workload'
    }
    if ( get(this, 'workloadRule.selector') ) {
      return 'workloadSelector';
    }
    if ( get(this, 'metricRule.expression') ) {
      return 'metric'
    }
  }),

  actions: {
    clone() {
      get(this, 'router').transitionTo('authenticated.project.alert.new-rule', get(this, 'groupId'), { queryParams: { id: get(this, 'id'),  } });
    },
    edit() {
      get(this, 'router').transitionTo('authenticated.project.alert.edit-rule', get(this, 'groupId'), get(this, 'id'));
    },
  },

});

export default projectAlertRule;

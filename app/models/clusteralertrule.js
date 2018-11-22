import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import alertMixin from 'ui/mixins/model-alert';

const clusterAlertRule = Resource.extend(alertMixin, {
  intl:       service(),
  type: 'clusterAlertRule',

  _targetType: 'systemService',

  canClone: true,

  init(...args) {
    this._super(...args);
  },

  validationErrors() {
    let errors = [];

    return errors;
  },

  targetType: computed('systemServiceRule.{condition}', 'nodeRule.{nodeId,selector}', 'eventRule.{resourceKind}', 'metricRule.{expression}', function() {
    const systemServiceRule = get(this, 'systemServiceRule');
    const nodeRule = get(this, 'nodeRule');
    const eventRule = get(this, 'eventRule');
    const metricRule = get(this, 'metricRule');

    if (systemServiceRule && systemServiceRule.condition) {
      return 'systemService';
    }
    if (nodeRule && nodeRule.nodeId) {
      return 'node'
    }
    if (nodeRule && nodeRule.selector) {
      return 'nodeSelector';
    }
    if (eventRule && eventRule.resourceKind) {
      return 'event';
    }
    if (metricRule && metricRule.expression) {
      return 'metric'
    }
  }),

  displayTargetType: function() {
    const t = get(this, 'targetType');
    const intl = get(this, 'intl');

    return intl.t(`alertPage.targetTypes.${ t }`);
  }.property('targetType'),

  displayCondition: function() {
    const t = get(this, 'targetType');
    const intl = get(this, 'intl');

    if (t === 'systemService') {
      return intl.t('alertPage.index.table.displayCondition.unhealthy');
    }
    if (t === 'event') {
      return intl.t('alertPage.index.table.displayCondition.happens');
    }
    if (t === 'node' || t === 'nodeSelector') {
      const c = get(this, 'targetNode.condition');

      if (c === 'notready') {
        return intl.t('alertPage.index.table.displayCondition.notReady');
      }
      if (c === 'cpu') {
        const n = get(this, 'targetNode.cpuThreshold');

        return intl.t('alertPage.index.table.displayCondition.cpuUsage', { percent: n });
      }
      if (c === 'mem') {
        const n = get(this, 'targetNode.memThreshold');

        return intl.t('alertPage.index.table.displayCondition.memUsage', { percent: n });
      }
    }

    return intl.t('alertPage.na');
  }.property('targetType', 'targetNode.{condition,cpuThreshold,memThreshold}'),

  threshold: function() {
    const t = get(this, 'targetType');
    const c = get(this, 'targetNode.condition');

    if (t === 'node' || t === 'nodeSelector') {
      if (c === 'cpu') {
        return get(this, 'targetNode.cpuThreshold');
      }
      if (c === 'mem') {
        return get(this, 'targetNode.memThreshold');
      }
    }

    return null;
  }.property('targetType', 'targetNode.{memThreshold,cpuThreshold,condition}'),

  actions: {
    clone() {
      get(this, 'router').transitionTo('authenticated.cluster.alert.new', { queryParams: { id: get(this, 'id'),  } });
    }
  },

});

export default clusterAlertRule;

import Resource from 'ember-api-store/models/resource';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import alertMixin from 'ui/mixins/model-alert';

const clusterAlertRule = Resource.extend(alertMixin, {
  intl:       service(),
  type: 'clusteralert',

  _targetType: 'systemService',

  canClone: true,

  init(...args) {
    this._super(...args);
  },

  validationErrors() {
    let errors = [];

    return errors;
  },

  targetType: function() {
    const targetSystemService = get(this, 'systemServiceRule');
    const targetNode = get(this, 'nodeRule');
    const targetEvent = get(this, 'eventRule');

    if (targetSystemService && targetSystemService.condition) {
      return 'systemService';
    }
    if (targetNode && targetNode.nodeId) {
      return 'node'
    }
    if (targetNode && targetNode.selector) {
      return 'nodeSelector';
    }
    if (targetEvent && targetEvent.resourceKind) {
      return 'event';
    }
  }.property('systemServiceRule.{condition}', 'nodeRule.{nodeId,selector}', 'eventRule.{resourceKind}'),

  displayTargetType: function() {
    const t = get(this, 'targetType');
    console.log(t, 't')
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

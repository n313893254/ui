import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get, setProperties, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed'

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  growl:       service(),

  pageScope:   reads('scope.currentPageScope'),

  model(params) {
    const pageScope = get(this, 'pageScope');
    const ruleId = params.rule_id;
    const groupId = params.group_id;

    if (pageScope === 'cluster') {
      const cluster = window.l('route:application').modelFor('authenticated.cluster');
      const clusterId = cluster.get('id');

      return this.loadClusterResource({
        clusterId,
        ruleId,
        groupId,
      });
    } else {
      const project = window.l('route:application').modelFor('authenticated.project').get('project');
      const projectId = project.get('id');
      const clusterId = project.get('clusterId');

      return this.loadProjectResource({
        projectId,
        clusterId,
        ruleId,
        groupId,
      });
    }
  },
  isMonitoringEnabled() {
    const ps = get(this, 'pageScope');

    if (ps === 'cluster') {
      return get(this, 'scope.currentCluster.enableClusterMonitoring')
    } else {
      return get(this, 'scope.currentProject.enableProjectMonitoring')
    }
  },

  getNewClusterAlert(alert) {
    const gs = get(this, 'globalStore');

    const nodeRule = gs.createRecord({ type: 'nodeRule' });
    const systemServiceRule = gs.createRecord({ type: 'systemServiceRule' });
    const eventRule = gs.createRecord({ type: 'eventRule' });
    const metricRule = gs.createRecord({
      type:           'metricRule',
      comparison:     'greater-than',
      duration:       '5m',
      thresholdValue: 0,
    })

    const t = get(alert, 'targetType');

    if (t === 'event') {
      const et = get(alert, 'eventRule.eventType');

      if (et === 'Normal') {
        set(alert, '_targetType', 'normalEvent');
      }
      if (et === 'Warning') {
        set(alert, '_targetType', 'warningEvent');
      }
    } else {
      set(alert, '_targetType', t);
    }

    if (t === 'node' || t === 'nodeSelector') {
      setProperties(alert, {
        eventRule,
        systemServiceRule,
        metricRule,
      });
    }
    if (t === 'systemService') {
      setProperties(alert, {
        nodeRule,
        eventRule,
        metricRule,
      });
    }
    if (t === 'event') {
      setProperties(alert, {
        nodeRule,
        systemServiceRule,
        metricRule,
      });
    }
    if (t === 'metric') {
      setProperties(alert, {
        nodeRule,
        systemServiceRule,
        eventRule,
      })
    }

    return alert;
  },

  loadClusterResource({
    clusterId, ruleId, groupId
  }) {
    const globalStore = get(this, 'globalStore');
    const opt = { filter: { clusterId } };
    let metrics

    if (this.isMonitoringEnabled()) {
      metrics = globalStore.rawRequest({
        url:    `monitormetrics?action=listclustermetricname&limit=-1`,
        method: 'POST',
        data:   { clusterId, }
      }).catch((err = {}) => {
        get(this, 'growl').fromError(get(err, 'body.message'));
      });
    }

    return hash({
      nodes:      globalStore.findAll('node', opt),
      notifiers:  globalStore.findAll('notifier'),
      alertRule:  globalStore.find('clusterAlertRule', ruleId),
      alertGroup:   globalStore.find('clusterAlertGroup', groupId),
      metrics,
    }).then(({
      nodes, notifiers, alertRule, metrics, alertGroup
    }) => {
      return {
        nodes,
        notifiers,
        alertGroup,
        alertRule: this.getNewClusterAlert(alertRule.clone()),
        metrics:    metrics && metrics.body && metrics.body.names,
      }
    });
  },

  getNewProjectAlert(alert) {
    const gs = get(this, 'globalStore');
    const podRule = gs.createRecord({ type: 'podRule' });
    const workloadRule = gs.createRecord({ type: 'workloadRule' });
    const metricRule = gs.createRecord({
      type:           'metricRule',
      comparison:     'greater-than',
      duration:       '5m',
      thresholdValue:  0,
    })

    const t = get(alert, 'targetType');

    set(alert, '_targetType', t);

    switch (t) {
    case 'pod':
      setProperties(alert, {
        metricRule,
        workloadRule,
      })
      break;
    case 'workload':
    case 'workloadSelector':
      setProperties(alert, {
        podRule,
        metricRule,
      })
      break;
    case 'metric':
      setProperties(alert, {
        podRule,
        workloadRule,
      })
      break;
    }

    return alert;
  },

  loadProjectResource({
    clusterId, projectId, groupId, ruleId
  }) {
    const store = get(this, 'store');
    const globalStore = get(this, 'globalStore');
    const opt = { filter: { projectId } };
    let metrics

    if (this.isMonitoringEnabled()) {
      metrics = globalStore.rawRequest({
        url:    `monitormetrics?action=listprojectmetricname&limit=-1`,
        method: 'POST',
        data:   { projectId, }
      }).catch((err = {}) => {
        get(this, 'growl').fromError(get(err, 'body.message'));
      });
    }

    return hash({
      pods:         store.find('pod', null),
      statefulsets: store.findAll('statefulset', opt),
      daemonsets:   store.findAll('daemonset', opt),
      deployments:  store.findAll('deployment', opt),
      notifiers:    globalStore.findAll('notifier', { filter: { clusterId } }),
      metrics,
      alertRule:    globalStore.find('projectAlertRule', ruleId),
      alertGroup:   globalStore.find('projectAlertGroup', groupId),
    }).then(({
      pods, statefulsets, daemonsets, deployments, notifiers, metrics, alertRule, alertGroup
    }) => {
      return {
        pods,
        statefulsets,
        daemonsets,
        deployments,
        notifiers,
        metrics:    metrics && metrics.body && metrics.body.names,
        alertGroup,
        alertRule: this.getNewProjectAlert(alertRule.clone()),
      }
    });
  },

});

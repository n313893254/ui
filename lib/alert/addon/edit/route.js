import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed'

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  pageScope:   reads('scope.currentPageScope'),


  model(params) {
    const pageScope = get(this, 'pageScope');
    const groupId = params.alert_id;

    if (pageScope === 'cluster') {
      const cluster = window.l('route:application').modelFor('authenticated.cluster');
      const clusterId = cluster.get('id');

      return this.loadClusterResource({
        clusterId,
        groupId
      });
    } else {
      const project = window.l('route:application').modelFor('authenticated.project').get('project');
      const projectId = project.get('id');
      const clusterId = project.get('clusterId');

      return this.loadProjectResource({
        projectId,
        clusterId,
        groupId
      });
    }
  },
  getNewClusterAlert(alert) {
    const gs = get(this, 'globalStore');

    const nodeRule = gs.createRecord({ type: 'nodeRule' });
    const systemServiceRule = gs.createRecord({ type: 'systemServiceRule' });
    const eventRule = gs.createRecord({ type: 'eventRule' });
    const metricRule = gs.createRecord({ type: 'metricRule' })

    const recipients = [
      gs.createRecord({ type: 'recipient' }),
    ];

    const t = alert.get('targetType');

    if (t === 'event') {
      const et = alert.get('eventRule.eventType');

      if (et === 'Normal') {
        alert.set('_targetType', 'normalEvent');
      }
      if (et === 'Warning') {
        alert.set('_targetType', 'warningEvent');
      }
    } else {
      alert.set('_targetType', t);
    }

    if (t === 'node' || t === 'nodeSelector') {
      alert.setProperties({
        eventRule,
        systemServiceRule,
        metricRule,
      });
    }
    if (t === 'systemService') {
      alert.setProperties({
        nodeRule,
        eventRule,
        metricRule,
      });
    }
    if (t === 'event') {
      alert.setProperties({
        nodeRule,
        systemServiceRule,
        metricRule,
      });
    }

    return alert;
  },

  loadClusterResource({ clusterId, groupId }) {
    const globalStore = get(this, 'globalStore');
    const opt = { filter: { clusterId } };
    const metrics = globalStore.rawRequest({
      url:    `monitormetrics?action=listclustermetricname&limit=3000`,
      method: 'POST',
      data:   { clusterId, }
    }).catch(() => 'catch')

    return hash({
      nodes:      globalStore.findAll('node', opt),
      notifiers:  globalStore.findAll('notifier'),
      alertRules: globalStore.find('clusterAlertRule'),
      alertGroup: globalStore.find('clusterAlertGroup', groupId),
      metrics,
    }).then(({
      nodes, notifiers, alertRules, alertGroup, metrics
    }) => {
      return {
        nodes,
        notifiers,
        alertRules: alertRules.filter((g) => g.groupId === groupId).map((a) => {
          const alert = a.clone()

          return this.getNewClusterAlert(alert)
        }),
        alertGroup: alertGroup.clone(),
        metrics:    metrics && metrics.body && metrics.body.names,
      }
    });
  },

  getNewProjectAlert(alert) {
    const gs = get(this, 'globalStore');
    const podRule = gs.createRecord({ type: 'podRule' });
    const workloadRule = gs.createRecord({ type: 'workloadRule' });
    const metricRule = gs.createRecord({ type: 'metricRule' })

    const t = alert.get('targetType');

    alert.set('_targetType', t);

    if (t === 'pod') {
      alert.set('workloadRule', workloadRule);
    }
    if (t === 'workload' || t === 'workloadSelector') {
      alert.set('podRule', podRule);
    }

    return alert;
  },

  loadProjectResource({
    clusterId, projectId, groupId
  }) {
    const store = get(this, 'store');
    const globalStore = get(this, 'globalStore');
    const opt = { filter: { projectId } };
    const metrics = globalStore.rawRequest({
      url:    `monitormetrics?action=listclustermetricname&limit=3000`,
      method: 'POST',
      data:   { projectId, }
    }).catch(() => 'catch')

    return hash({
      pods:         store.find('pod', null),
      statefulsets: store.findAll('statefulset', opt),
      daemonsets:   store.findAll('daemonset', opt),
      deployments:  store.findAll('deployment', opt),
      notifiers:    globalStore.findAll('notifier', { filter: { clusterId } }),
      metrics,
      alertRules:   globalStore.find('projectAlertRule'),
      alertGroup:   globalStore.find('projectAlertGroup', groupId),
    }).then(({
      pods, statefulsets, daemonsets, deployments, notifiers, metrics, alertRules, alertGroup
    }) => {

      return {
        pods,
        statefulsets,
        daemonsets,
        deployments,
        notifiers,
        metrics:    metrics && metrics.body && metrics.body.names,
        alertRules: alertRules.filter((g) => g.groupId === groupId).map((a) => {
          const alert = a.clone()

          return this.getNewProjectAlert(alert)
        }),
        alertGroup: alertGroup.clone(),
      }
    });
  },

});

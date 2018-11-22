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
  getNewClusterAlert({ alertId }) {
    const gs = get(this, 'globalStore');

    const targetNode = gs.createRecord({ type: 'nodeRule' });
    const targetSystemService = gs.createRecord({ type: 'systemServiceRule' });
    const targetEvent = gs.createRecord({ type: 'eventRule' });

    const recipients = [
      gs.createRecord({ type: 'recipient' }),
    ];

    return gs.find('clusterAlertRule', alertId).then((alert) => {
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
      if (!alert.get('recipients')) {
        alert.set('recipients', recipients);
      }
      if (t === 'node' || t === 'nodeSelector') {
        alert.setProperties({
          targetEvent,
          targetSystemService,
        });
      }
      if (t === 'systemService') {
        alert.setProperties({
          targetNode,
          targetEvent,
        });
      }
      if (t === 'event') {
        alert.setProperties({
          targetNode,
          targetSystemService,
        });
      }

      return alert;
    });
  },

  loadClusterResource({ clusterId, groupId }) {
    const globalStore = get(this, 'globalStore');
    // const newAlert = this.getNewClusterAlert({ alertId });

    const opt = { filter: { clusterId } };

    return hash({
      nodes:     globalStore.findAll('node', opt),
      notifiers: globalStore.findAll('notifier'),
      alertRules: globalStore.findAll('clusterAlertRule', { filter: { groupId } }),
      alertGroup: globalStore.find('clusterAlertGroup', groupId),
    });
  },

  getNewProjectAlert({ alertId }) {
    const gs = get(this, 'globalStore');
    const targetPod = gs.createRecord({ type: 'targetPod' });
    const targetWorkload = gs.createRecord({ type: 'targetWorkload' });
    const recipients = [
      gs.createRecord({ type: 'recipient' }),
    ];

    return gs.find('projectAlert', alertId).then((alert) => {
      const t = alert.get('targetType');

      alert.set('_targetType', t);
      if (!alert.get('recipients')) {
        alert.set('recipients', recipients)
      }
      if (t === 'pod') {
        alert.set('targetWorkload', targetWorkload);
      }
      if (t === 'workload' || t === 'workloadSelector') {
        alert.set('targetPod', targetPod);
      }

      return alert;
    });
  },

  loadProjectResource({
    clusterId, projectId, alertId
  }) {
    const store = get(this, 'store');
    const globalStore = get(this, 'globalStore');
    const newAlert = this.getNewProjectAlert({
      projectId,
      alertId
    });
    const opt = { filter: { projectId } };

    return hash({
      pods:         store.find('pod', null),
      statefulsets: store.findAll('statefulset', opt),
      daemonsets:   store.findAll('daemonset', opt),
      deployments:  store.findAll('deployment', opt),
      notifiers:    globalStore.findAll('notifier', { filter: { clusterId } }),
      newAlert,
    });
  },

});

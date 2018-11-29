import Route from '@ember/routing/route';
import { hash, resolve } from 'rsvp';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed'

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  pageScope:   reads('scope.currentPageScope'),

  model(params, transition) {
    const pageScope = get(this, 'pageScope');

    if ( pageScope === 'cluster' ) {
      const clusterId = transition.params['authenticated.cluster'].cluster_id;

      return this.loadClusterResource(clusterId, get(params, 'id'));
    } else {
      const projectId = transition.params['authenticated.project'].project_id;
      const clusterId = projectId.split(':');

      return this.loadProjectResource({
        projectId,
        clusterId,
        id: get(params, 'id')
      });
    }
  },

  resetController(controller, isExiting/* , transition*/) {
    if ( isExiting ) {
      set(controller, 'id', null);
    }
  },

  getNewClusterAlert(clusterId) {
    const gs = get(this, 'globalStore');

    const nodeRule = gs.createRecord({ type: 'nodeRule' });
    const systemServiceRule = gs.createRecord({ type: 'systemServiceRule' });
    const eventRule = gs.createRecord({ type: 'eventRule' });
    const metricRule = gs.createRecord({
      type: 'metricRule',
      comparison: 'equal',
     })

    const opt = {
      type:     'clusterAlertRule',
      clusterId,
      nodeRule,
      eventRule,
      systemServiceRule,
      metricRule,
      severity: 'critical',
    };
    const newAlert = gs.createRecord(opt);

    return resolve([newAlert]);
  },

  loadClusterResource(clusterId, id) {
    const globalStore = get(this, 'globalStore');
    let newAlert;

    if ( id ) {
      newAlert = globalStore.find('clusterAlertRule', id)
        .then( ( alert ) => {
          const cloned =  alert.cloneForNew() ;
          const t = get(cloned, 'targetType');

          if ( t === 'event' ) {
            const et = get(cloned, 'eventRule.eventType');

            if ( et === 'Normal' ) {
              set(cloned, '_targetType', 'normalEvent');
            }
            if ( et === 'Warning' ) {
              set(cloned, '_targetType', 'warningEvent');
            }
          } else {
            set(cloned, '_targetType', t);
          }

          if ( !get(cloned, 'recipients') ) {
            set(cloned, 'recipients', [
              globalStore.createRecord({ type: 'recipient' }),
            ]);
          }

          return cloned;
        });
    } else {
      newAlert = this.getNewClusterAlert(clusterId);
    }

    const opt = { filter: { clusterId } };
    const cluster = globalStore.findAll('cluster', { filter: { clusterId } })
    const metrics = globalStore.rawRequest({
      url:    `monitormetrics?action=listclustermetricname&limit=3000`,
      method: 'POST',
      data:   { clusterId, }
    }).catch((err) => console.log(err))

    return hash({
      nodes:      globalStore.findAll('node', opt),
      notifiers:  globalStore.findAll('notifier', opt),
      // newAlert,
      metrics,
      alertRules: this.getNewClusterAlert(),
      alertGroup: globalStore.createRecord({ type: 'clusterAlertGroup' }),
    }).then((hash) => {
      return {
        nodes:      hash.nodes,
        notifiers:  hash.notifiers,
        // newAlert:  hash.newAlert,
        metrics:    hash.metrics && hash.metrics.body && hash.metrics.body.names,
        alertRules: hash.alertRules,
        alertGroup: hash.alertGroup,
      }
    }).catch((err) => console.log(err));
  },

  getNewProjectAlert(projectId) {
    const gs = get(this, 'globalStore');

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

    return resolve([newAlert]);
  },

  loadProjectResource({
    clusterId, projectId, id
  }) {
    const store = get(this, 'store');
    const globalStore = get(this, 'globalStore');
    const metrics = globalStore.rawRequest({
      url:    `monitormetrics?action=listprojectmetricname&limit=3000`,
      method: 'POST',
      data:   { projectId, }
    }).catch((err) => console.log(err))

    let newAlert;

    if ( id ) {
      newAlert = globalStore.find('projectAlertRule', id)
        .then( ( alert ) => {
          const cloned = alert.cloneForNew() ;
          const t = get(cloned, 'targetType');

          set(cloned, '_targetType', t);
          if ( !get(cloned, 'recipients') ) {
            set(cloned, 'recipients', [
              globalStore.createRecord({ type: 'recipient' }),
            ]);
          }

          if ( t === 'pod' ) {
            set(cloned, 'workloadRule',  globalStore.createRecord({ type: 'workloadRule' }) );
          }
          if ( t === 'workload' || t === 'workloadSelector' ) {
            set(cloned, 'podRule', globalStore.createRecord({ type: 'podRule' }));
          }

          return cloned;
        });
    } else {
      newAlert = this.getNewProjectAlert(projectId);
    }

    const opt = { filter: { projectId } };

    return hash({
      pods:       store.findAll('pod', opt),
      workloads:  store.findAll('workload', opt),
      notifiers:  globalStore.findAll('notifier', { filter: { clusterId } }),
      alertRules: this.getNewProjectAlert(),
      alertGroup: globalStore.createRecord({ type: 'projectAlertGroup' }),
      metrics,
    }).then(({
      pods, workloads, notifiers, alertRules, alertGroup, metrics
    }) => {
      return {
        metrics:    metrics && metrics.body && metrics.body.names,
        pods,
        workloads,
        notifiers,
        alertRules,
        alertGroup,
      }
    });
  },

});

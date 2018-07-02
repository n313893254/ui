import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get, set } from '@ember/object'
import { inject as service } from '@ember/service';
import { on } from '@ember/object/evented';
import C from 'ui/utils/constants';

export default Route.extend({
  globalStore: service(),

  createMonitoring(MonitoringType) {
    const gs = get(this, 'globalStore')
    const newMonitoring = gs.createRecord({
      type: MonitoringType,
      retention: '15d',
      metricsServerEnabled: true,
      pvcConfig: gs.createRecord({
        type: 'persistentVolumeClaimSpec',
        // resources: gs.createRecord({
        //   type: 'resourceRequirements',
        // }),
        // selector: gs.createRecord({
        //   type: 'labelSelector',
        // })
      })
    })
    return newMonitoring
  },

  model(params, transition) {
    const globalStore = get(this, 'globalStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;
    const opt = {
      filter: {
        clusterId,
      },
    };

    let mode = 'edit'
    return globalStore.find('clusterMonitoring', null, {forceReload: true}).then(monitorings => {
      const filter = monitorings.filter(m => m.clusterId === clusterId) || []
      let monitoring = monitorings.filterBy('clusterId', clusterId).get('firstObject');
      if (!monitoring) {
        monitoring = this.createMonitoring('clusterMonitoring');
        mode = 'new'
      }
      const clone = monitoring.clone();

      return {
        monitoring: clone,
        originalMonitoring: monitoring,
        mode,
      };
    });
  },

  setDefaultRoute: on('activate', function() {
    set(this, `session.${C.SESSION.CLUSTER_ROUTE}`,'authenticated.cluster.monitor');
  }),

  actions: {
    refreshModel() {
      this.refresh();
    }
  },
});

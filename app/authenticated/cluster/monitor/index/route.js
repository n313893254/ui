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
      pvcConfig: gs.createRecord({
        type: 'persistentVolumeClaimSpec',
        resources: gs.createRecord({
          type: 'resourceRequirements',
        }),
        selector: gs.createRecord({
          type: 'labelSelector',
        })
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

    return globalStore.findAll('clusterMonitoring', opt).then(monitorings => {
      let monitoring = monitorings.filterBy('clusterId', clusterId).get('firstObject');
      if (!monitoring) {
        monitoring = this.createMonitoring('clusterMonitoring');
      }
      const clone = monitoring.clone();
      return {
        monitoring: clone,
        originalMonitoring: monitoring,
      };
    });
  },

  setDefaultRoute: on('activate', function() {
    set(this, `session.${C.SESSION.CLUSTER_ROUTE}`,'authenticated.cluster.monitor');
  }),
});

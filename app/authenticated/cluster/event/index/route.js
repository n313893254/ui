import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore: service(),
  k8sStore:    service(),

  model(params, transition) {

    const k8sStore = this.get('k8sStore')
    const cs = get(this, 'globalStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;

    return hash({
      clusterEventLogs: k8sStore.findAll('huaWeiClusterEventLog', {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
        forceReload: true,
        depaginate: false,
        filter:{
          clusterEventId: clusterId,
        }
      })
      // clusterEventLogs: []
    })
  },
});

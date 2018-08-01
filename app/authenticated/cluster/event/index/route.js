import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore: service(),
  k8sStore:    service(),
  clusterStore:    service(),

  model(params, transition) {
    const k8sStore = this.get('k8sStore')
    const clusterStore = get(this, 'clusterStore');
    const cs = get(this, 'globalStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;

    return hash({
      clusterEventLogs: k8sStore.find('huaWeiClusterEventLog', null, {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
        forceReload: true,
        filter:{
          clusterEventId: clusterId,
        }
      }),
      namespaces: clusterStore.findAll('namespace'),
      project: cs.findAll('project'),
    })
  },
});

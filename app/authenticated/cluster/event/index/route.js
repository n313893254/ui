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

    let cluster = this.modelFor('authenticated.cluster');

    if ( !get(cluster, 'isReady') ) {

      this.transitionTo('authenticated.cluster.index');

    }

    return hash({
      clusterEventLogs: k8sStore.find('huaWeiClusterEventLog', null, {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
        forceReload: true,
        depaginate: false,
        filter:{
          clusterEventId: clusterId,
        },
        sortOrder: 'desc',
        limit: 1000,
      }).catch(err => console.log(err)),
      namespaces: clusterStore.findAll('namespace'),
      projects: cs.findAll('project'),
      nodes: this.get('globalStore').findAll('node'),
    })
  },
});

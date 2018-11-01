import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),

  model(params, transition) {

    const k8sStore = this.get('k8sStore')
    const clusterStore = get(this, 'clusterStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;
    const globalStore = get(this, 'globalStore')

    return hash({
      hooks: clusterStore.findAll('nodeAutoScaler', {
        url:         `${ k8sStore.baseUrl }/nodeAutoScaler`,
        forceReload: true,
        filter:      { clusterId, }
      }),
      pageScope:           'cluster',
      clusterId,
      autoScalerTemplates: globalStore.findAll('autoScalerTemplate'),
    })

  },
});

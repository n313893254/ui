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
    const cs = get(this, 'globalStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;

    // return hash({
    //   clusterEventLogs: k8sStore.find('huaWeiClusterEventLog', null, {
    //     url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
    //     forceReload: true,
    //     filter:{
    //       clusterEventId: clusterId,
    //     }
    //   }),
    //   namespaces: clusterStore.findAll('namespace'),
    //   projects: cs.findAll('project'),
    // })

    // return k8sStore.find('huaWeiClusterEventLogSubscriber', null, { url: `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogSubscriber` }).then((subscribers) => {
    //
    //   let subscriber = subscribers.filterBy('clusterId', clusterId).get('firstObject');
    //   let mode = 'edit'
    //
    //   if (!subscriber) {
    //
    //     subscriber = this.createSubscriber('huaWeiClusterEventLogSubscriber');
    //     mode = 'new'
    //
    //   }
    //   const clone = subscriber.clone();
    //
    //   return {
    //     subscriber:         clone,
    //     mode,
    //     originalSubscriber: subscriber,
    //   };
    //
    // });

    return {
      subscriber: this.createSubscriber('huaWeiClusterEventLogSubscriber'),
      mode:       'new',
    }

  },
  createSubscriber(type) {

    const gs = get(this, 'globalStore');
    const k8sStore = this.get('k8sStore')
    const newSubscriber = k8sStore.createRecord({
      type,
      outputTags: {},
    });

    return newSubscriber;

  },

});

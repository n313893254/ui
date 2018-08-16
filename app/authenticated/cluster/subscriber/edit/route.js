import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  k8sStore:     service(),

  model(params) {

    const k8sStore = this.get('k8sStore')

    return hash({
      subscriber: k8sStore.find('huaWeiClusterEventLogSubscriber', null, {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogSubscriber`,
        forceReload: true
      }).then((subscribers) => {

        const s = subscribers.findBy('id', params.subscriber_id)

        if (!s) {

          this.replaceWith('authenticated.cluster.subscriber.index');

        }

        return s

      }),
      mode: 'edit',
    });

  },

});

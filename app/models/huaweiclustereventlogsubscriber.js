import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';

export default Resource.extend({
  type:     'huaWeiClusterEventLogSubscriber',
  router:   service(),
  k8sStore: service(),

  actions: {
    edit() {

      this.get('router').transitionTo('authenticated.cluster.subscriber.edit', this.get('id'));

    },
    goToApi() {

      let k8sStore = this.get('k8sStore') || {}

      window.open(`${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogSubscriber/${ this.get('id') }`, '_blank')

    },
  },

});

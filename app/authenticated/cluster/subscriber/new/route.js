import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),

  model() {

    return {
      subscriber: this.createSubscriber('huaWeiClusterEventLogSubscriber'),
      mode:       'new',
    }

  },
  createSubscriber(type) {

    const k8sStore = this.get('k8sStore')
    const newSubscriber = k8sStore.createRecord({
      type,
      outputTags: {},
    });

    return newSubscriber;

  },

});

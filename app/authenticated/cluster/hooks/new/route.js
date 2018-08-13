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

    return {
      receiver: this.createRecord('nodeAutoScaler'),
      mode: 'new',
    }

  },
  createRecord(type) {
    const k8sStore = this.get('k8sStore')
    const newRecord = k8sStore.createRecord({
      type,
      outputTags: {},
    });

    return newRecord;

  },

});

import Route from '@ember/routing/route';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),
  scope:        service(),

  model() {

    return {
      receiver: this.createRecord('nodeAutoScaler'),
      mode:     'new',
    }

  },
  createRecord(type) {

    const clusterStore = this.get('clusterStore')
    const clusterId = get(this, 'scope.currentCluster.id')
    const newRecord = clusterStore.createRecord({
      type,
      clusterId,
      outputTags: {},
    });

    return newRecord;

  },

});

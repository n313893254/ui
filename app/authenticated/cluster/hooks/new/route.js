import Route from '@ember/routing/route';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),
  scope:        service(),

  model() {

    const globalStore = get(this, 'globalStore')

    return hash({
      receiver:            this.createRecord('nodeAutoScaler'),
      mode:                'new',
      autoScalerTemplates: globalStore.findAll('autoScalerTemplate'),
    })

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

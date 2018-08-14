import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),
  scope:    service(),

  model(params, transition) {
    const store = get(this, 'store');
    const k8sStore = this.get('k8sStore')
    const cs = get(this, 'globalStore');

    return {
      receiver: this.createRecord('workloadWebhook'),
      mode: 'new',
    }

  },
  createRecord(type) {
    const store = get(this, 'store')
    const projectId = get(this, 'scope.currentProject.id')
    const newRecord = store.createRecord({
      type,
      projectId,
      outputTags: {},
    });

    return newRecord;

  },

});

import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),
  scope:        service(),

  model(params, transition) {

    const store = get(this, 'store');
    const projectId = transition.params['authenticated.project'].project_id;

    return hash({
      receiver:  this.createRecord('workloadAutoScaler', projectId),
      mode:      'new',
      pageScope: 'project',
      workloads:  store.findAll('workload'),
    })

  },
  createRecord(type, projectId) {

    const store = get(this, 'store')
    const newRecord = store.createRecord({
      type,
      projectId,
      outputTags: {},
    });

    return newRecord;

  },

});

import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),

  model(params, transition) {

    const store = get(this, 'store');
    const k8sStore = this.get('k8sStore')
    const projectId = transition.params['authenticated.project'].project_id;

    return hash({
      hooks: store.findAll('workloadAutoScaler', {
        url:         `${ k8sStore.baseUrl }/workloadAutoScaler`,
        forceReload: true,
      }),
      pageScope: 'project',
      projectId,
    })

  },
});

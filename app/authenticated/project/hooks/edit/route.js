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
    const clusterStore = get(this, 'clusterStore');
    const cs = get(this, 'globalStore');
    const projectId = transition.params['authenticated.project'].project_id;

    return hash({
      receiver: k8sStore.find('workloadAutoScaler', null, {
        url:         `${ k8sStore.baseUrl }/v3/workloadAutoScaler`,
        forceReload: true
      }).then((hooks) => {

        const s = hooks.findBy('id', params.hook_id)

        if (!s) {

          this.replaceWith('authenticated.project.hook.index');

        }

        return s

      }),
      mode:      'edit',
      pageScope: 'project',
      workloads:  store.findAll('workload'),
    })

  },

});

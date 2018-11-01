import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),

  model(params) {

    const store = get(this, 'store');
    const k8sStore = this.get('k8sStore')
    const globalStore = get(this, 'globalStore')

    return hash({
      receiver: k8sStore.find('workloadAutoScaler', null, {
        url:         `${ k8sStore.baseUrl }/workloadAutoScaler`,
        forceReload: true
      }).then((hooks) => {

        const s = hooks.findBy('id', params.hook_id)

        if (!s) {

          this.replaceWith('authenticated.project.hook.index');

        }

        return s

      }),
      mode:                'edit',
      pageScope:           'project',
      workloads:           store.findAll('workload'),
      autoScalerTemplates: globalStore.findAll('autoScalerTemplate'),
    })

  },

});

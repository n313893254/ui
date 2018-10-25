import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get } from '@ember/object'
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore:  service(),
  k8sStore:     service(),
  clusterStore:    service(),

  model(params) {

    const k8sStore = this.get('k8sStore')
    const clusterStore = get(this, 'clusterStore');
    const globalStore = get(this, 'globalStore')

    return hash({
      receiver: clusterStore.find('nodeAutoScaler', null, {
        url:         `${ k8sStore.baseUrl }/nodeAutoScaler`,
        forceReload: true
      }).then((hooks) => {

        const s = hooks.findBy('id', params.hook_id)

        if (!s) {

          this.replaceWith('authenticated.cluster.hooks.index');

        }

        return s

      }),
      mode: 'edit',
      autoScalerTemplates: globalStore.findAll('autoScalerTemplate'),
    })

  },
  createRecord(type) {

    const clusterStore = this.get('clusterStore')
    const newRecord = clusterStore.createRecord({
      type,
      outputTags: {},
    });

    return newRecord;

  },

});

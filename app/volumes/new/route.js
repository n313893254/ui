import { get } from '@ember/object';
import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  k8sStore: service(),
  clusterStore: service(),
  model(/* params, transition*/) {

    const store = get(this, 'store');
    const clusterStore = get(this, 'clusterStore');
    const k8sStore = get(this, 'k8sStore');

    return hash({
      persistentVolumes: clusterStore.findAll('persistentVolume'),
      storageClasses:    clusterStore.findAll('storageClass'),
      pvc:               store.createRecord({ type: 'persistentVolumeClaim', }),
      business:          clusterStore.findAll('business', {url:`${k8sStore.baseUrl}/v3/business`, forceReload: true}),
    });

  },
});

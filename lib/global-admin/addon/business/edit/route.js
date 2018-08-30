import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash/* , all */ } from 'rsvp';

export default Route.extend({
  access:       service(),
  catalog:      service(),
  settings:     service(),
  globalStore:  service(),
  k8sStore:     service(),
  roleTemplateService: service('roleTemplate'),
  clusterStore: service(),

  model(params) {
    let globalStore = this.get('globalStore');
    let k8sStore = this.get('k8sStore');
    let clusterStore = this.get('clusterStore');

    let cluster = globalStore.createRecord({
      type: 'cluster'
    });

    return hash({
      cluster,
      business: clusterStore.findAll('business', {url:`${k8sStore.baseUrl}/v3/business`, forceReload: true}).then(business => {
        const b = business.findBy('id', params.business_id)
        if (!b) {
          this.replaceWith('global-admin.business.index');
        }
        return b
      }),
      clusterRoleTemplateBinding: globalStore.findAll('clusterRoleTemplateBinding'),
      me:                         get(this, 'access.principal'),
      nodeDrivers:                globalStore.findAll('nodeDriver'),
      nodeTemplates:              globalStore.findAll('nodeTemplate'),
      psps:                       globalStore.findAll('podSecurityPolicyTemplate'),
      roleTemplates:              get(this, 'roleTemplateService').fetchFilteredRoleTemplates(),
      users:                      globalStore.findAll('user'),
    });
  },

  setupController(controller/*, model*/) {
    this._super(...arguments);
    set(controller, 'step', 1);
  }
});

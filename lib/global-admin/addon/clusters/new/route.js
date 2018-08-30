import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash/* , all */ } from 'rsvp';

export default Route.extend({
  access:       service(),
  catalog:      service(),
  settings:     service(),
  globalStore:  service(),
  roleTemplateService: service('roleTemplate'),
  k8sStore: service(),
  clusterStore: service(),

  queryParams: {
    provider: {
      refreshModel: true
    }
  },

  model() {
    let globalStore = this.get('globalStore');
    let k8sStore = this.get('k8sStore')
    let clusterStore = this.get('clusterStore')

    let cluster = globalStore.createRecord({
      type: 'cluster'
    });

    return hash({
      cluster,
      clusterRoleTemplateBinding: globalStore.findAll('clusterRoleTemplateBinding'),
      me:                         get(this, 'access.principal'),
      nodeDrivers:                globalStore.findAll('nodeDriver'),
      nodeTemplates:              globalStore.findAll('nodeTemplate'),
      psps:                       globalStore.findAll('podSecurityPolicyTemplate'),
      roleTemplates:              get(this, 'roleTemplateService').fetchFilteredRoleTemplates(),
      users:                      globalStore.findAll('user'),
      business:                   clusterStore.findAll('business', {url:`${k8sStore.baseUrl}/v3/business`, forceReload: true}),
    });
  },

  setupController(controller/*, model*/) {
    this._super(...arguments);
    set(controller, 'step', 1);
  }
});

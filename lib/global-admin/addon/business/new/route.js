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

  model() {
    let globalStore = this.get('globalStore');
    let k8sStore = this.get('k8sStore');

    let cluster = globalStore.createRecord({
      type: 'cluster'
    });

    let business = k8sStore.createRecord({
      type: 'business'
    });

    return hash({
      cluster,
      business,
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

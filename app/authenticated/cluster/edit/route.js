import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({
  access:              service(),
  globalStore:         service(),
  roleTemplateService: service('roleTemplate'),
  k8sStore:            service('k8sStore'),

  model() {

    const globalStore = this.get('globalStore');
    const cluster     = this.modelFor('authenticated.cluster');
    const k8sStore    = this.get('k8sStore')

    return hash({
      originalCluster:            cluster,
      cluster:                    cluster.clone(),
      nodeTemplates:              globalStore.findAll('nodeTemplate'),
      nodeDrivers:                globalStore.findAll('nodeDriver'),
      psps:                       globalStore.findAll('podSecurityPolicyTemplate'),
      roleTemplates:              get(this, 'roleTemplateService').get('allFilteredRoleTemplates'),
      users:                      globalStore.findAll('user'),
      clusterRoleTemplateBinding: globalStore.findAll('clusterRoleTemplateBinding'),
      me:                         get(this, 'access.principal'),
      business:                   k8sStore.findAll('business', {
        url:         `${ k8sStore.baseUrl }/v3/business`,
        forceReload: true
      }),
    });

  },

  setupController(controller/* , model*/) {

    this._super(...arguments);
    set(controller, 'step', 1);

  },

  resetController(controller, isExisting /* , transition*/ ) {

    if (isExisting) {

      controller.set('errors', null);
      controller.set('provider', null);

    }

  }
});

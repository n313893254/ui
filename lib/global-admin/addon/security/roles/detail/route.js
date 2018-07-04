import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  globalStore:         service(),
  roleTemplateService: service('roleTemplate'),
  k8sStore: service('k8sStore'),

  // model: function (params) {
  //   const store = get(this, 'globalStore');
  //   const k8sStore = get(this, 'k8sStore')
  //   return hash({
  //     policies: store.find('podSecurityPolicyTemplate'),
  //     role:     get(this, 'roleTemplateService').fetchFilteredRoleTemplates(params.role_id),
  //     roles:    get(this, 'roleTemplateService').get('allFilteredRoleTemplates'),
  //   });
  // },
  model: function (params) {
    const store = get(this, 'globalStore');
    const k8sStore = get(this, 'k8sStore')
    return hash({
      policies: store.find('podSecurityPolicyTemplate'),
      roles:    get(this, 'roleTemplateService').fetchFilteredRoleTemplates(),
      cceRoles:    get(this, 'k8sStore').findAll('businessRoleTemplate', {url: `${get(this, 'k8sStore').baseUrl}/v3/businessRoleTemplate`, forceReload: true}),
    }).then((hash) => {
      const cceRole = hash.cceRoles.filter(c => c.id === params.role_id)[0]
      const rancherRole = hash.roles.filter(c => c.id === params.role_id)[0]
      const role = rancherRole || cceRole

      let roles = hash.roles
      let cceRoles = hash.cceRoles
      roles.content.map(r => {
        const filter = cceRoles.content.filter(i => i.id === r.id)
        if (filter.length === 0) {
          cceRoles.pushObject(r)
        }
      })

      return ({
        policies: hash.policies,
        role:     role,
        roles:    cceRoles,
      });
    });
  },
});

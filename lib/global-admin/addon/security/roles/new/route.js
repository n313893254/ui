import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  globalStore:         service(),
  roleTemplateService: service('roleTemplate'),
  k8sStore: service('k8sStore'),

  model() {
    const store = get(this, 'globalStore');

    var role = store.createRecord({
      type:   `roleTemplate`,
      name:   '',
      rules:  [],
      hidden: false,
      locked: false,
    });

    return hash({
      policies: store.find('podSecurityPolicyTemplate'),
      roles:    get(this, 'roleTemplateService').fetchFilteredRoleTemplates(),
      cce:      get(this, 'k8sStore').findAll('businessRoleTemplate', {url: `${get(this, 'k8sStore').baseUrl}/v3/businessRoleTemplate`}),
    }).then( res => {
      let cce = res.cce
      let roles = res.roles
      cce.content.map(r => {
        const filter = roles.content.filter(i => i.id === r.id)
        if (filter.length === 0) {
          roles.pushObject(r)
        }
      })
      set(res, 'roles', roles)
      set(res, 'role', role);

      return res;

    });
  },
});

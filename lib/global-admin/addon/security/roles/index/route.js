import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import EmberObject from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  roleTemplateService: service('roleTemplate'),
  k8sStore: service('k8sStore'),

  model() {
    return hash({
      role:     get(this, 'roleTemplateService').fetchFilteredRoleTemplates(null, null),
      roles:    get(this, 'k8sStore').findAll('businessRoleTemplate', {url: `${get(this, 'k8sStore').baseUrl}/v3/businessRoleTemplate`, forceReload: true}),
    }).then((hash) => {
      let role = hash.role
      let roles = hash.roles
      role.content.map(r => {
        const filter = roles.content.filter(i => i.id === r.id)
        if (filter.length === 0) {
          roles.pushObject(r)
        }
      })
      return roles
    });
  },
});

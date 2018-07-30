import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import C from 'ui/utils/constants';

export default Resource.extend({
  state: computed('locked', function() {

    return get(this, 'locked') ? 'locked' : 'active';

  }),

  isCustom: computed('roleTemplateId', function() {

    return !C.BASIC_ROLE_TEMPLATE_ROLES.includes(get(this, 'id'));

  }),

  displayName: computed('name', 'id', function() {

    let name = get(this, 'name');

    if ( name ) {

      return name;

    }

    return `(${  get(this, 'id')  })`;

  }),

  canRemove: computed('links.remove', 'builtin', function() {

    return !!get(this, 'links.remove') && !get(this, 'builtin');

  }),
  type:     'businessRoleTemplate',
  router:   service(),
  k8sStore: service(),

  actions: {
    edit() {

      this.get('router').transitionTo('global-admin.security.roles.edit', this.get('id'));

    },
    goToApi() {

      let k8sStore = this.get('k8sStore') || {}

      window.open(`${ k8sStore.baseUrl }/v3/businessRoleTemplate/${ this.get('id') }`, '_blank')

    },
  },

});

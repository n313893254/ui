import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';
import { hasMany } from 'ember-api-store/utils/denormalize';
import { alias } from '@ember/object/computed';

export default Resource.extend({
  type: 'business',
  router: service(),
  k8sStore: service(),

  businessRoleTemplateBindings: hasMany('id', 'businessRoleTemplateBinding', 'businessId'),
  roleTemplateBindings: alias('businessRoleTemplateBindings'),

  actions: {
    edit: function() {
      this.get('router').transitionTo('global-admin.business.edit', this.get('id'));
    },
    addCluster: function() {
      this.get('router').transitionTo('global-admin.business.new-cluster', this.get('id'));
    },
    goToApi() {
      let k8sStore = this.get('k8sStore') || {}
      window.open(`${k8sStore.baseUrl}/v3/business/${this.get('id')}`, '_blank')
    },
  },

  availableActions: computed('state', function() {
    const state = get(this, 'state')
    var choices = [{
        label: 'action.addCluster',
        icon: 'icon icon-cluster',
        action: 'addCluster',
        enabled: state === 'active' ? true : false,
      },
    ];

    return choices;
  }),
});

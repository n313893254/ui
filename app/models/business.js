import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';

export default Resource.extend({

  availableActions: computed('state', function() {

    const state = get(this, 'state')
    var choices = [{
      label:   'action.addCluster',
      icon:    'icon icon-cluster',
      action:  'addCluster',
      enabled: state === 'active' ? true : false,
    },
    ];

    return choices;

  }),
  type:     'business',
  router:   service(),
  k8sStore: service(),

  actions: {
    edit() {

      this.get('router').transitionTo('global-admin.business.edit', this.get('id'));

    },
    addCluster() {

      this.get('router').transitionTo('global-admin.business.new-cluster', this.get('id'));

    },
    goToApi() {

      let k8sStore = this.get('k8sStore') || {}

      window.open(`${ k8sStore.baseUrl }/v3/business/${ this.get('id') }`, '_blank')

    },
  },

});

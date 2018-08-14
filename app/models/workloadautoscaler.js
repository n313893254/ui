import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object';
import { hasMany } from 'ember-api-store/utils/denormalize';
import { alias } from '@ember/object/computed';

export default Resource.extend({
  type:     'workloadAutoScaler',
  router:   service(),
  k8sStore: service(),

  actions: {
    edit() {

      this.get('router').transitionTo('authenticated.project.hooks.edit', this.get('id'));

    },
    goToApi() {

      let k8sStore = this.get('k8sStore') || {}

      window.open(`${ k8sStore.baseUrl }/v3/workloadAutoScaler/${ this.get('id') }`, '_blank')

    },
  },

});

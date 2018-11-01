import { hash } from 'rsvp';
import { get, set } from '@ember/object'
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default Route.extend({
  scope:    service(),
  k8sStore: service(),
  isEKS:    alias('scope.currentCluster.isEKS'),
  model(params, transition) {

    const store = get(this, 'store');
    const k8sStore = get(this, 'k8sStore');
    const projectId = transition.params['authenticated.project'].project_id;

    const dependencies = {
      namespacedcertificates: store.findAll('namespacedcertificate'),
      certificates:           store.findAll('certificate'),
    };

    if (params.ingressId) {

      dependencies['existingIngress'] = store.find('ingress', params.ingressId);

    }

    dependencies['eksInfo'] = store.rawRequest({
      url:    `${ k8sStore.baseUrl }/project/${ projectId }/ingresses/?action=eksResources`,
      method: 'POST',
    });

    return hash(dependencies).then((hash) => {

      let ingress;

      if (hash.existingIngress) {

        if (`${ params.upgrade  }` === 'true') {

          ingress = hash.existingIngress.clone();
          hash.existing = hash.existingIngress;

        } else {

          ingress = hash.existingIngress.cloneForNew();

        }
        delete hash.existingIngress;

      } else {

        ingress = store.createRecord({
          type:  'ingress',
          name:  '',
          rules: [],
          tls:   [],
        });

      }
      hash.ingress = ingress;

      if (hash.eksInfo) {

        const { status, body = {} } = hash.eksInfo

        if (status === 200) {

          const { securityGroups = [], subnets = [] } = body
          const eksResources = {
            securityGroups,
            subnets,
          }

          hash.eksResources = eksResources

        } else {

          hash.eksResources = {
            securityGroups: [],
            subnets:        [],
          }

        }

      }

      return hash;

    });

  },

  resetController(controller, isExisting) {

    if (isExisting) {

      set(controller, 'ingressId', null);
      set(controller, 'upgrade', null);

    }

  },

  actions: {
    cancel() {

      this.goToPrevious();

    },
  }
});

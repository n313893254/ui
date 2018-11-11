import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import { hasMany } from 'ember-api-store/utils/denormalize';
import ResourceUsage from 'shared/mixins/resource-usage';
import { equal, alias } from '@ember/object/computed';
import { resolve } from 'rsvp';
import C from 'ui/utils/constants';

export default Resource.extend(ResourceUsage, {
  globalStore:                 service(),
  growl:                       service(),
  scope:                       service(),
  router:       service(),

  namespaces:                  hasMany('id', 'namespace', 'clusterId'),
  projects:                    hasMany('id', 'project', 'clusterId'),
  nodes:                       hasMany('id', 'node', 'clusterId'),
  nodePools:                   hasMany('id', 'nodePool', 'clusterId'),
  clusterRoleTemplateBindings: hasMany('id', 'clusterRoleTemplateBinding', 'clusterId'),
  machines:                    alias('nodes'),
  roleTemplateBindings:        alias('clusterRoleTemplateBindings'),
  isGKE:                       equal('driver', 'googleKubernetesEngine'),

  getAltActionDelete: computed('action.remove', function() { // eslint-disable-line
    return get(this, 'canBulkRemove') ? 'delete' : null;
  }),

  canBulkRemove: computed('action.remove', function() { // eslint-disable-line
    const sessionTokenLabel = `${ (get(this, 'annotations') || {})[C.LABEL.EKS_SESSION_TOKEN]  }`;
    let noSessionToken      = false;

    if (sessionTokenLabel === 'undefined' || sessionTokenLabel === 'false') {
      noSessionToken = true;
    }

    return noSessionToken;
  }),

  configName: computed(function() {
    const keys = this.allKeys().filter((x) => x.endsWith('Config'));

    for ( let key, i = 0 ; i < keys.length ; i++ ) {
      key = keys[i];
      if ( get(this, key) ) {
        return key;
      }
    }

    return null;
  }),

  isReady: computed('conditions.@each.status', function() {
    return this.hasCondition('Ready');
  }),

  isRKE: computed('configName', function() {
    return get(this, 'configName') === 'rancherKubernetesEngineConfig';
  }),

  provider: computed('configName', 'nodePools.@each.nodeTemplateId', function() {
    const pools = get(this, 'nodePools') || [];
    const firstTemplate = get(pools, 'firstObject.nodeTemplate');
    let configName = get(this, 'configName');

    if ( get(this, 'genericEngineConfig') ) {
      if ( get(this, 'genericEngineConfig').indexOf('emptyCluster:false') > -1 ) {
        configName = 'tencentContainerCloudServiceConfig';
      }
      if ( get(this, 'genericEngineConfig').indexOf('masterSystemDiskCategory') > -1 ) {
        configName = 'aliyunContainerServiceForKubernetesConfig';
      }
      if ( get(this, 'genericEngineConfig').indexOf('rootVolumeType') > -1 ) {
        configName = 'huaweiContainerCloudEngineConfig';
      }
    }

    switch ( configName ) {
    case 'amazonElasticContainerServiceConfig':
      return 'amazoneks';
    case 'azureKubernetesServiceConfig':
      return 'azureaks';
    case 'googleKubernetesEngineConfig':
      return 'googlegke';
    case 'tencentContainerCloudServiceConfig':
      return 'tencentccs';
    case 'aliyunContainerServiceForKubernetesConfig':
      return 'aliyunkcs';
    case 'huaweiContainerCloudEngineConfig':
      return 'huaweicce';
    case 'rancherKubernetesEngineConfig':
      if ( pools.length > 0 ) {
        if ( firstTemplate ) {
          return get(firstTemplate, 'driver');
        } else {
          return null;
        }
      } else {
        return 'custom';
      }
    default:
      return 'import';
    }
  }),

  displayProvider: computed('configName', 'nodePools.@each.displayProvider', 'intl.locale', function() {
    const intl = get(this, 'intl');
    const pools = get(this, 'nodePools');
    const firstPool = (pools || []).objectAt(0);
    let configName = get(this, 'configName');

    if ( get(this, 'genericEngineConfig') ) {
      if ( get(this, 'genericEngineConfig').indexOf('emptyCluster:false') > -1 ) {
        configName = 'tencentContainerCloudServiceConfig';
      }
      if ( get(this, 'genericEngineConfig').indexOf('masterSystemDiskCategory') > -1 ) {
        configName = 'aliyunContainerServiceForKubernetesConfig';
      }
      if ( get(this, 'genericEngineConfig').indexOf('rootVolumeType') > -1 ) {
        configName = 'huaweiContainerCloudEngineConfig';
      }
    }

    switch ( configName ) {
    case 'amazonElasticContainerServiceConfig':
      return intl.t('clusterNew.amazoneks.shortLabel');
    case 'azureKubernetesServiceConfig':
      return intl.t('clusterNew.azureaks.shortLabel');
    case 'googleKubernetesEngineConfig':
      return intl.t('clusterNew.googlegke.shortLabel');
    case 'tencentContainerCloudServiceConfig':
      return intl.t('clusterNew.tencentccs.shortLabel');
    case 'aliyunContainerServiceForKubernetesConfig':
      return intl.t('clusterNew.aliyunkcs.shortLabel');
    case 'huaweiContainerCloudEngineConfig':
      return intl.t('clusterNew.huaweicce.shortLabel');
    case 'rancherKubernetesEngineConfig':
      if ( !!pools ) {
        if ( firstPool ) {
          return get(firstPool, 'displayProvider');
        } else {
          return intl.t('clusterNew.rke.shortLabel');
        }
      } else {
        return intl.t('clusterNew.custom.shortLabel');
      }
    default:
      return intl.t('clusterNew.import.shortLabel');
    }
  }),

  defaultProject: computed('projects.@each.{name,clusterOwner}', function() {
    let projects = this.get('projects');

    let out = projects.findBy('isDefault');

    if ( out ) {
      return out;
    }

    out = projects.findBy('clusterOwner', true);
    if ( out ) {
      return out;
    }

    out = projects.objectAt(0);

    return out;
  }),

  actions: {
    promptDelete() {
      const hasSessionToken = get(this, 'canBulkRemove') ? false : true; // canBulkRemove returns true of the session token is set false

      if (hasSessionToken) {
        set(this, `${ get(this, 'configName') }.accessKey`, null);
        get(this, 'modalService').toggleModal('modal-delete-eks-cluster', { model: this, });
      } else {
        get(this, 'modalService').toggleModal('confirm-delete', {
          escToClose: true,
          resources:  [this]
        });
      }
    },

    edit() {
      this.get('router').transitionTo('authenticated.cluster.edit', this.get('id'));
    },

    scaleDownPool(id) {
      const pool = (get(this, 'nodePools') || []).findBy('id', id);

      if ( pool ) {
        pool.incrementQuantity(-1);
      }
    },

    scaleUpPool(id) {
      const pool = (get(this, 'nodePools') || []).findBy('id', id);

      if ( pool ) {
        pool.incrementQuantity(1);
      }
    },
  },

  clearProvidersExcept(keep) {
    const keys = this.allKeys().filter((x) => x.endsWith('Config'));

    for ( let key, i = 0 ; i < keys.length ; i++ ) {
      key = keys[i];
      if ( key !== keep && get(this, key) ) {
        set(this, key, null);
      }
    }
  },

  delete(/* arguments*/) {
    const promise = this._super.apply(this, arguments);

    return promise.then((/* resp */) => {
      if (this.get('scope.currentCluster.id') === this.get('id')) {
        this.get('router').transitionTo('global-admin.clusters');
      }
    });
  },

  getOrCreateToken() {
    const globalStore = get(this, 'globalStore');
    const id = get(this, 'id');

    return globalStore.findAll('clusterRegistrationToken', { forceReload: true }).then((tokens) => {
      let token = tokens.filterBy('clusterId', id)[0];

      if ( token ) {
        return resolve(token);
      } else {
        token = get(this, 'globalStore').createRecord({
          type:      'clusterRegistrationToken',
          clusterId: id
        });

        return token.save();
      }
    });
  },
});

import { inject as service } from '@ember/service';
import { gt, reads } from '@ember/object/computed';
import {
  get, set, computed
} from '@ember/object';
import { parseSi } from 'shared/utils/parse-unit';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import ChildHook from 'shared/mixins/child-hook';
import layout from './template';

export default Component.extend(ViewNewEdit, ChildHook, {
  intl:     service(),
  scope:    service(),
  k8sStore: service(),

  layout,
  model:             null,
  namespace:         null,
  persistentVolumes: null,
  storageClasses:    null,
  selectNamespace:   true,
  actuallySave:      true,
  useStorageClass:   true,
  capacity:          null,
  availableZones:    [],
  titleKey:          'cruPersistentVolumeClaim.title',

  businessCustome:      false,

  provider: reads('scope.currentCluster.provider'),

  canUseStorageClass: gt('storageClasses.length', 0),

  headerToken: function() {

    let k = 'cruPersistentVolumeClaim.';

    if ( get(this, 'actuallySave' ) ) {

      k += 'add.';

    } else {

      k += 'define.';

    }

    k += get(this, 'mode');

    return k;

  }.property('actuallySave', 'mode'),

  persistentVolumeChoices: computed('persistentVolumes.@each.{name,state}', function() {

    return get(this, 'persistentVolumes').map((v) => {

      let label = get(v, 'displayName');
      const state = get(v, 'state');
      const disabled = state !== 'available';

      if ( disabled ) {

        label += ` (${  state  })`;

      }

      return {
        label,
        disabled,
        value: get(v, 'id'),
      }

    })
      .sortBy('label');

  }),
  init() {

    this._super(...arguments)
    const scope = get(this, 'scope')
    const k8sStore = get(this, 'k8sStore')
    const { currentCluster = {} } = scope
    const { provider, huaweiCloudContainerEngineConfig = {} } = currentCluster
    const storageClasses = get(this, 'storageClasses') || []
    const storageClass = get(storageClasses, 'firstObject')

    if (get(this, 'mode') === 'new') {

      set(this, 'primaryResource.storageClassId', storageClass.id)

    }

    if (provider === 'huaweicce' && get(this, 'mode') === 'new') {

      set(this, 'primaryResource.storageClassId', 'sata')
      const {
        availableZone, zone, labels = {}, projectId
      } = huaweiCloudContainerEngineConfig

      let businessId = labels.business
      const business = get(this, 'business') && get(this, 'business').content || []

      businessId = businessId.replace('_', ':')
      const filter = business.filter((b) => b.id === businessId)[0]

      if (filter && filter.doAction) {

        filter.doAction('getHuaweiCloudApiInfo', {
          projectId,
          zone,
        }, { url: `${ k8sStore.baseUrl }/business/${ businessId }?action=getHuaweiCloudApiInfo` }).then((res) => {

          set(this, 'availableZones', res.availabilityZoneInfo.filter((z) => z && z.zoneState && z.zoneState.available))
          set(this, 'availableZoneId', availableZone)

        })

      } else {

        set(this, 'businessCustome', true)

      }

      const pvcLabels = get(this, 'primaryResource.labels') || {}
      const annotations = get(this, 'primaryResource.annotations') || {}

      delete pvcLabels['failure-domain.beta.kubernetes.io/region']
      delete pvcLabels['failure-domain.beta.kubernetes.io/zone']
      delete annotations['volume.beta.kubernetes.io/storage-class']
      delete annotations['volume.beta.kubernetes.io/storage-provisioner']

    }

  },

  didReceiveAttrs() {

    if ( !get(this, 'persistentVolumes') ) {

      set(this, 'persistentVolumes', get(this, 'clusterStore').all('persistentVolume'));

    }

    if ( !get(this, 'storageClasses') ) {

      set(this, 'storageClasses', get(this, 'clusterStore').all('storageClass'));

    }

    if ( !get(this, 'selectNamespace') ) {

      set(this, 'primaryResource.namespaceId', get(this, 'namespace.id') || get(this, 'namespace.name'));

    }

    if ( get(this, 'isNew') ) {

      const capacity = get(this, 'primaryResource.resources.requests.storage');

      if ( capacity ) {

        const bytes = parseSi(capacity);
        const gib = bytes / (1024 ** 3);

        set(this, 'capacity', gib);

      }

      if ( !get(this, 'canUseStorageClass')) {

        set(this, 'useStorageClass', false);

      }

    } else {

      set(this, 'capacity', 10);

    }

  },

  actions: {
    cancel() {

      this.sendAction('cancel');

    },
    setLabels(labels) {

      let out = {};

      labels.forEach((row) => {

        out[row.key] = row.value;

      });

      set(this, 'primaryResource.labels', out);

    },
  },

  willSave() {

    if (get(this, 'scope.currentCluster.provider') === 'huaweicce') {

      const zone = get(this, 'scope.currentCluster.huaweiCloudContainerEngineConfig.zone')
      const labels = get(this, 'primaryResource.labels') || {}
      const annotations = get(this, 'primaryResource.annotations') || {}
      let _labels = labels
      let _annotations = annotations

      Object.assign(_labels, {
        'failure-domain.beta.kubernetes.io/region': zone,
        'failure-domain.beta.kubernetes.io/zone':   get(this, 'availableZoneId'),
      })
      Object.assign(_annotations, {
        'volume.beta.kubernetes.io/storage-class':       get(this, 'primaryResource.storageClassId'),
        'volume.beta.kubernetes.io/storage-provisioner': 'flexvolume-huawei.com/fuxivol',
      })
      set(this, 'primaryResource.labels', _labels)
      set(this, 'primaryResource.annotations', _annotations)

    }

    const pr = get(this, 'primaryResource');
    const intl = get(this, 'intl');

    if ( get(this, 'useStorageClass') ) {

      set(pr, 'volumeId', null);

      const capacity = get(this, 'capacity');

      if ( capacity ) {

        set(pr, 'resources', { requests: { storage: `${ capacity  }Gi`, } });

      } else {

        const errors = [];

        errors.push(intl.t('validation.required', { key: intl.t('cruPersistentVolumeClaim.capacity.label') }));
        set(this, 'errors', errors);

        return false;

      }

    } else {

      set(pr, 'storageClassId', null);
      set(pr, 'resources', { requests: Object.assign({}, get(pr, 'persistentVolume.capacity')), });

    }

    if ( !get(this, 'actuallySave') ) {

      let ok = this._super(...arguments);

      if ( ok ) {

        this.sendAction('doSave', { pvc: pr, });
        this.doneSaving();

      }

      return false;

    }

    const self = this;
    const sup = this._super;

    if ( get(this, 'selectNamespace') ) {

      return this.applyHooks('_beforeSaveHooks').then(() => {

        set(pr, 'namespaceId', get(this, 'namespace.id'));

        return sup.apply(self, ...arguments);

      })
        .catch(() => {

          const errors = [];

          errors.push('namespaces is forbidden: you are forbidden to create namespaces');
          set(this, 'errors', errors);

        });

    } else {

      if ( !get(pr, 'namespaceId') ) {

        set(pr, 'namespaceId', '__REPLACE_ME__');

      }

      return sup.apply(self, ...arguments);

    }

  },

  doneSaving() {

    this.sendAction('done');

  },

});

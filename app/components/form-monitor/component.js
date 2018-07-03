import { get, set, computed, setProperties, observer } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';
import NewOrEdit from 'ui/mixins/new-or-edit';

export default Component.extend({
  layout,
  scope: service(),
  cluster: reads('scope.currentCluster'),
  saved: null,
  disabling: false,
  errors: null,
  useStorageClass: true,
  router: service(),
  pvcEnable: false,
  editing: computed('mode', function() {
    const mode = get(this, 'mode')
    return mode === 'edit' ? true : false
  }),
  canUseStorageClass: gt('storageClasses.length', 0),



  persistentVolumeChoices: computed('persistentVolumes.@each.{name,state}', function() {
    return get(this, 'persistentVolumes').map((v) => {
      let label = get(v, 'displayName');
      const state = get(v, 'state');
      const disabled = state !== 'available';

      if ( disabled ) {
        label += ' (' + state + ')';
      }

      return {
        label,
        disabled,
        value: get(v, 'id'),
      }
    }).sortBy('label');
  }),

  init() {
    this._super(...arguments);
  },

  didReceiveAttrs() {
    if ( !get(this, 'persistentVolumes') ) {
      set(this, 'persistentVolumes', get(this, 'clusterStore').all('persistentVolume'));
    }

    if ( !get(this, 'storageClasses') ) {
      set(this, 'storageClasses', get(this, 'clusterStore').all('storageClass'));
    }

    if ( !get(this, 'canUseStorageClass')) {
      set(this, 'useStorageClass', false);
    }

    if (get(this, 'model.pvcConfig.storageClassName') || get(this, 'model.pvcConfig.volumeName') || get(this, 'model.pvcConfig.accessModes')) {
      set(this, 'pvcEnable', true)
    }
  },

  successCB() {
    set(this, 'saved', true)
  },

  actions: {
    save(cb) {
      set(this, 'errors', null)
      let errors = get(this, 'errors') || []
      const pvcEnable = get(this, 'pvcEnable')
      const useStorageClass = get(this, 'useStorageClass')
      if (pvcEnable && useStorageClass && !get(this, 'model.pvcConfig.storageClassName')) {
        errors.pushObject('Please select a storage Class')
        set(this, 'errors', errors)
        cb()
        return
      }
      if (pvcEnable && !useStorageClass && !get(this, 'model.pvcConfig.volumeName')) {
        errors.pushObject('Please select a persistent volume')
        set(this, 'errors', errors)
        cb()
        return
      }
      this.sendAction('save', cb)
    },

    disable() {
      this.sendAction('disable')
    },

    disablePVC() {
      setProperties(this, {
        pvcEnable: false,
        'model.pvcConfig.storageClassName': null,
        'model.pvcConfig.volumeName': null,
        'model.pvcConfig.accessModes': null,
      })
    },

    enablePVC() {
      set(this, 'pvcEnable', true)
    },
  },
});

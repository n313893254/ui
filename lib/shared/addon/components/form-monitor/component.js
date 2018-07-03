import { get, set, computed } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';
import NewOrEdit from 'ui/mixins/new-or-edit';

export default Component.extend(NewOrEdit, {
  layout,
  scope: service(),
  cluster: reads('scope.currentCluster'),
  editing: computed('mode', function() {
    const mode = get(this, 'mode')
    return mode === 'edit' ? true : false
  }),
  saved: null,
  disabling: false,
  errors: null,
  useStorageClass: true,

  canUseStorageClass: gt('storageClasses.length', 0),

  init() {
    this._super(...arguments);
  },

  actions: {
    save(cb) {
      const errors = get(this, 'errors') || []
      set(this, 'errors', null);
      const model = get(this, 'model')
      set(model, 'clusterId', get(this, 'cluster.id'));

      model.save().then(() => {
        this.doneSaving()
        set(this, 'saved', true)
      }).catch((err) => {
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        cb()
      })

      this._super(cb)
    },

    disable() {
      const errors = get(this, 'errors') || []
      set(this, 'errors', null);
      set(this, 'disabling', true)
      const model = get(this, 'model')

      model.delete().then(() => {
        this.doneSaving()
      }).catch((err) => {
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        set(this, 'disabling', false)
      })
    },
  },

  doneSaving() {
    console.log('poi')
    this.sendAction('refreshModel');
  },
});

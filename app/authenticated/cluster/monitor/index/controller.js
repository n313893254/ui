import { get, set, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  scope: service(),
  cluster: reads('scope.currentCluster'),
  editing: computed('model.mode', function() {
    const mode = get(this, 'model.mode')
    return mode === 'edit' ? true : false
  }),
  saved: null,
  disabling: false,
  errors: null,
  actions: {
    save(cb) {
      const model = get(this, 'model.monitoring')
      set(model, 'clusterId', get(this, 'cluster.id'));

      model.save().then(() => {
        set(this, 'saved', true)
        set(this, 'model.mode', 'edit')
      }).catch((err) => {
        const errors = get(this, 'errors') || []
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        cb()
      })
    },
    disable() {
      set(this, 'disabling', true)
      const model = get(this, 'model.monitoring')

      model.delete().then(() => {
        set(this, 'model.mode', 'new')
      }).catch((err) => {
        const errors = get(this, 'errors') || []
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        set(this, 'disabling', false)
      })
    },
  }
});

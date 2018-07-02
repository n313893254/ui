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
      const errors = get(this, 'errors') || []
      set(this, 'errors', null);
      const model = get(this, 'model.monitoring')
      set(model, 'clusterId', get(this, 'cluster.id'));

      model.save().then(() => {
        this.send('refreshModel');
        set(this, 'saved', true)
      }).catch((err) => {
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        cb()
      })
    },

    disable() {
      const errors = get(this, 'errors') || []
      set(this, 'errors', null);
      set(this, 'disabling', true)
      const model = get(this, 'model.monitoring')

      model.delete().then(() => {
        this.send('refreshModel');
      }).catch((err) => {
        errors.pushObject(err)
        set(this, 'errors', errors);
      }).finally(() => {
        set(this, 'disabling', false)
      })
    },
  }
});

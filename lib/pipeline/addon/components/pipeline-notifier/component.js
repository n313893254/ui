import Component from '@ember/component';
import layout from './template'
import { get, set, observer, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

const CONDICTION_CHOICES = ['Success', 'Changed', 'Failed']

export default Component.extend({
  globalStore: service(),
  scope:            service(),
  layout,

  config:     null,

  conditionContent: CONDICTION_CHOICES,
  recipients:       [],
  success:          false,
  changed:          false,
  failed:           false,

  clusterId:   reads('scope.currentCluster.id'),
  init() {
    this._super(...arguments);
    const clusterId = get(this, 'clusterId');
    const config = get(this, 'config');

    get(this, 'globalStore').findAll('notifier').then((res) => {
      set(this, 'notifiers', res.filterBy('clusterId', clusterId))
    })
    if ( config ) {
      const { condition = [] } = config

      condition.map((c) => {
        switch (c) {
        case 'Success':
          set(this, 'success', true)
          break;
        case 'Changed':
          set(this, 'changed', true)
          break;
        case 'Failed':
          set(this, 'failed', true)
          break;
        default: break;
        }
      })
    }
    this.condictionChange()
  },

  actions: {
    add() {
      this.addNewRecipient();
    },
    remove(recipient) {
      get(this, 'config.recipients').removeObject(recipient);
    },
  },

  condictionChange: observer('success', 'changed', 'failed', function() {
    const arr = [
      get(this, 'success') ? 'Success' : null,
      get(this, 'changed') ? 'Changed' : null,
      get(this, 'failed') ? 'Failed' : null,
    ].filter((c) => !!c)

    set(this, 'config.condition', arr)
  }),

  notifiers: computed('clusterId', function() {
    const clusterId = get(this, 'clusterId');

    return get(this, 'globalStore').all('notifier').filterBy('clusterId', clusterId);
  }),

  haveNotifiers: computed('notifiers.[]', function() {
    return get(this, 'notifiers').length === 0 ? false : true;
  }),


  disableRemove: computed('config.recipients.[]', function() {
    return get(this, 'config.recipients.length') <= 1
  }),
  addNewRecipient() {
    const nue = {
      notifierId:   null,
      recipient:    null,
    };

    get(this, 'config.recipients').pushObject(nue);
  },

});

import { get, set, computed, observer } from '@ember/object';

import Component from '@ember/component';

export default Component.extend({
  disableRemove: false,

  init() {
    this._super(...arguments)
    console.log(get(this, 'model'), 'model')
  },

  actions: {
    remove() {
      if (!get(this, 'disableRemove')) {
        this.sendAction('remove', get(this, 'model'));
      }
    },
  },

  selectedNotifier: computed('model.notifier', 'notifiers.[]', function() {
    return get(this, 'notifiers')
      .filterBy('id', get(this, 'model.notifier'))
      .get('firstObject');
  }),

  setRecipient: observer('selectedNotifier', function() {
    const v = get(this, 'selectedNotifier.notifierValue');

    set(this, 'model.recipient', v);
  }),

});

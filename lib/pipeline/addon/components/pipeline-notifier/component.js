import Component from '@ember/component';
import layout from './template'
import { get, set, observer, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

const CONDICTION_CHOICES = [{
  label: 'Success',
  value: 'Success',
}, {
  label: 'Changed',
  value: 'Changed',
}, {
  label: 'Failed',
  value: 'Failed',
}]

export default Component.extend({
  layout,

  type:       null,
  branchOnly: false,
  config:     null,

  include: null,
  exclude: null,
  conditionContent: CONDICTION_CHOICES,
  recipients: [],
  globalStore: service(),
  scope:       service(),
  clusterId:   reads('scope.currentCluster.id'),

  init() {
    this._super(...arguments);
    const clusterId = get(this, 'clusterId');
    const config = get(this, 'config');
    console.log(config, 'config')
    get(this, 'globalStore').findAll('notifier').then(res => {
      set(this, 'notifiers', res.filterBy('clusterId', clusterId))
    })
    if ( config ) {
      set(this, 'config.condition', config.condition && config.condition[0])
    }
  },

  actions: {
    add() {
      this.addNewRecipient();
    },
    remove(recipient) {
      get(this, 'config.recipients').removeObject(recipient);
    },
  },

  addNewRecipient() {
    const nue = {
      notifierId:   null,
      recipient:    null,
    };

    get(this, 'config.recipients').pushObject(nue);
  },

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

  configDidChange: observer('include', 'exclude', function() {
    const include = get(this, 'include') || {};
    const exclude = get(this, 'exclude') || {};

    const branch = Object.assign({}, include.branch, exclude.branch);
    const event = Object.assign({}, include.event, exclude.event);
    const out = {};

    if ( Object.keys(branch).length ) {
      out.branch = branch;
    }

    if ( Object.keys(event).length ) {
      out.event = event;
    }

    set(this, 'config', Object.keys(out).length ? out : null);
  }),
});

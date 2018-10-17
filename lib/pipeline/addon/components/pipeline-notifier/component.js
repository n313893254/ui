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

    const config = get(this, 'config');
    console.log(config, 'config')
    const include = {
      branch: {},
      event:  {},
    };
    const exclude = {
      branch: {},
      event:  {},
    };

    if ( config ) {
      if ( config.branch ) {
        include.branch.include = get(config, 'branch.include');
        exclude.branch.exclude = get(config, 'branch.exclude');
      }
      if ( config.event ) {
        include.event.include = get(config, 'event.include');
        exclude.event.exclude = get(config, 'event.exclude');
      }
    }
    set(this, 'include', include);
    set(this, 'exclude', exclude);
  },

  actions: {
    add() {
      this.addNewRecipient();
    },
  },

  addNewRecipient() {
    const nue = {
      notifierType: null,
      notifierId:   null,
      recipient:    null,
    };

    get(this, 'recipients').pushObject(nue);
  },

  notifiers: computed('clusterId', function() {
    const clusterId = get(this, 'clusterId');

    return get(this, 'globalStore').all('notifier').filterBy('clusterId', clusterId);
  }),

  haveNotifiers: computed('notifiers.[]', function() {
    return get(this, 'notifiers').length === 0 ? false : true;
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

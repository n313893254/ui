import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { set, get, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import layout from './template';

const PROMETHEUS = 'prometheus';
const NONE = 'none';

export default Component.extend({
  scope: service(),
  growl: service(),

  layout,

  selected:     NONE,
  level:        'cluster',
  justDeployed: false,

  cluster: alias('scope.currentCluster'),
  project: alias('scope.currentProject'),
  enabled: alias('cluster.enableClusterMonitoring'),
  isReady: alias('cluster.isMonitoringReady'),

  init() {
    this._super(...arguments);

    set(this, 'selected', get(this, 'enabled') ? PROMETHEUS : NONE);
  },

  actions: {
    changeSelected(selected) {
      set(this, 'selected', selected);
    },

    save(cb) {
      if ( get(this, 'selected') === NONE ) {
        this.send('disable', cb);
      } else {
        this.send('enable', cb);
      }
    },

    enable(cb) {
      const cluster = get(this, 'cluster').clone();

      set(cluster, 'enableClusterMonitoring', true);

      cluster.save().then(() => {
        set(this, 'justDeployed', true);
        cb(true);
      }).catch((err) => {
        get(this, 'growl').fromError(err);
        cb(false);
      });
    },

    disable(cb) {
      const cluster = get(this, 'cluster').clone();

      set(cluster, 'enableClusterMonitoring', false);
      cluster.save().then(() => {
        cb(true);
      }).catch((err) => {
        get(this, 'growl').fromError(err);
        cb(false);
      });
    }
  },

  status: computed('isReady', function() {
    if ( get(this, 'isReady') ) {
      return 'ready';
    } else if ( get(this, 'justDeployed') ) {
      return 'justDeployed'
    } else {
      return 'notReady'
    }
  }),

  saveDisabled: computed('selected', 'enabled', function() {
    return get(this, 'selected') === NONE && !get(this, 'enabled');
  }),

});

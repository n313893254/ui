import Component from '@ember/component';
import { get, set, observer, setProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import C from 'ui/utils/constants';
import layout from './template';
import { next } from '@ember/runloop';
const CUSTOM = 'custom';
const PERIODS = [
  {
    label: 'metricsAction.periods.custom',
    value: CUSTOM
  },
  {
    label:    'metricsAction.periods.5m',
    value:    'now-5m',
    interval: '5s'
  },
  {
    label:    'metricsAction.periods.1h',
    value:    'now-1h',
    interval: '60s'
  },
  {
    label:    'metricsAction.periods.6h',
    value:    'now-6h',
    interval: '60s'
  },
  {
    label:    'metricsAction.periods.24h',
    value:    'now-24h',
    interval: '300s'
  },
  {
    label:    'metricsAction.periods.7d',
    value:    'now-168h',
    interval: '1800s'
  },
  {
    label:    'metricsAction.periods.30d',
    value:    'now-720h',
    interval: '3600s'
  },
];

export default Component.extend({
  intl:        service(),
  globalStore: service(),
  scope:       service(),
  prefs:       service(),

  layout,

  resourceType:  'cluster',
  dashboardName: null,
  allowHide:     false,

  grafanaUrl: null,
  selected:   'now-1h',
  periods:    PERIODS,

  init() {
    this._super(...arguments);
    const periodPref = get(this, `prefs.${ C.PREFS.PERIOD }`);
    const hidePref = !!get(this, `prefs.${ C.PREFS.HIDE_GRAPH }`);

    if ( periodPref ) {
      set(this, 'selected', periodPref);
    }
    set(this, 'state.hide', hidePref);

    if ( !get(this, 'allowHide') || !hidePref ) {
      this.setGrafanaUrl();
      next(() => {
        this.query();
      });
    }
  },

  actions: {
    refresh() {
      this.query();
    },

    fromDidChange(from) {
      if ( get(from, 'length') ) {
        set(this, 'from', get(from, 'firstObject').getTime());
      }
    },

    toDidChange(to) {
      if ( get(to, 'length') ) {
        set(this, 'to', get(to, 'firstObject').getTime());
      }
    },

    onTimePickerClose() {
      this.query(false);
    },

    toggle(detail) {
      if ( !get(this, 'state.loading') ) {
        set(this, 'state.detail', detail);
        this.query();
      }
    }
  },

  setGrafanaUrl: observer('dashboards', function() {
    let dashboardName = get(this, 'resourceType') === 'workload' ? (get(this, 'workloadType') || '').capitalize() : get(this, 'dashboardName');

    const dashboard = (get(this, 'dashboards') || []).findBy('title', dashboardName);

    if (!dashboard) {
      return;
    }

    let grafanaUrl = `${ get(this, 'scope.currentCluster.monitoringStatus.grafanaEndpoint') }${ dashboard.url }`;

    switch (get(this, 'resourceType')) {
    case 'node':
      grafanaUrl += `?var-node=${ get(this, 'id') }&var-port=9100`;
      break;
    case 'workload':
      grafanaUrl += this.getWorkloadGrafanaUrl();
      break;
    case 'pod':
      grafanaUrl += `?var-namespace=${ get(this, 'namespaceId') }&var-pod=${ get(this, 'id') }&var-container=All`;
      break;
    }

    set(this, 'grafanaUrl', grafanaUrl);
  }),

  periodDidChange: observer('selected', function() {
    set(this, 'from', new Date().getTime() - 60000);
    set(this, 'to', new Date().getTime());
    set(this, 'now', new Date().getTime());
    if ( get(this, 'selected') !== CUSTOM ) {
      set(this, `prefs.${ C.PREFS.PERIOD }`, get(this, 'selected'));
    }

    this.query();
  }),

  hideDidChange: observer('state.hide', function() {
    set(this, `prefs.${ C.PREFS.HIDE_GRAPH }`, get(this, 'state.hide'));

    if ( !get(this, 'state.hide') ) {
      this.query();
    }
  }),

  getWorkloadGrafanaUrl() {
    const workloadType = get(this, 'workloadType');

    switch (workloadType) {
    case 'deployment':
      return `?var-deployment_namespace=${ get(this, 'namespace') }&var-deployment_name=${ get(this, 'id') }`;
    case 'daemonSet':
      return `?var-daemonset_namespace=${ get(this, 'namespace') }&var-daemonset_name=${ get(this, 'id') }`;
    case 'statefulSet':
      return `?var-statefulset_namespace=${ get(this, 'namespace') }&var-statefulset_name=${ get(this, 'id') }`;
    }
  },

  query(forceRefresh = true) {
    const period = get(this, 'selected');
    let from;
    let to;
    let interval;

    if ( period !== CUSTOM ) {
      const params = PERIODS.findBy('value', get(this, 'selected'));

      from = period,
      to = 'now',
      interval = get(params, 'interval')
    } else {
      from = get(this, 'from').toString();
      to = get(this, 'to').toString() || new Date().getTime().toString();
      interval = `${ Math.round((to - from) / 120000) }s`
    }
    setProperties(get(this, 'state'), {
      from,
      to,
      interval,
    });

    if ( period === CUSTOM ) {
      if ( !forceRefresh && get(this, 'preFrom') === from && get(this, 'preTo') === to ) {
        return;
      } else {
        set(this, 'preFrom', from);
        set(this, 'preTo', to);
      }
    }
    this.sendAction('queryAction');
  },

});

import C from 'ui/utils/constants';
import Component from '@ember/component';
import { set, get, computed, observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Grafana from 'shared/mixins/grafana';
import layout from './template';

const GRAFANA_LINKS = [
  {
    id:    'etcd',
    title: 'etcd'
  },
  {
    id:    'scheduler',
    title: 'Scheduler'
  },
  {
    id:    'controller',
    title: 'Controller Manager'
  },
  {
    id:    'nodes',
    title: 'Kubernetes Cluster Nodes'
  },
];

export default Component.extend(Grafana, {
  intl:        service(),
  scope:       service(),
  globalStore: service(),
  router:      service(),

  layout,

  nodes:             null,
  components:        null,
  grafanaLinks:      GRAFANA_LINKS,
  monitoringEnabled: alias('scope.currentCluster.enableClusterMonitoring'),
  componentStatuses: alias('scope.currentCluster.componentStatuses'),


  init() {
    this._super(...arguments);
    this.setComponents();
  },

  actions: {
    enalbeMonitoring() {
      get(this, 'router').transitionTo('authenticated.cluster.monitoring.cluster-setting');
    },
  },

  setComponents: observer('componentStatuses.@each.conditions', 'nodes.@each.{state}', function() {
    set(this, 'etcdHealthy', this.isHealthy('etcd'));
    set(this, 'controllerHealthy', this.isHealthy('controller-manager'));
    set(this, 'schedulerHealthy', this.isHealthy('scheduler'));
    set(this, 'nodesHealthy', get(this, 'inactiveNodes.length') === 0);
  }),

  showDashboard: computed('scope.currentCluster.isReady', 'nodes.[]', function() {
    return get(this, 'nodes').length && get(this, 'scope.currentCluster.isReady')
  }),

  inactiveNodes: computed('nodes.@each.state', function() {
    return get(this, 'nodes').filter( (n) => C.ACTIVEISH_STATES.indexOf(get(n, 'state')) === -1 );
  }),

  unhealthyComponents: computed('componentStatuses.@each.conditions', function() {
    return (get(this, 'componentStatuses') || [])
      .filter((s) => !s.conditions.any((c) => c.status === 'True'));
  }),

  isHealthy(field) {
    return (get(this, 'componentStatuses') || [])
      .filter((s) => s.name.startsWith(field))
      .any((s) => s.conditions.any((c) => c.status === 'True'));
  }
});

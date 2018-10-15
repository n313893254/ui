import { get, set, computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  globalStore:            service(),
  scope:                  service(),
  restartIntervalSeconds: null,

  projectId: reads('scope.currentProject.id'),

  init(...args) {
    this._super(...args);
    const n = get(this, 'model.podRule.restartIntervalSeconds') / 60 || 5;

    set(this, 'restartIntervalSeconds', n);
    set(this, 'model.podRule.restartIntervalSeconds', n * 60);
  },

  actions: {
    // todo, don't know that this is needed
    noop() {
    },
  },
  expressionChange: observer('model.metricRule.expression', function() {
    const expression = get(this, 'model.metricRule.expression')

    console.log(expression, 'expression')
    const globalStore = get(this, 'globalStore')
    const clusterId = get(this, 'scope.currentCluster.id')

    if (expression) {
      set(this, 'graphLoading', true)
      globalStore.rawRequest({
        url:    `monitormetrics?action=querycluster`,
        method: 'POST',
        data:   {
          expr:     expression,
          from:     'now-24h',
          interval: '300s',
          to:       'now',
          clusterId,
        }
      }).then((res) => {
        if (res.body) {
          const body = JSON.parse(res.body)
          const { series = [] } = body

          set(this, 'chartOption', { series })
        }
      }).finally(() => {
        set(this, 'graphLoading', false)
      })
    }
  }),

  pods: function() {
    const projectId = get(this, 'projectId');

    return get(this, 'store').all('pod').filterBy('projectId', projectId);
  }.property('projectId'),

  restartIntervalSecondsChanged: function() {
    const n = +get(this, 'restartIntervalSeconds') || 5;

    set(this, 'model.podRule.restartIntervalSeconds', n * 60);
  }.observes('restartIntervalSeconds'),

  workloads: function() {
    const projectId = get(this, 'projectId');

    return get(this, 'store').all('workload').filterBy('projectId', projectId);
  }.property('projectId'),

  metricsContent: computed('metrics.[]', function() {
    const metrics = get(this, 'metrics') || []

    return metrics.map((m) => ({
      label: m,
      value: m
    }))
  }),

});

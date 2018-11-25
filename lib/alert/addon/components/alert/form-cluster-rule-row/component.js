import { get, set } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads, alias } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';

const OPERATOR = [{
  label: 'Above',
  value: 'greater-than',
}, {
  label: 'Below',
  value: 'below',
}, {
  label: 'Equal',
  value: 'equal',
}, {
  label: 'Below or equal',
  value: 'less-or-equal'
}
// {
//   label: 'increases by',
//   value: 'increases',
// }, {
//   label: 'decreases by',
//   value: 'decreases',
// }, {
//   label: 'absent',
//   value: 'absent',
// }
]

const DURATION = [{
  label: '1 minute',
  value: '1m',
}, {
  label: '2 minutes',
  value: '2m',
}, {
  label: '3 minutes',
  value: '3m',
}, {
  label: '4 minutes',
  value: '4m',
}, {
  label: '5 minutes',
  value: '5m',
}, {
  label: '10 minutes',
  value: '10m',
}, {
  label: '15 minutes',
  value: '15m',
}, {
  label: '20 minutes',
  value: '20m',
}, {
  label: '30 minutes',
  value: '30m',
}, {
  label: '1 hour',
  value: '1h',
}, {
  label: '2 hours',
  value: '2h',
}, {
  label: '3 hours',
  value: '3h',
}, {
  label: '6 hours',
  value: '6h',
}, {
  label: '7 hours',
  value: '7h',
}, {
  label: '12 hours',
  value: '12h',
}, {
  label: '13 hours',
  value: '13h',
}, {
  label: '23 hours 30 minutes',
  value: '1d',
}]

export default Component.extend({
  globalStore:         service(),
  scope:               service(),
  operatorContent:     OPERATOR,
  durationContent:     DURATION,
  chartOption:         null,
  monitoringEnabled:   false,
  condition:           null,
  graphLoading:        null,
  models: computed('model', function() {
    return [get(this, 'model')]
  }),

  clusterId:           reads('scope.currentCluster.id'),
  init() {
    this._super(...arguments);
    console.log(this, 'this')
    const resourceKinds = get(this, 'globalStore')
      .getById('schema', 'eventrule')
      .optionsFor('resourceKind').sort()
      .map((value) => ({
        label: value,
        value,
      }));
    const systemServices = get(this, 'globalStore')
      .getById('schema', 'systemservicerule')
      .optionsFor('condition').sort()
      .map((value) => ({
        label: value,
        value,
      }));

    this.set('resourceKinds', resourceKinds);
    this.set('systemServices', systemServices);
    set(this, 'chartOption', get(this, 'chartOption'))
    this.expressionChange()
  },

  actions: {
    removeRule(rule) {
      this.sendAction('removeRule', rule);
    },
  },

  targetTypeChanged: observer('model._targetType', function() {
    const t = get(this, 'model._targetType');

    this.setEventType(t);
  }),

  // thresholdChanged: observer('condition.threshold', function() {
  //   const threshold = get(this, 'condition.threshold')
  //   const series = get(this, 'condition.chartOption.series').filter((s) => s.id !== 'threshold')
  //   console.log(series, 'series')
  //   series.pushObject({
  //     data:      [threshold, threshold, threshold, threshold, threshold, threshold, threshold],
  //     type:      'line',
  //     id:        'threshold',
  //     lineStyle: { color: '#f5222d', },
  //     symbol:    'none',
  //     ponits:
  //   })
  //   set(this, 'condition.chartOption.series', series)
  // }),
  metricsContent: computed('metrics.[]', function() {
    const metrics = get(this, 'metrics') || []
    return metrics.map((m) => ({
      label: m,
      value: m
    }))
  }),

  nodes: computed('clusterId', function() {
    const clusterId = get(this, 'clusterId');

    return get(this, 'globalStore').all('node').filterBy('clusterId', clusterId);
  }),

  isEventTarget: computed('model._targetType', function() {
    const t = get(this, 'model._targetType');

    return t === 'warningEvent' || t ===  'normalEvent';
  }),

  verbStyles: computed('model._targetType', function() {
    const tt = get(this, 'model._targetType');
    let out = '';

    if (tt === 'node' || tt === 'nodeSelector') {
      out = `padding-top: 6px;`;
    }

    return htmlSafe(out);
  }),

  setEventType(t) {
    if (t === 'warningEvent') {
      set(this, 'model.eventRule.eventType', 'Warning');
    }
    if (t === 'normalEvent') {
      set(this, 'model.eventRule.eventType', 'Normal');
    }
  },

  expressionChange: observer('model.metricRule.expression', function() {
    const expression = get(this, 'model.metricRule.expression')
    console.log(expression, 'expression')
    const globalStore = get(this, 'globalStore')
    const clusterId = get(this, 'scope.currentCluster.id')
    // const metrics = globalStore.rawRequest({
    //   url:    `cluster/${ clusterId }/monitormetrics?action=listmetricname&limit=3000`,
    //   method: 'POST'
    // }).catch((err) => console.log(err))
    if (expression) {
      set(this, 'graphLoading', true)
      globalStore.rawRequest({
        url:    `cluster/${ clusterId }/monitormetrics?action=query`,
        method: 'POST',
        data:   {
          expr: expression,
          from: 'now-24h',
          interval: '300s',
          to: 'now',
        }
      }).then(res => {
        if (res.body) {
          const body = JSON.parse(res.body)
          const {series=[]} = body

          // series.map(s => {
          //   const {name=''} = s
          //   const tooltipName = name.slice(0, name.indexOf('{'))
          //   s.name = tooltipName
          // })

          set(this, 'chartOption', {series})
        }

      }).finally(() => {
        set(this, 'graphLoading', false)
      })
    }
  }),

});

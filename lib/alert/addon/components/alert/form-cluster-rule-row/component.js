import { get, set } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads, alias } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';

const OPERATOR = [{
  label: 'above',
  value: 'above',
}, {
  label: 'below',
  value: 'below',
},
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
  chartOption:         {
    xAxis: {
      type:        'category',
      boundaryGap: false,
      data:        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis:  { type: 'value' },
    // series: [{
    //   data: [820, 932, 901, 934, 1290, 1330, 1320],
    //   type: 'line',
    // }],
    series: [{
      points: [],
    }]
  },
  monitoringEnabled:   false,
  condition:           null,
  graphLoading:        null,

  clusterId:           reads('scope.currentCluster.id'),
  targetNode:          alias('condition'),
  targetSystemService: alias('condition'),
  targetEvent:         alias('condition'),
  init() {
    this._super(...arguments);
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
    set(this, 'condition.chartOption', get(this, 'chartOption'))
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

  thresholdChanged: observer('condition.threshold', function() {
    const threshold = get(this, 'condition.threshold')
    const series = get(this, 'condition.chartOption.series').filter((s) => s.id !== 'threshold')
    console.log(series, 'series')
    series.pushObject({
      // data:      [threshold, threshold, threshold, threshold, threshold, threshold, threshold],
      // type:      'line',
      // id:        'threshold',
      // lineStyle: { color: '#f5222d', },
      // symbol:    'none',
      // ponits: 
    })
    set(this, 'condition.chartOption.series', series)
  }),
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

  expressionChange: observer('condition.expression', function() {
    const expression = get(this, 'condition.expression')
    const globalStore = get(this, 'globalStore')
    const clusterId = get(this, 'scope.currentCluster.id')
    const metrics = globalStore.rawRequest({
      url:    `cluster/${ clusterId }/monitormetrics?action=listmetricname&limit=3000`,
      method: 'POST'
    }).catch((err) => console.log(err))
    if (expression) {
      set(this, 'graphLoading', true)
      globalStore.rawRequest({
        url:    `cluster/${ clusterId }/monitormetrics?action=query`,
        method: 'POST',
        data:   {
          expr: get(this, 'condition.expression'),
          from: 'now-24h',
          interval: '300s',
          to: 'now',
        }
      }).then(res => {
        const body = JSON.parse(res.body)
        const {series=[]} = body
        set(this, 'condition.chartOption.series', series)
      }).finally(() => {
        set(this, 'graphLoading', false)
      })
    }
  }),

});

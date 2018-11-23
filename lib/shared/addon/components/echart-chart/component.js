import { inject as service } from '@ember/service';
import { get, set, observer } from '@ember/object';
import ThrottledResize from 'shared/mixins/throttled-resize';
import Component from '@ember/component';
import {
  formatPercent,
  formatMib,
  formatKbps
} from 'shared/utils/util';
import layout from './template';
import moment from 'moment';

const FORMATTERS = {
  value: (value) => {
    if ( value < 1 ) {
      return Math.round(value * 100) / 100;
    } else if ( value < 10 ) {
      return Math.round(value * 10) / 10;
    } else {
      return Math.round(value);
    }
  },
  ms: (value) => {
    return `${ Math.round(value)  } ms`
  },
  per:  formatPercent,
  mib:  formatMib,
  kbps: formatKbps
};

const CONVERTERS = {
  per: (value) => {
    return value * 100;
  },
  number: value => value,
}

const LOADING_PARAMS =  {
  text:      '',
  color:     '#3d3d3d',
  textColor: '#3d3d3d',
  maskColor: 'rgba(255, 255, 255, 0.8)',
  zlevel:    0
}

export default Component.extend(ThrottledResize, {
  intl:       service(),
  layout,

  tagName:    'div',
  classNames: ['graph-area'],

  model:  null,
  fields: null,
  chart:  null,

  minMax: null,

  formatter:   'value',
  needRefresh: false,

  didRender() {
    this._super();

    if ( !get(this, 'chart') ) {
      this.create();
      setTimeout(() => {
        const chart = get(this, 'chart');

        chart.resize();
      }, 200);
    }
  },

  loadingDidChange: observer('loading', function() {
    const chart = get(this, 'chart');

    if ( chart && get(this, 'loading') ) {
      chart.showLoading(LOADING_PARAMS);
    } else if (chart) {
      chart.hideLoading();
    }
  }),

  onResize() {
    if (get(this, 'chart')) {
      get(this, 'chart').resize();
    }
  },

  optionChange: observer('series.[]', function() {
    // const series = get(this, 'series')

    // get(this, 'chart').setOption(get(this, 'option'))
    this.draw()
  }),

  create() {
    const chart = echarts.init(this.$('.content')[0], 'walden');

    set(this, 'chart', chart);
    chart.showLoading(LOADING_PARAMS);
    this.draw();
  },

  draw() {
    console.log(this, 'this')
    const chart = get(this, 'chart');

    if ( !chart ) {
      return;
    }

    const minMax = get(this, 'minMax');
    let setMax = true;
    const series = [];
    const fields = (get(this, 'series') || []).map((serie) => {
      return {
        id:   get(serie, 'name'),
        data: get(serie, 'points').map((p) => [p[1], CONVERTERS['per'](p[0])])
      }
    });

    fields.forEach((field) => {
      const serie = field.data || [];
      const data = [];

      serie.forEach((d) => {
        if ( minMax && setMax && d[1] > minMax ) {
          setMax = false;
        }
        data.push(d);
      });

      series.push({
        name:       field.id,
        type:       'line',
        showSymbol: false,
        data,
        itemStyle:  { normal: { lineStyle: { width: 1 } } }
      });
    });
    const threshold = get(this, 'threshold')
    const formatter = FORMATTERS[get(this, 'formatter')];
    let option = {
      tooltip: {
        trigger:   'item',
        axisPointer: {
          axis: 'x',
          snap: true,
        },
        formatter(params) {
          let html = '';

          const {seriesName=''} = params
          const value = formatter(params.data[1]);

          const label = seriesName.slice(0, seriesName.indexOf('{'))
          const body = seriesName.slice(seriesName.indexOf('{') + 1, -1)
          const infos = body.split(', ').map((i='') => i.replace('=', ': '))

          html = `<div class="text-left">${ moment(params[0]).format('YYYY-MM-DD HH:mm:ss') }`
          html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${ params.color };"></span> ${ label } : ${ value }`;
          infos.map(i => {
            html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:transparent;"></span> ${ i }`
          })

          html += '</div>';

          return html;
        },
      },
      grid:    {
        top:          '10px',
        left:         '30px',
        right:        '30px',
        bottom:       '3%',
        containLabel: true
      },
      xAxis:   {
        type:        'time',
        boundaryGap: false,
        axisPointer: {
          show: true,
          snap: true,
          triggerTooltip: false,
        }
      },
      yAxis:  {
        type:      'value',
        axisLabel: { formatter: FORMATTERS[get(this, 'formatter')] },
        splitArea: { show: true },
      },
      series: [...series,
        {
          data:      series[0] && series[0].data.map(s => [s[0], threshold]),
          type:      'line',
          id:        'threshold',
          lineStyle: { color: '#f5222d', },
          symbol:    'none',
          name:      'Threshold',
          itemStyle: { color: '#f5222d', },
        }
      ],
      // axisPointer: {
      //   snap: true,
      //   triggerTooltip: false,
      // }
    };

    if ( setMax && minMax ) {
      option.yAxis.max = minMax;
    }

    chart.setOption(option, true);

    chart.hideLoading();
  },

  thresholdChanged: observer('threshold', function() {
    // const threshold = get(this, 'threshold')
    // const series = get(this, 'series').filter((s) => s.id !== 'threshold')
    // console.log(series, 'series')
    // series.pushObject({
    //   data:      [threshold, threshold, threshold, threshold, threshold, threshold, threshold],
    //   type:      'line',
    //   id:        'threshold',
    //   lineStyle: { color: '#f5222d', },
    //   symbol:    'none',
    // })
    // set(this, 'series', series)
    this.draw()
  }),
});

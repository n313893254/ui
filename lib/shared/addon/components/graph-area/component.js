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
  }
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

  create() {
    const chart = echarts.init(this.$('.content')[0], 'walden');

    set(this, 'chart', chart);
    chart.showLoading(LOADING_PARAMS);
    this.draw();
  },

  draw() {
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
        data: get(serie, 'points').map((p) => [p[1], CONVERTERS[get(this, 'formatter')](p[0])])
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

    const formatter = FORMATTERS[get(this, 'formatter')];
    let option = {
      tooltip: {
        trigger:   'axis',
        formatter(params) {
          let html = '';

          params.forEach((p, i) => {
            if ( i === 0 ) {
              html = `<div class="text-left">${ p.axisValueLabel }`
            }

            const value = formatter(p.data[1]);
            let label = p.seriesName;

            html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${ p.color };"></span> ${ label } : ${ value }`;
          });

          html += '</div>';

          return html;
        }
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
      },
      yAxis:  {
        type:      'value',
        axisLabel: { formatter: FORMATTERS[get(this, 'formatter')] },
        splitArea: { show: true },
      },
      series,
    };

    if ( setMax && minMax ) {
      option.yAxis.max = minMax;
    }

    chart.setOption(option, true);

    chart.hideLoading();
  },
});

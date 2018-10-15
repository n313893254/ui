import { inject as service } from '@ember/service';
import { get, set, observer } from '@ember/object';
<<<<<<< HEAD
=======
import moment from 'moment';
>>>>>>> alerting
import ThrottledResize from 'shared/mixins/throttled-resize';
import Component from '@ember/component';
import {
  formatPercent,
  formatMib,
  formatKbps
} from 'shared/utils/util';
import layout from './template';

const FORMATTERS = {
<<<<<<< HEAD
  value: (value) => {
=======
  value:   (value) => {
>>>>>>> alerting
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
<<<<<<< HEAD
  per:  formatPercent,
  mib:  formatMib,
  kbps: formatKbps
};

const CONVERTERS = {
  per: (value) => {
    return value * 100;
  }
}

=======
  percent: formatPercent,
  mib:     formatMib,
  kbps:    formatKbps
};

>>>>>>> alerting
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

<<<<<<< HEAD
    if ( !get(this, 'chart') ) {
=======
    if ( get(this, 'fields.length') > 0 && !get(this, 'chart') ) {
>>>>>>> alerting
      this.create();
      setTimeout(() => {
        const chart = get(this, 'chart');

        chart.resize();
      }, 200);
    }
  },

<<<<<<< HEAD
=======
  refresh: observer('model.needRefresh', function() {
    this.draw();
    set(this, 'model.needRefresh', false);
  }),

>>>>>>> alerting
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
<<<<<<< HEAD

    set(this, 'chart', chart);
    chart.showLoading(LOADING_PARAMS);
    this.draw();
  },

  draw() {
    const chart = get(this, 'chart');

    if ( !chart ) {
      return;
=======

    set(this, 'chart', chart);

    if ( get(this, 'loading') ) {
      chart.showLoading(LOADING_PARAMS);
    }
  },

  getFields() {
    const lines = get(this, 'lines');

    if ( lines) {
      const result = [];

      lines.forEach((line) => {
        get(this, 'fields').forEach((field) => {
          result.push({
            id:    `${ line.id }_${ field }`,
            data: get(line, `data.${ field }`) || []
          });
        });
      });

      return result;
    } else {
      return get(this, 'fields').map((field) => {
        return {
          id:    field,
          data:  get(this, `model.${ field }`) || []
        }
      });
>>>>>>> alerting
    }

<<<<<<< HEAD
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
=======
  draw() {
    const chart = get(this, 'chart');

    if ( !chart ) {
      return;
    }

    const minMax = get(this, 'minMax');
    let setMax = true;
    const xAxis = [];
    const series = [];
    const fields = this.getFields();

    fields.forEach((field, index) => {
      const serie = field.data || [];
      const data = [];
      let dateIndex = 0;

      serie.forEach((d) => {
        if ( index === dateIndex || xAxis.length === 0 ) {
          dateIndex = index;
          const date = new Date(d[1]);

          xAxis.push(moment(date).format('MM/DD h:mm'));
        }
        if ( minMax && setMax && d[0] > minMax ) {
          setMax = false;
        }
        data.push(d[0]);
>>>>>>> alerting
      });

      series.push({
        name:       field.id,
        type:       'line',
        showSymbol: false,
<<<<<<< HEAD
        data,
        itemStyle:  { normal: { lineStyle: { width: 1 } } }
=======
        data
>>>>>>> alerting
      });
    });

    const formatter = FORMATTERS[get(this, 'formatter')];
<<<<<<< HEAD
=======
    const intl = get(this, 'intl');
    const self = this;
>>>>>>> alerting
    let option = {
      tooltip: {
        trigger:   'axis',
        formatter(params) {
          let html = '';

          params.forEach((p, i) => {
            if ( i === 0 ) {
              html = `<div class="text-left">${ p.axisValueLabel }`
            }
<<<<<<< HEAD

            const value = formatter(p.data[1]);
            let label = p.seriesName;

            html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${ p.color };"></span> ${ label } : ${ value }`;
=======
            const value = formatter(p.data);
            let label = p.seriesName;
            let name;

            if ( get(self, 'lines') ) {
              const i = label.lastIndexOf('_');

              name = label.substr(0, i);
              label = label.slice(i + 1);
            }
            html += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${ p.color };"></span> ${ intl.t(`infoMultiStats.${ label }`) }: ${ value } ${ name ? `(${  name  })` : '' }`;
>>>>>>> alerting
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
<<<<<<< HEAD
        type:        'time',
        boundaryGap: false,
=======
        type:        'category',
        boundaryGap: false,
        data:        xAxis,
>>>>>>> alerting
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

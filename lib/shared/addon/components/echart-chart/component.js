import { get, set } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads, alias } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';
import ThrottledResize from 'shared/mixins/throttled-resize';
import layout from './template';

export default Component.extend(ThrottledResize, {
  globalStore: service(),
  scope:       service(),
  layout,
  option:      {},

  clusterId:   reads('scope.currentCluster.id'),
  init() {
    this._super(...arguments);
    $(window).on('resize', this.handleResize.bind(this));
  },

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
  optionChange: observer('option.{series.[]}', function() {
    const option = get(this, 'option')

    get(this, 'chart').setOption(get(this, 'option'))
    // const chart = get(this, 'chart')
    // let preOption = chart.getOption()
    // const preSeries = preOption.series || []
    // const series = option.series || []
    // if (preSeries.length > series.length) {
    //   set(preOption, 'series', [])
    //   chart.setOption(preOption, true)
    // }
    // chart.setOption(option)
  }),

  create() {
    const chart = echarts.init(this.$('.content')[0], 'walden');

    set(this, 'chart', chart);

    if ( get(this, 'loading') ) {
      chart.showLoading(LOADING_PARAMS);
    }
    chart.setOption(get(this, 'option'));
  },

  handleResize() {
    const chart = get(this, '_chart');

    if (chart) {
      chart.resize();
    }
  },

});

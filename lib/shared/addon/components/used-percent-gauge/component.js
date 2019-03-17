import ThrottledResize from 'shared/mixins/throttled-resize';
import initGraph from 'ui/utils/used-percent-gauge';
import layout from './template';
import { get, set, observer } from '@ember/object'
import { next } from '@ember/runloop';
import PercentGauge from 'monitoring/components/percent-gauge/component';

export default PercentGauge.extend(ThrottledResize, {
  layout,
  tagName:    'div',
  classNames: ['percent-gauge'],
  value:      null,
  title:      null,
  subtitle:   null,
  ticks:      null,
  svg:        null,
  ready:      false,

  didInsertElement() {
    set(this, 'svg', initGraph({
      el:        this.$()[0],
      value:     get(this, 'value'),
      live:      get(this, 'live'),
      title:     get(this, 'title'),
      subtitle:  get(this, 'subtitle'),
      ticks:     get(this, 'ticks'),
      liveTitle: get(this, 'liveTitle'),
      liveTicks: get(this, 'liveTicks'),
      maxValue:  get(this, 'maxValue'),
      maxWheel:  get(this, 'maxWheel'),
    }));

    next(this, () => {
      if ( this.isDestroyed || this.isDestroying ) {
        return
      }

      set(this, 'ready', true);
    });
  },

  updateValue: observer('value', 'live', 'maxValue', 'maxWheel', function() {
    get(this, 'svg').updateValue(get(this, 'value'), get(this, 'live'), get(this, 'maxValue'), get(this, 'maxWheel'));
  }),

  updateLiveLabel: observer('liveTitle', function() {
    get(this, 'svg').updateLiveLabel(get(this, 'liveTitle'));
  }),

  updateTicks: observer('ticks.@each.{label,value}', 'liveTicks.@each.{label,value}', 'maxValue', 'maxWheel', function() {
    get(this, 'svg').updateTicks(get(this, 'ticks'), get(this, 'liveTicks'), get(this, 'live'), get(this, 'maxValue'), get(this, 'maxWheel'));
  }),
});

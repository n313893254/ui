import Component from '@ember/component';
import { computed, get, observer } from '@ember/object';
import layout from './template';

export default Component.extend({
  layout,

  color:  '',
  min:    0,
  value:  0,
  max:    100,
  zIndex: null,

  didInsertElement() {
    this.percentDidChange();
    this.zIndexDidChange();
  },

  percentDidChange: observer('percent', function() {
    this.$('.progress-bar').css('width', `${ this.get('percent')  }%`);
  }),

  zIndexDidChange: observer('zIndex', function() {
    this.$().css('zIndex', this.get('zIndex') || 'inherit');
  }),

  tooltipContent: computed('percent', function() {
    return `${ get(this, 'percent') } %`;
  }),

  percent: computed('min', 'max', 'value', function() {
    var min   = this.get('min');
    var max   = this.get('max');
    var value = Math.max(min, Math.min(max, this.get('value')));

    var per = value / (max - min) * 100; // Percent 0-100

    per = Math.round(per * 100) / 100; // Round to 2 decimal places

    return per;
  }),

  colorClass: computed('color', function() {
    var color = this.get('color');

    if ( !color ) {
      return;
    }

    return `progress-bar-${  color.replace(/^progress-bar-/, '') }`;
  }),

});

import Ember from 'ember';
import layout from './template';
import Component from '@ember/component';

export default Component.extend({
  layout,
  value: {},
  didInsertElement(){

    const formatter = new window.JSONFormatter(this.value, 0);
    let v = formatter.render();

    this.$().append(v);

  },
});

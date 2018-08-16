import Ember from 'ember';
import layout from './template';
import Component from '@ember/component';

export default Component.extend({
  layout,
  value: {},
  didInsertElement(){

    let clone = this.value.clone()

    delete clone.actionLinks
    delete clone.type
    delete clone.links
    delete clone._super
    delete clone.willDestroy
    delete clone.baseType

    const formatter = new window.JSONFormatter(clone, 1, { theme: 'dark' });
    let v = formatter.render();

    this.$().append(v);

  },
});

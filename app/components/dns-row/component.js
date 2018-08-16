import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import {
  get, set, computed
} from '@ember/object';

export default Component.extend({
  scope:   service(),
  session:  service(),

  layout,
  model:   null,
  tagName: '',
  init() {
    this._super(...arguments);
    console.log(get(this, 'model'), 'model')
  },
});

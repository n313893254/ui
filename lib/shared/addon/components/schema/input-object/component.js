import { on } from '@ember/object/evented';
import { next, debounce } from '@ember/runloop';
import Component from '@ember/component';
import { get, set, observer } from '@ember/object'
import Upload from 'shared/mixins/upload';
import layout from './template';

export default Component.extend({
  layout,
  init() {
    this._super(...arguments)
    console.log(this, 'this')
  },
});

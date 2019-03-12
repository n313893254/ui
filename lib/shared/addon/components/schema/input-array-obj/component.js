import { on } from '@ember/object/evented';
import { next, debounce } from '@ember/runloop';
import Component from '@ember/component';
import { get, set, observer, computed } from '@ember/object'
import Upload from 'shared/mixins/upload';
import layout from './template';

export default Component.extend({
  layout,

  classNames: ['box', 'row', 'mb-20'],

  init() {
    this._super(...arguments)
    console.log(this, 'this')
  },

  isOdd: computed('questions.length', function() {
    return get(this, 'questions.length') % 2 === 1
  }),
});

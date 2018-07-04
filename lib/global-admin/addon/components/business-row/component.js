import Component from '@ember/component';
import layout from './template';
import {computed, get} from '@ember/object'

export default Component.extend({
  layout,
  model:    null,
  tagName:  '',
  id: computed('model.id', function() {
    const id = get(this, 'model.id') || ''
    return id.split(':')[1]
  }),
});

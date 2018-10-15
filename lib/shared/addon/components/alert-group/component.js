import Component from '@ember/component';
import layout from './template';
import {
  get, set, observer, computed, setProperties
} from '@ember/object';

export default Component.extend({
  layout,
  model:        null,
  fullColspan:  null,
  alignState:   'text-center',
  noGroup:      'namespaceGroup.none',
  groups:       [],

  tagName:      '',

  group: computed('model.group', function() {
    const groupId = get(this, 'model.group')
    const groups = get(this, 'groups')
    const filter = groups.filter((g) => g.id === groupId)

    return get(filter, 'firstObject')
  }),
});

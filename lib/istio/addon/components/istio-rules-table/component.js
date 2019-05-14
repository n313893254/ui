import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from './template';
import { get, computed } from '@ember/object';

export default Component.extend({
  scope: service(),

  layout,
  sortBy: 'name',

  headers: [
    {
      name:           'state',
      sort:           ['sortState', 'displayName'],
      searchField:    'displayState',
      translationKey: 'generic.state',
      width:          120
    },
    {
      name:           'name',
      sort:           ['displayName', 'id'],
      searchField:    'displayName',
      translationKey: 'generic.name',
    },
  ],

  apps: null,

  rows: computed('apps.@each.isIstio', function(){
    return (get(this, 'apps') || []).filterBy('isIstio', true);
  }),
});

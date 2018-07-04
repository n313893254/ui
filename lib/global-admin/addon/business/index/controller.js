import { inject as service } from '@ember/service';
import Controller, { inject as controller } from '@ember/controller';
import { getOwner } from '@ember/application';

const headers = [
  {
    name:           'Id',
    sort:           ['name','id'],
    translationKey: 'generic.id',
  },
  {
    name:           'name',
    searchField:    'displayName',
    sort:           ['displayName','id'],
    translationKey: 'businessPage.name.label',
  },
  {
    name:           'description',
    searchField:    'displayProvider',
    sort:           ['displayProvider','name','id'],
    translationKey: 'businessPage.description.label',
  },
];

export default Controller.extend({
  access: service(),
  scope: service(),
  settings: service(),
  application: controller(),

  headers: headers,
  extraSearchFields: ['version.gitVersion'],
  sortBy: 'name',
  searchText: null,
  bulkActions: true,
});

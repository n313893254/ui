import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  modalService: service('modal'),
  globalStore:  service(),

  queryParams: ['type'],
  currentType: 'slack',
});

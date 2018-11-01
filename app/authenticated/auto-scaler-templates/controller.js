import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get } from '@ember/object';

export default Controller.extend({
  modalService:      service('modal'),

  sortBy:            'name',
  headers: [
    {
      name:           'name',
      sort:           ['name', 'id'],
      translationKey: 'nodeTemplatesPage.table.name',
      width:          280,
    },
    {
      name:           'templateInstance',
      sort:           ['displayProvider', 'name', 'id'],
      translationKey: 'autoScalerTemplatesPage.templateInstance.label',
    },
  ],

  actions: {
    newTemplate() {

      const record = this.get('globalStore').createRecord({ type: 'autoScalerTemplate', });

      get(this, 'modalService').toggleModal('modal-edit-auto-scaler-template', record);

    },
  },
});

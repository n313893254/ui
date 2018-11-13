import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import NewOrEdit from 'shared/mixins/new-or-edit';
import ModalBase from 'shared/mixins/modal-base';
import layout from './template';
import {
  get, set, computed
} from '@ember/object';

const TEMPLATE_TYPE = ['Node', 'Pod']

export default Component.extend(ModalBase, NewOrEdit, {
  endpointService: service('endpoint'),
  scope:           service(),
  access:          service(),

  layout,
  classNames:    ['large-modal', 'alert'],
  model:         null,
  clone:         null,
  justCreated:   false,
  expire:        'never',

  errors:              [],
  originalModel:       alias('modalService.modalOpts'),
  templateTypeContent: computed('model', () => {

    return TEMPLATE_TYPE.map((item) => ({
      label: item,
      value: item
    }))

  }),
  displayEndpoint: function() {

    return get(this, 'endpointService.api.display.current');

  }.property(),

  linkEndpoint: function() {

    return get(this, 'endpointService.api.auth.current');

  }.property(),

  editing: function() {

    return !!get(this, 'clone.id');

  }.property('clone.id'),

  displayPassword: computed('clone.token', 'clone.name', function() {

    const prefix = get(this, 'clone.name');
    const token = get(this, 'clone.token');

    if ( !token || !prefix ) {

      return null;

    }

    const parts = token.split(':');

    if ( parts.length === 2 && parts[0] === prefix ){

      return parts[1];

    }

    return null;

  }),

  didReceiveAttrs() {

    set(this, 'clone', get(this, 'originalModel').clone());
    set(this, 'model', get(this, 'originalModel').clone());
    set(this, 'justCreated', false);
    set(this, 'model.templateType', 'Node')

  },

  willSave() {

    set(this, 'model.namespaceId', get(this, 'access.me.id'))

    return this._super(...arguments);

  },

  validate() {

    this._super(...arguments);
    const errors = [];

    if ( !get(this, 'model.name')) {

      errors.pushObject('"Name" is required');

    }
    if ( !get(this, 'model.templateInstance')) {

      errors.pushObject('"Template Instance" is required');

    }
    set(this, 'errors', errors);

    return errors.length === 0;

  },


  doneSaving() {

    this.send('cancel');

  },

});

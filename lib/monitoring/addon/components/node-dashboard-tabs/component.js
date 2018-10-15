import Component from '@ember/component';
import { set } from '@ember/object';
import layout from './template';
import { inject as service } from '@ember/service';

const TABS = ['node', 'nodeReservation'];

export default Component.extend({
  scope: service(),

  layout,

  mode: 'node',
  tabs: TABS,

  actions: {
    switchTab(mode)  {
      set(this, 'mode', mode);
    }
  }
});

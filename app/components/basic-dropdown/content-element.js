import ContentElement from 'ember-basic-dropdown/components/basic-dropdown/content-element';
import { get } from '@ember/object';
import { next } from '@ember/runloop';

const CE =  ContentElement.extend({
  click(event) {

    if (event.target.className === 'ember-power-calendar-nav-control') {

      return

    }
    this.closeDD();

    return true;

  },
  closeDD() {

    let dd = get(this, 'parentView.dropdown');

    if (get(dd, 'actions')) {

      next(() => {

        dd.actions.close();

      });

    }

  },
});


export default CE;

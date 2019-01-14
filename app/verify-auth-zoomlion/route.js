import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import C from 'shared/utils/constants';
import VerifyAuth from 'ui/mixins/verify-auth';

export default Route.extend(VerifyAuth, {
  globalStore: service(),

  model(params/* , transition */) {
    const globalStore = get(this, 'globalStore')

    if (window.opener && !get(params, 'login')) {
      if (get(params, 'code')) {
        reply(params.error_description, params.code);
      }
    }

    function reply(err, code) {
      try {
        window.opener.window.onAuthTest(err, code);
        setTimeout(() => {
          window.close();
        }, 250);

        return new RSVP.promise();
      } catch (e) {
        window.close();
      }
    }
  }

});
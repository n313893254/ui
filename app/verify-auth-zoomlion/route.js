import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { addQueryParams, parseUrl } from 'shared/utils/util';
import { reject } from 'rsvp';
import VerifyAuth from 'ui/mixins/verify-auth';

const allowedForwards = ['localhost'];

export default Route.extend(VerifyAuth, {
  globalStore: service(),
  zoomlion:    service(),

  model(params/* , transition */) {
    const forward = get(params, 'forward');
    const code    = get(params, 'code');
    const zoomlion  = get(this, 'zoomlion');

    // Allow another redirect if the hostname is in the whitelist above.
    // This allows things like sharing github auth between rancher at localhost:8000
    // and rio dev at localhost:8004
    if ( forward ) {
      const parsed = parseUrl(forward);

      if ( allowedForwards.includes(parsed.hostname.toLowerCase()) ) {
        if ( get(params, 'login') ) {
          window.location.href = addQueryParams(forward, {
            forwarded: 'true',
            code
          });
        } else {
          zoomlion.login(forward);
        }
      } else {
        return reject(new Error('Invalid forward url'));
      }

      return;
    }

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
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import C from 'shared/utils/constants';
import VerifyAuth from 'ui/mixins/verify-auth';

const samlProviders = ['ping', 'adfs', 'keycloak'];

export default Route.extend(VerifyAuth, {
  globalStore: service(),

  model(params/* , transition */) {
    const globalStore = get(this, 'globalStore')

    if (get(params, 'code')) {
      let ghProvider = get(this, 'access.providers').findBy('id', 'zoomlion');

      return ghProvider.doAction('login', {
        code:         get(params, 'code'),
        responseType: 'cookie',
        description:  C.SESSION.DESCRIPTION,
        ttl:          C.SESSION.TTL,
      }).then(() => {
        return get(this, 'access').detect()
          .then(() => this.transitionTo('authenticated'));
      });
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
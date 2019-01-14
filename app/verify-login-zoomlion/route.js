import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import C from 'shared/utils/constants';
import VerifyAuth from 'ui/mixins/verify-auth';

export default Route.extend(VerifyAuth, {
  globalStore: service(),

  model(params/* , transition */) {
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
  }

});
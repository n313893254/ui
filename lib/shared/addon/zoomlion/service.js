import Service, { inject as service } from '@ember/service';
import Util from 'shared/utils/util';
import { get, set } from '@ember/object';
import C from 'shared/utils/constants';

 export default Service.extend({
  access:      service(),
  cookies:     service(),
  session:     service(),
  globalStore: service(),
  app:         service(),
  intl:        service(),

   generateState() {
    return set(this, 'session.githubState', `${ Math.random() }`);
  },

   stateMatches(actual) {
    return actual && get(this, 'session.githubState') === actual;
  },

   testConfig(config) {
    return config.doAction('configureTest', config);
  },

   saveConfig(config, opt) {
    return config.doAction('testAndApply', opt);
  },

   authorize(auth, state) {
    const url = Util.addQueryParams(get(auth, 'redirectUrl'), {
      scope:        'read:org',
      redirect_uri: `${ window.location.origin }/verify-auth`,
      authProvider: 'github',
      state,
    });

     return window.location.href = url;
  },

   login() {
    const provider     = get(this, 'access.providers').findBy('id', 'sso');
    const authRedirect = get(provider, 'redirectUrl');
    const redirect     = `${ window.location.origin }/verify-login-saic`

     const url = Util.addQueryParams(authRedirect, { callbackUrl: redirect, });

     window.location.href = url;
  },

   test(config, cb, redirectUrl) {
    let responded = false;

     console.log(redirectUrl, 'redirectUrl')
    window.onAuthTest = (err, code) => {
      if ( !responded ) {
        let ghConfig = config;

         responded = true;

         this.finishTest(ghConfig, code, cb);
      }
    };
    // let url = redirectUrl
    let url = `${ config.tls ? 'https' : 'http' }://${ config.hostname }/appAuthorize/authorize?client_id=${ config.clientId }&callbackUrl=${ window.location.origin }/verify-auth-saic`

     const popup = window.open(url, 'rancherAuth', Util.popupWindowOptions());
    const intl = get(this, 'intl');

     let timer = setInterval(() => {
      if (popup && popup.closed ) {
        clearInterval(timer);

         if ( !responded ) {
          responded = true;
          cb({
            type:    'error',
            message: intl.t('authPage.saic.testAuth.authError')
          });
        }
      } else if (popup === null || typeof (popup) === 'undefined') {
        clearInterval(timer);

         if ( !responded ) {
          responded = true;

           cb({
            type:    'error',
            message: intl.t('authPage.saic.testAuth.popupError')
          });
        }
      }
    }, 500);
  },

   finishTest(config, code, cb) {
    const ghConfig = config;

     set(ghConfig, 'enabled', true);
    // set(ghConfig, 'hostname', `saic.saicmotor.com`);
    let out = {
      code,
      enabled:      true,
      ssoConfig:    ghConfig,
      description:  C.SESSION.DESCRIPTION,
      ttl:          C.SESSION.TTL,
    };

     const allowedPrincipalIds = get(config, 'allowedPrincipalIds') || [];

     return this.saveConfig(config, out).then(() => {
      let found = false;
      const myPIds = get(this, 'access.me.principalIds');

       myPIds.forEach( (id) => {
        if (allowedPrincipalIds.indexOf(id) >= 0) {
          found = true;
        }
      });

       if ( !found && !allowedPrincipalIds.length) {
        allowedPrincipalIds.pushObject(get(this, 'access.principal.id'));
      }

       return ghConfig.save().then(() => {
        window.location.href = window.location.href;
      });
    })
      .catch((err) => {
        cb(err);
      });
  },
});
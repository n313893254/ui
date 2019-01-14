import { get, set, computed, setProperties } from '@ember/object';
import { observer } from '@ember/object';
import { once } from '@ember/runloop';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import C from 'ui/utils/constants';
import AuthMixin from 'global-admin/mixins/authentication';

export default Controller.extend(AuthMixin, {
  zoomlion:       service(),
  endpoint:       service(),
  access:         service(),
  settings:       service(),
  globalStore:    service(),

  confirmDisable: false,
  errors:         null,
  testing:        false,
  error:          null,
  saved:          false,
  saving:         false,
  haveToken:      false,

  organizations:  null,
  isEnterprise:   false,
  secure:         true,

  protocolChoices: [
    {
      label: 'https:// -- Requires a cert from a public CA',
      value: 'https://'
    },
    {
      label: 'http://',
      value: 'http://'
    },
  ],

  authConfig:     alias('model.zoomlionConfig'),
  scheme:         alias('authConfig.scheme'),
  isEnabled:      alias('authConfig.enabled'),

  actions: {
    save() {
      this.send('clearError');

      if (!this.validate()) {
        return
      }

      set(this, 'saving', true);

      const authConfig   = get(this, 'authConfig');
      const am           = get(authConfig, 'accessMode') || 'restricted';

      authConfig.setProperties({
        'clientId':            (authConfig.get('clientId') || '').trim(),
        'clientSecret':        (authConfig.get('clientSecret') || '').trim(),
        'enabled':             false, // It should already be, but just in case..
        'accessMode':          am,
        'tls':                 authConfig.get('tls'),
        'allowedPrincipalIds': [],
        callBackHostName:      authConfig.get('callBackHostName'),
        hostname:              authConfig.get('hostname'),
      });

      get(this, 'zoomlion').setProperties({
        scheme:   authConfig.get('scheme'),
        clientId: authConfig.get('clientId')
      });

      const gs = get(this, 'globalStore')

      gs.rawRequest({
        url:    `/v3/ssoConfigs/sso?action=configureTest`,
        method: 'POST',
        data:   {
          clientId:         authConfig.get('clientId'),
          clientSecret:     authConfig.get('clientSecret'),
          callBackHostName: authConfig.get('callBackHostName'),
          hostname:         authConfig.get('hostname'),
          'tls':            authConfig.get('tls'),
        },
      }).then((res) => {
        const redirectUrl = res.body.redirectUrl

        this.gotRedirectUrl(redirectUrl)
      }).catch((err) => {
        const errors = get(this, 'errors') || []

        errors.push('Obtained redirectUrl failed')
        set(this, 'errors', errors)
      })
    },
  },


  createDisabled: computed('authConfig.{clientId,clientSecret,hostname}', 'testing', 'isEnterprise', 'haveToken', function() {
    if (!get(this, 'haveToken')) {
      return true;
    }
    if ( get(this, 'isEnterprise') && !get(this, 'authConfig.hostname') ) {
      return true;
    }

    if ( get(this, 'testing') ) {
      return true;
    }
  }),

  providerName: computed('authConfig.hostname', function() {
    if ( get(this, 'authConfig.hostname') &&  get(this, 'authConfig.hostname') !== 'github.com') {
      return 'authPage.github.enterprise';
    } else {
      return 'authPage.github.standard';
    }
  }),

  numUsers: computed('authConfig.allowedPrincipals.@each.externalIdType', 'wasRestricted', function() {
    return ( get(this, 'authConfig.allowedPrincipalIds') || []).filter((principal) => principal.includes(C.PROJECT.TYPE_GITHUB_USER)).get('length');
  }),


  destinationUrl: computed(() => {
    return `${ window.location.origin }/`;
  }),

  validate() {
    const errors = get(this, 'errors') || []

    if (!get(this, 'authConfig.clientId')) {
      errors.push('Client Id is required')
    }
    if (!get(this, 'authConfig.clientSecret')) {
      errors.push('Client Secret is required')
    }
    if (!get(this, 'authConfig.hostname')) {
      errors.push('SSO Host is required')
    }
    set(this, 'errors', errors)

    return errors.length > 0 ? false : true
  },

  gotRedirectUrl(redirectUrl) {
    const authConfig   = get(this, 'authConfig');

    set(this, '_boundSucceed', this.authenticationApplied.bind(this));
    get(this, 'zoomlion').test(authConfig, get(this, '_boundSucceed'), redirectUrl);
  },

  authenticationApplied(err) {
    set(this, 'saving', false);

    if (err) {
      set(this, 'isEnabled', false);
      this.send('gotError', err);

      return;
    }

    this.send('clearError');
  },
});
import { get, set, computed, setProperties } from '@ember/object';
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
      set(this, 'saving', true);

      const authConfig = get(this, 'authConfig');
      const am           = get(authConfig, 'accessMode') || 'restricted';

      setProperties(authConfig, {
        'clientId':            (authConfig.get('clientId') || '').trim(),
        'clientSecret':        (authConfig.get('clientSecret') || '').trim(),
        'enabled':             false, // It should already be, but just in case..
        'accessMode':          am,
        'tls':                 get(authConfig, 'tls'),
        'allowedPrincipalIds': [],
      });

      setProperties(get(this, 'zoomlion'), {
        hostname: authConfig.get('hostname'),
        scheme:   authConfig.get('scheme'),
        clientId: authConfig.get('clientId')
      });


      set(this, '_boundSucceed', this.authenticationApplied.bind(this));
      get(this, 'zoomlion').test(authConfig, get(this, '_boundSucceed'));
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

  numOrgs: computed('authConfig.allowedPrincipals.@each.externalIdType', 'wasRestricted', function() {
    return ( get(this, 'authConfig.allowedPrincipalIds') || []).filter((principal) => principal.includes(C.PROJECT.TYPE_GITHUB_ORG)).get('length');
  }),

  destinationUrl: computed(() => {
    return `${ window.location.origin }/`;
  }),

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
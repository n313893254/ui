import Ember from 'ember';
import Util from 'ui/utils/util';

export default Ember.Service.extend({
  userStore: Ember.inject.service(),
  session  : Ember.inject.service(),
  access: Ember.inject.service(),

  hasToken: null,

  getToken: function() {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this.get('userStore').rawRequest({
        url: 'token',
      })
      .then((xhr) => {
        resolve(xhr.body.data[0]);
        return ;
      })
      .catch((err) => {
        reject(err);
      });
    });
  },

  getAuthorizeUrl: function(test) {
    this.getToken().then(() => {
      var url = this.get('access.token.redirectUrl');

      if (test) {
        url += '?isTest=true';

      }
      console.log(url);
      return url;
    });
  },

  authorizeTest: function(cb) {
    var responded = false;
    window.onYunhongTest = function(err,code) {
      if ( !responded ) {
        responded = true;
        cb(err,code);
      }
    };

    this.getToken().then((token) => {
      var url = token.redirectUrl;

      url += '?isTest=true';

      var popup = window.open(url, 'rancherAuth', Util.popupWindowOptions());

      var timer = setInterval(function() {
        if ( !popup || popup.closed ) {
          clearInterval(timer);
          if( !responded ) {
            responded = true;
            cb({type: 'error', message: '云宏认证失败'});
          }
        }
      }, 500);
    });
  },

  logout: function() {
    let url = this.get('access.token.redirectUrl');
    let logoutUrl = url.slice(0, url.indexOf('login')) + 'logout';
    window.location.href = logoutUrl;
  },
});

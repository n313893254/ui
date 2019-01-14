import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { hash } from 'rsvp';
import ENV from 'ui/config/environment'

 export default Route.extend({
  globalStore: service(),
  model() {
    let gs = get(this, 'globalStore');

     return hash({
      ssoConfig: gs.find('authconfig', 'zoomlion'),
      // principals:   gs.all('principal')
    }).catch( (e) => {
      return e;
    })
  },

   setupController(controller, model) {
    let hostname = get(model, 'githubConfig.hostname')

     controller.setProperties({
      model,
      confirmDisable: false,
      testing:        false,
      organizations:  get(this, 'session.orgs') || [],
      errors:         null,
    });

     controller.set('saved', true);

     if (ENV.environment === 'development') {
      const authConfig = get(model, 'ssoConfig')
      authConfig.setProperties({
        clientId: 'client',
        clientSecret: 'oauth2test',
        callBackHostName: '10.39.52.225:8088',
      })
    }
  }
});
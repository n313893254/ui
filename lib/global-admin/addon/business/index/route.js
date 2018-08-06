import { next } from '@ember/runloop';
import Route from '@ember/routing/route';
import { inject as service } from "@ember/service";
import { get, set } from '@ember/object';

export default Route.extend({
  k8sStore: service(),

  model() {
    const store = this.get('k8sStore');
    return store.findAll('business', {url:`${store.baseUrl}/v3/business`, forceReload: true}).then(() => {
      return {
        business: store.all('business'),
      };
    }).catch((err) => {
      const {message=''} = err
      const messageObj = JSON.parse(message)
      console.log(messageObj)
      const {Message=''} = messageObj
      if (Message.startsWith('Forbidden 403')) {
        get(this, 'router').transitionTo('global-admin.business.poi')
      }
    });
  },
});

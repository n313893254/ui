import Route from '@ember/routing/route';
import { inject as service } from "@ember/service";
import { get } from '@ember/object';

export default Route.extend({
  k8sStore: service(),
  access: service(),

  model() {
    const store = this.get('k8sStore');
    return store.findAll('business', {url:`${store.baseUrl}/v3/business`, forceReload: true}).then((res) => {
      console.log(res, 'hikari')
      return {
        business: res,
        user: get(this, 'access.me'),
      };
    }).catch(() => {
      get(this, 'router').transitionTo('global-admin.clusters')
    });
  },
});

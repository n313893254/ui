import Route from '@ember/routing/route';
import { inject as service } from "@ember/service";

export default Route.extend({
  k8sStore: service(),

  model() {
    const store = this.get('k8sStore');
    return store.findAll('business', {url:`${store.baseUrl}/v3/business`, forceReload: true}).then(() => {
      return {
        business: store.all('business'),
      };
    }).catch((res) => {
      console.log(res)
    });
  },
});

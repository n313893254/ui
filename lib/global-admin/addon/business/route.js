import Route from '@ember/routing/route';
import { inject as service } from "@ember/service";

export default Route.extend({
  globalStore: service(),

  model() {
    const store = this.get('globalStore');
    return store.findAll('businessQuota').then(() => {
      return {
        business: store.all('businessQuota'),
      };
    });
  },
});

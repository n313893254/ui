import { next } from '@ember/runloop';
import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { inject as service } from "@ember/service";
import { hash/* , all */ } from 'rsvp';

export default Route.extend({
  globalStore:  service(),
  k8sStore: service(),
  access: service(),
  clusterStore: service(),

  model() {
    const globalStore = get(this, 'globalStore')
    const k8sStore = get(this, 'k8sStore')
    const clusterStore = get(this, 'clusterStore')
    return hash({
      clusters: globalStore.findAll('cluster'),
      business: clusterStore.findAll('business', {url:`${k8sStore.baseUrl}/v3/business`, forceReload: true}).catch(err => console.log(err)),
      user: get(this, 'access.me'),
    })
    // .then(hash => {
      // const {clusters=[], business=[], user={}} = hash
      // const businessIds = business.map(b => b.id)
      // const filter = clusters.filter(c => {
      //   if(user.username === 'admin') {
      //     return true
      //   }
      //   let labelBussinessId = c.huaweiCloudContainerEngineConfig && c.huaweiCloudContainerEngineConfig.labels
      //                            && c.huaweiCloudContainerEngineConfig.labels.business || ''
      //   labelBussinessId = labelBussinessId.replace('_', ':')
      //   if (businessIds.includes(labelBussinessId)) {
      //     return true
      //   } else {
      //     return false
      //   }
      // })
      // return {
      //   clusters: hash.,
      // }
    // })
  },

  actions: {
    toggleGrouping() {
      let choices = ['list','grouped'];
      let cur = this.get('controller.mode');
      let neu = choices[((choices.indexOf(cur)+1) % choices.length)];
      next(() => {
        this.set('controller.mode', neu);
      });
    },
  },

  shortcuts: {
    'g': 'toggleGrouping',
  }
});

import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import {
  inject as service
} from '@ember/service';
import {
  hash
} from 'rsvp';
import {
  get
} from '@ember/object';

export default Route.extend({
  globalStore: service(),
  k8sStore: service('k8sStore'),

  model() {
    const store = get(this, 'globalStore');
    var account = store.createRecord({
      type: 'user',
    });

    return hash({
      users:       store.findAll('user'),
      globalRoles: store.findAll('globalrole'),
    }).then((hash) => {
      return EmberObject.create({
        account,
        users:       hash.users,
        globalRoles: hash.globalRoles
      });
    });
    // return hash({
    //   users: store.findAll('user'),
    //   globalRoles: store.findAll('globalrole'),
    //   cceGlobalRoles: get(this, 'k8sStore').findAll('businessGlobalRole', {url: `${get(this, 'k8sStore').baseUrl}/v3/businessGlobalRole`, forceReload: true}),
    // }).then((hash) => {
    //   let globalRoles = hash.globalRoles
    //   hash.cceGlobalRoles.content.map(r => {
    //     const filter = globalRoles.content.filter(i => i.id === r.id)
    //     if (filter.length === 0) {
    //       globalRoles.pushObject(r)
    //     }
    //   })
    //   return EmberObject.create({
    //     account,
    //     users: hash.users,
    //     globalRoles,
    //   });
    // });
  },

  resetController: function (controller, isExisting /*, transition*/ ) {
    if (isExisting) {
      controller.set('errors', null);
    }
  }
});

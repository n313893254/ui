import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { on } from '@ember/object/evented';
import C from 'ui/utils/constants';
import { hash } from 'rsvp';

export default Route.extend({
  catalog: service(),
  store:   service(),

  setDefaultRoute: on('activate', function() {

    set(this, `session.${ C.SESSION.PROJECT_ROUTE }`, 'apps-tab');

  }),
  model() {

    var store = this.get('store');

    return hash({
      workloads: store.findAll('workload'),
      pods:      store.findAll('pod'),
      apps:      store.findAll('app'),
    });

  },

  afterModel(model/* , transition */) {

    return get(this, 'catalog').fetchAppTemplates(get(model, 'apps'));

  },

});

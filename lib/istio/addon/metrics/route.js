import Route from '@ember/routing/route';
import { set, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { on } from '@ember/object/evented';
import C from 'ui/utils/constants';
import { all as PromiseAll } from 'rsvp';

const APP_NAME = 'cluster-istio';

export default Route.extend({
  globalStore: service(),
  session:     service(),
  scope:       service(),

  model(params, transition) {
    const store = get(this, 'globalStore');
    const cluster = store.all('cluster').findBy('id', transition.params['authenticated.project'].project_id.split(':')[0]);
    const project = get(cluster, 'systemProject');

    if (!project) {
      return { owner: false, }
    } else {
      return { owner: true }
    }
  },

  setDefaultRoute: on('activate', function() {
    set(this, `session.${ C.SESSION.CLUSTER_ROUTE }`, 'authenticated.project.istio.metrics');
  }),
});


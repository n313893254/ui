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

  model() {
    const store = get(this, 'globalStore');
    const currentProject = get(window.l('route:application').modelFor('authenticated.project'), 'project');
    const cluster = get(this, 'globalStore').all('cluster').findBy('id', currentProject.clusterId)
    const project = get(cluster, 'systemProject');

    if (!project) {
      this.transitionTo('metrics')
      return { owner: false, }
    }

    const apps = store.rawRequest({
      url:    get(project, 'links.apps'),
      method: 'GET',
    });

    return PromiseAll([apps]).then((data) => {
      const apps = get(data[0], 'body.data') || [];

      return {
        app:   apps.findBy('name', APP_NAME),
        owner: true,
        cluster,
      }
    });
  },

  setDefaultRoute: on('activate', function() {
    set(this, `session.${ C.SESSION.CLUSTER_ROUTE }`, 'authenticated.project.istio.index');
  }),
});


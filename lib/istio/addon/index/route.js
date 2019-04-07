import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed'
import { get } from '@ember/object';

export default Route.extend({
  scope:       service(),
  session:     service(),
  store:   service(),

  pageScope:       reads('scope.currentPageScope'),
  model() {
    return hash({ workloads: get(this, 'store').findAll('workload'), }).then(({ workloads }) => {
      const filtered = workloads.filter((w) => w.labels && w.labels.app)
        .map((w) => {
          return {
            value:       w.labels.app,
            namespaceId: w.namespaceId,
          }
        })

      return { workloads: filtered, }
    })
  },
});

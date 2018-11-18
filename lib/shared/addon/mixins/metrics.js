import Mixin from '@ember/object/mixin';
import { get, set, setProperties } from '@ember/object';
import { inject as service } from '@ember/service';

export default Mixin.create({
  globalStore: service(),
  scope:       service(),
  growl:       service(),

  graphSelector: null,
  graphs:        null,
  state:         null,

  init() {
    this._super(...arguments);

    set(this, 'state', {
      loading:  false,
      detail:   false,
      hide:     false,
      noGraphs: false,
      from:     null,
      to:       null,
      interval: null,
    })
  },

  actions: {
    query(){
      const cluster = get(this, 'scope.currentCluster');
      const gs = get(this, 'globalStore');

      set(this, 'state.loading', true);

      const metricParams = {};

      if ( get(this, 'id') ) {
        set(metricParams, 'instanceName', get(this, 'id'));
      }

      gs.rawRequest({
        url:    `${ get(cluster, 'links.clustergraphs') }?action=query`.replace('/clusters/', '/cluster/'),
        method: 'POST',
        data:   {
          graphSelector: get(this, 'graphSelector'),
          metricParams,
          interval:      get(this, 'state.interval'),
          isDetails:     get(this, 'state.detail'),
          from:          get(this, 'state.from'),
          to:            get(this, 'state.to'),
        }
      }).then((xhr) => {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        const body = JSON.parse(xhr.body);
        const graphs = get(body, 'data') || [];

        setProperties(this, {
          'state.noGraphs': get(graphs, 'length') === 0,
          graphs
        });
      }).catch((err) => {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        setProperties(this, {
          'state.noGraphs': true,
          graphs:           []
        });
        get(this, 'growl').fromError(get(err, 'body.message') || get(err, 'message') || err);
      }).finally(() => {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        set(this, 'state.loading', false);
      });
    }
  }
});

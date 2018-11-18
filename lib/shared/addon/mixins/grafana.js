import Mixin from '@ember/object/mixin';
import { get, set, observer } from '@ember/object';
import { inject as service } from '@ember/service';

export default Mixin.create({
  globalStore: service(),
  scope:       service(),

  dashboards:  null,

  init() {
    this._super(...arguments);
    this.monitoringStatusDidChange();
  },

  monitoringStatusDidChange: observer('scope.currentCluster.isMonitoringReady', function() {
    const isReady = get(this, 'scope.currentCluster.isMonitoringReady');

    if ( isReady ) {
      const rootUrl = get(this, 'scope.currentCluster.monitoringStatus.grafanaEndpoint');

      get(this, 'globalStore').rawRequest({
        url:    `${ rootUrl }/api/search`,
        method: 'GET',
      }).then((xhr) => {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        const dashboards = xhr.body || [];

        set(this, 'dashboards', dashboards);
        this.updateLinks();
      });
    } else {
      set(this, 'dashboards', []);
      this.updateLinks();
    }
  }),

  updateLinks() {
    ( get(this, 'grafanaLinks') || [] ).forEach((link) => {
      const dashboards = get(this, 'dashboards') || [];
      const target = dashboards.findBy('title', get(link, 'title'));

      if ( target ) {
        set(this, `${ get(link, 'id') }Url`, get(target, 'url'));
      } else {
        set(this, `${ get(link, 'id') }Url`, null);
      }
    });
  }

});
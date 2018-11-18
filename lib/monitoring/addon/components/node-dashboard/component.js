import Component from '@ember/component';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Grafana from 'shared/mixins/grafana';
import layout from './template';

export default Component.extend(Grafana, {
  scope:  service(),
  layout,
  model:  null,

  monitoringEnabled: alias('scope.currentCluster.enableClusterMonitoring'),
});

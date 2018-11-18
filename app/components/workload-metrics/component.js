import Component from '@ember/component';
import Metrics from 'shared/mixins/metrics';
import Grafana from 'shared/mixins/grafana';
import layout from './template';

export default Component.extend(Grafana, Metrics, {
  layout,

  graphSelector: { component: 'workload' },
});
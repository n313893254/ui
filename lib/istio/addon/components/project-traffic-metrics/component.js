import Component from '@ember/component';
import Metrics from 'shared/mixins/metrics';
import layout from './template';

export default Component.extend(Metrics, {
  layout,

  filters: { resourceType: 'istioproject' },

  projectScope:  true,
  istio:        true,

  init() {
    this._super(...arguments)
    this.send('query')
  },
});

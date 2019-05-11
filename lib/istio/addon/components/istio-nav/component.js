import Component from '@ember/component';
import layout from './template';
import { get, computed } from '@ember/object';
import { alias } from '@ember/object/computed'
import { inject as service } from '@ember/service';

export default Component.extend({
  scope:  service(),

  layout,

  cluster: alias('scope.currentCluster'),

  kialiUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/istio-system/services/http:kiali-http:80/proxy/`
  }),

  jaegerUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/istio-system/services/http:tracing:80/proxy/jaeger/search`
  }),

  grafanaUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/istio-system/services/http:grafana:80/proxy/`
  }),

  prometheusUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/istio-system/services/http:prometheus-http:80/proxy/`
  }),
});

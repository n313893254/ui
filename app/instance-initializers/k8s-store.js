import StoreTweaks from 'ui/mixins/store-tweaks';

export function initialize(instance) {

  var application = instance.lookup('application:main');
  var k8sStore = instance.lookup('service:k8sStore');
  var cookies = instance.lookup('service:cookies');

  k8sStore.reopen(StoreTweaks);

  k8sStore.baseUrl = `/meta/proxy/http:/cattle-cce-service`
  // k8sStore.baseUrl = `/k8s/clusters/local/api/v1/namespaces/cattle-system/services/https:cattle-cce-service:443/proxy`
  k8sStore.cceUrl = `/k8s/clusters/local/api/v1/namespaces/cattle-system/services/https:cattle-cce-service:443/proxy/v3`

  let timeout = cookies.get('timeout');

  if ( timeout ) {

    k8sStore.defaultTimeout = timeout;

  }

}

export default {
  name:       'k8s-store',
  initialize
};

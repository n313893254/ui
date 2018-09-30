import StoreTweaks from 'ui/mixins/store-tweaks';
import ENV from 'ui/config/environment';

export function initialize(instance) {

  var k8sStore = instance.lookup('service:k8sStore');
  var cookies = instance.lookup('service:cookies');
  var application = instance.lookup('application:main');

  k8sStore.reopen(StoreTweaks);

  // if (ENV.environment === 'development') {
  //
  //   k8sStore.baseUrl = `/k8s/clusters/local/api/v1/namespaces/cattle-system/services/https:cattle-cce-service:443/proxy`
  //
  // } else {
  //
  //   k8sStore.baseUrl = `/meta/proxy/http:/cattle-cce-service`
  //
  // }

  k8sStore.baseUrl = application.apiEndpoint

  let timeout = cookies.get('timeout');

  if ( timeout ) {

    k8sStore.defaultTimeout = timeout;

  }

}

export default {
  name:       'k8s-store',
  initialize
};

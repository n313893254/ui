import StoreTweaks from 'ui/mixins/store-tweaks';

export function initialize(instance) {

  var k8sStore = instance.lookup('service:k8sStore');
  var cookies = instance.lookup('service:cookies');
  var application = instance.lookup('application:main');

  k8sStore.reopen(StoreTweaks);

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

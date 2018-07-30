import StoreTweaks from 'ui/mixins/store-tweaks';

export function initialize(instance) {

  var application = instance.lookup('application:main');
  var k8sStore = instance.lookup('service:k8sStore');
  var cookies = instance.lookup('service:cookies');

  k8sStore.reopen(StoreTweaks);

  k8sStore.baseUrl = `/meta/proxy/http:/cattle-cce-service`
  // k8sStore.headers.Authorization = 'Bearer token-9bjnc:kw7kk59ncxpzxsn7wbv7pxgxbq4kbmbkrnbptkwl6kqn8c6c2p592n'
  let timeout = cookies.get('timeout');

  if ( timeout ) {

    k8sStore.defaultTimeout = timeout;

  }

}

export default {
  name:       'k8s-store',
  initialize
};

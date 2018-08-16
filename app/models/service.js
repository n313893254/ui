import Resource from 'ember-api-store/models/resource';
import { reference } from 'ember-api-store/utils/denormalize';
import {
  computed, get, set
} from '@ember/object';
import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export const ARECORD = 'arecord';
export const CNAME = 'cname';
export const ALIAS = 'alias';
export const WORKLOAD = 'workload';
export const SELECTOR = 'selector';
export const CLUSTERIP = 'clusterIp';
export const UNKNOWN = 'unknown';

const FIELD_MAP = {
  [ARECORD]:   'ipAddresses',
  [CNAME]:     'hostname',
  [ALIAS]:     'targetDnsRecordIds',
  [WORKLOAD]:  'targetWorkloadIds',
  [SELECTOR]:  'selector',
  [CLUSTERIP]: 'clusterIp',
};

export default Resource.extend({
  namespace: reference('namespaceId', 'namespace', 'clusterStore'),

  displayType: computed('intl.locale', 'kind', function() {

    const intl = get(this, 'intl');

    if ( get(this, 'kind') === 'LoadBalancer' ) {

      return intl.t('model.service.displayKind.loadBalancer');

    } else {

      return intl.t('model.service.displayKind.generic');

    }

  }),

  displayTarget: computed('ports.[]', function() {

    let parts = [];
    const endpoints = (get(this, 'ports') || []).sort(Util.compareDisplayEndpoint);

    endpoints.forEach((endpoint) => {
      const {name, port, targetPort} = endpoint
      parts.push('<span>' + Util.escapeHtml(name === targetPort ? port : targetPort) + '</span>');
    });

    let pub = parts.join(', ');

    if (pub) {
      return pub.htmlSafe();
    }
    else {
      return '';
    }

  }),

  proxyEndpoints: computed('labels', function(){

    const parts = []
    const labels = get(this, 'labels');
    const location = window.location;

    if ( labels && labels['kubernetes.io/cluster-service'] === 'true' ) {

      (get(this, 'ports') || []).forEach((port) => {

        const linkEndpoint = `${ location.origin }/k8s/clusters/${ get(this, 'scope.currentCluster.id') }/api/v1/namespaces/${ get(this, 'namespaceId') }/services/${ get(port, 'targetPort') }:${ get(this, 'name') }:/proxy/`;

        parts.push({
          linkEndpoint,
          displayEndpoint: '/index.html',
          protocol:        location.protocol.substr(0, location.protocol.length - 1),
          isTcpish:        true,
        });

      });

    }

    return parts;

  }),
  intl:         service(),
  scope:        service(),
  clusterStore: service(),

  canEditYaml: true,

});

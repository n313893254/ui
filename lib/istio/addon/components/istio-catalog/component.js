import Component from '@ember/component';
import layout from './template';
import { get, computed, setProperties, set } from '@ember/object';
import { inject as service } from '@ember/service';
import CrudCatalog from 'shared/mixins/crud-catalog';
import { requiredError } from 'shared/utils/util';
import { convertToMillis } from 'shared/utils/util';
import { parseSi } from 'shared/utils/parse-unit'
import { ucFirst } from 'shared/utils/util';
import ReservationCheck from 'shared/mixins/reservation-check';
import { reads } from '@ember/object/computed'

const APP_VERSION = 'catalog://?catalog=system-library&template=rancher-istio&version=1.1.5';
const GATEWAY_TYPE = ['NodePort', 'LoadBalancer'];
const PERSISTENCE_KEYS = ['existingClaim', 'size', 'storageClass']

const GATEWAY_ENABLED = 'gateways.enabled'
const HTTP2_PORT = 'gateways.istio-ingressgateway.ports[0].nodePort'
const HTTPS_PORT = 'gateways.istio-ingressgateway.ports[1].nodePort'
const LB_IP = 'gateways.istio-ingressgateway.loadBalancerIP'
const LB_SOURCE_RANGES = 'gateways.istio-ingressgateway.loadBalancerSourceRanges'
const GRAFANA_PERISTENCE_ENABLED = 'grafana.persistence.enabled'

const PILOT_REQUEST_CPU = 'pilot.resources.requests.cpu'
const PILOT_REQUEST_MEM = 'pilot.resources.requests.memory'
const PILOT_LIMIT_CPU = 'pilot.resources.limits.cpu'
const PILOT_LIMIT_MEM = 'pilot.resources.limits.memory'

const PROMETHEUS_RETENTION = 'prometheus.retention'
const PROMETHEUS_REQUEST_MEM = 'prometheus.resources.requests.memory'
const PROMETHEUS_REQUEST_CPU = 'prometheus.resources.requests.cpu'
const PROMETHEUS_LIMIT_MEM = 'prometheus.resources.limits.memory'
const PROMETHEUS_LIMIT_CPU = 'prometheus.resources.limits.cpu'
const PROMETHEUS_NODE_SELECTOR_PREFIX = 'prometheus.nodeSelector."'

const MIXER_REQUEST_CPU = 'mixer.telemetry.resources.requests.cpu'
const MIXER_REQUEST_MEM = 'mixer.telemetry.resources.requests.memory'
const MIXER_LIMIT_CPU = 'mixer.telemetry.resources.limits.cpu'
const MIXER_LIMIT_MEM = 'mixer.telemetry.resources.limits.memory'
const MIXER_NODE_SELECTOR_PREFIX = 'mixer.nodeSelector."'


const ANSWER_TO_CONFIG = {
  'tracing.enabled':                    'tracingEnabled',
  'prometheus.enabled':                 'prometheusEnabled',
  'grafana.enabled':                    'grafanaEnabled',
  [PILOT_REQUEST_CPU]:                  'pilotRequestCpu',
  [PILOT_REQUEST_MEM]:                  'pilotRequestMemory',
  [PILOT_LIMIT_MEM]:                    'pilotLimitMemory',
  [PILOT_LIMIT_CPU]:                    'pilotLimitCPU',
  [GATEWAY_ENABLED]:                    'gatewayEnabled',
  'gateways.istio-ingressgateway.type': 'gatewayType',
  [LB_IP]:                              'loadBalancerIP',
  [GRAFANA_PERISTENCE_ENABLED]:         'grafanaPersistenceEnabled',
  [PROMETHEUS_RETENTION]:               'prometheusRetention',
  [PROMETHEUS_REQUEST_MEM]:             'prometheusRequestMemory',
  [PROMETHEUS_LIMIT_MEM]:               'prometheusLimitMemory',
  [PROMETHEUS_REQUEST_CPU]:             'prometheusRequestCPU',
  [PROMETHEUS_LIMIT_CPU]:               'prometheusLimitCPU',
  [MIXER_REQUEST_MEM]:                  'mixerRequestMemory',
  [MIXER_LIMIT_MEM]:                    'mixerLimitMemory',
  [MIXER_REQUEST_CPU]:                  'mixerRequestCPU',
  [MIXER_LIMIT_CPU]:                    'mixerLimitCPU',
  'pilot.traceSampling':                'traceSampling',
  'mixer.policy.enabled':               'mixerPolicyEnabled',
  'mtls.enabled':                       'mtlsEnabled',
}

const HIDDEN_KEYS = {
  'enableCRDs':                                  true,
  'mixer.enabled':                               true,
  'pilot.enabled':                               true,
  'security.enabled':                            true,
  'nodeagent.enabled':                           false,
  'istio_cni.enabled':                           false,
  'istiocoredns.enabled':                        false,
  'sidecarInjectorWebhook.enabled':              true,
  'kiali.enabled':                               true,
  'galley.enabled':                              true,
  'certmanager.enabled':                         false,
}

const NODE_PORT_KEYS = {
  'gateways.istio-ingressgateway.ports[0].name': 'http2',
  'gateways.istio-ingressgateway.ports[0].port': 80,
  'gateways.istio-ingressgateway.ports[1].name': 'https',
  'gateways.istio-ingressgateway.ports[1].port': 443,
}

export default Component.extend(CrudCatalog, ReservationCheck, {
  scope: service(),
  intl:  service(),

  layout,

  answers:    null,
  appName:    'cluster-istio',
  nsName:     'istio-system',
  appVersion: APP_VERSION,

  level:      reads('scope.currentPageScope'),

  init() {
    this._super(...arguments);

    let customAnswers = {};

    const config = {
      tracingEnabled:            true,
      kialiEnabled:              true,
      prometheusEnabled:         true,
      grafanaEnabled:            true,
      grafanaPersistenceEnabled: false,
      grafanaPersistenceSize:    '5Gi',
      autoInject:                true,
      mtlsEnabled:               false,
      pilotRequestCpu:           500,
      pilotRequestMemory:        2048,
      gatewayType:               'NodePort',
      gatewayEnabled:            false,
      http2Port:                 31380,
      httpsPort:                 31390,
      prometheusRetention:       6,
      prometheusLimitMemory:     1000,
      prometheusRequestMemory:   750,
      prometheusRequestCPU:      750,
      prometheusLimitCPU:        1000,
      mixerRequestCPU:           1000,
      mixerLimitCPU:             4800,
      mixerRequestMemory:        1024,
      mixerLimitMemory:          4048,
      traceSampling:             1,
      mixerPolicyEnabled:        false,
      pilotLimitCPU:             1000,
      pilotLimitMemory:          4096,
    }

    setProperties(this, {
      config,
      grafana:                   { persistence: { size: '5Gi', } },
      useGrafanaStorageClass:    true,
    })

    if ( get(this, 'enabled') ) {
      const answers = get(this, 'app.answers') || {};
      const answerKeys = Object.keys(ANSWER_TO_CONFIG) || []
      const grafanaPersistenceKeys = PERSISTENCE_KEYS.map((key) => `grafana.persistence.${ key }`)

      const nodeSelector = {};
      const mixerNodeSelector = {};
      const loadBalancerSourceRanges = [];

      Object.keys(answers).filter((key) => key.startsWith(PROMETHEUS_NODE_SELECTOR_PREFIX) ).map((k) => {
        let value = answers[k] || '';
        const key = k.replace('prometheus.nodeSelector.', '').slice(1, -1).replace(/\\\./g, '.')

        nodeSelector[key] = value
      })

      Object.keys(answers).filter((key) => key.startsWith(MIXER_NODE_SELECTOR_PREFIX) ).map((k) => {
        let value = answers[k] || '';
        const key = k.replace('mixer.nodeSelector.', '').slice(1, -1).replace(/\\\./g, '.')

        mixerNodeSelector[key] = value
      });

      Object.keys(answers).filter((key) => key.startsWith(`${ LB_SOURCE_RANGES }[`) ).map((k) => {
        loadBalancerSourceRanges.pushObject(answers[k])
      })

      const preRequestsCpu = ['pilot', 'prometheus', 'mixer.telemetry'].reduce((all, current) => {
        const value = answers[`${ current }.resources.requests.cpu`]

        return value ? all + convertToMillis(value) : all
      }, 0)

      const preRequestsMemory = ['pilot', 'prometheus', 'mixer.telemetry'].reduce((all, current) => {
        const value = answers[`${ current }.resources.requests.memory`]

        return value ? all + parseSi(value) : all
      }, 0)

      setProperties(this, {
        nodeSelector,
        mixerNodeSelector,
        loadBalancerSourceRanges,
        prometheusPreRequestCPU:    answers[PROMETHEUS_REQUEST_CPU],
        prometheusPreRequestMemory: answers[PROMETHEUS_REQUEST_MEM],
        mixerPreRequestCPU:         answers[MIXER_REQUEST_CPU],
        mixerRequestMemory:         answers[MIXER_REQUEST_MEM],
        'config.http2Port':         answers[HTTP2_PORT],
        'config.httpsPort':         answers[HTTPS_PORT],
        preRequestsCpu,
        preRequestsMemory,
        prePromtheusRequestCPU:     parseSi(answers[PROMETHEUS_REQUEST_CPU]),
      })

      Object.keys(answers).forEach((key = '') => {
        if (key.startsWith(PROMETHEUS_NODE_SELECTOR_PREFIX) || key.startsWith(MIXER_NODE_SELECTOR_PREFIX) || key.startsWith(`${ LB_SOURCE_RANGES }[`)) {
          return
        }

        if (Object.keys(HIDDEN_KEYS).includes(key)) {
          return
        }

        if (Object.keys(NODE_PORT_KEYS).includes(key) || key === HTTP2_PORT || key === HTTPS_PORT) {
          return
        }

        if (grafanaPersistenceKeys.includes(key)) {
          return set(this, key, answers[key])
        }

        if (answerKeys.includes(key)) {
          let value

          switch (key) {
          case PILOT_REQUEST_CPU:
          case PROMETHEUS_LIMIT_CPU:
          case PROMETHEUS_REQUEST_CPU:
          case MIXER_REQUEST_CPU:
          case MIXER_LIMIT_CPU:
          case PILOT_LIMIT_CPU:
            value = convertToMillis(answers[key])
            break;
          case PILOT_REQUEST_MEM:
          case PILOT_LIMIT_MEM:
          case PROMETHEUS_REQUEST_MEM:
          case PROMETHEUS_LIMIT_MEM:
          case MIXER_REQUEST_MEM:
          case MIXER_LIMIT_MEM:
            value = parseSi(answers[key], 1024) / 1048576
            break;
          case PROMETHEUS_RETENTION:
            value = parseInt(answers[key])
            break;
          default:
            value = answers[key]
          }

          return set(this, `config.${ ANSWER_TO_CONFIG[key] }`, value)
        }

        customAnswers[key] = answers[key];
      });
    }

    setProperties(this, { customAnswers, })
  },

  actions: {
    save(cb) {
      set(this, 'errors', [])
      const errors = this.validate() || []

      if (errors.length > 0) {
        set(this, 'errors', errors)
        cb()

        return
      }

      let answers = { ...HIDDEN_KEYS };

      const answerKeys = Object.keys(ANSWER_TO_CONFIG) || []

      answerKeys.map((key) => {
        const value = get(this, `config.${ ANSWER_TO_CONFIG[key] }`)

        switch (key) {
        case PILOT_REQUEST_CPU:
        case PILOT_LIMIT_CPU:
        case PROMETHEUS_LIMIT_CPU:
        case PROMETHEUS_REQUEST_CPU:
        case MIXER_REQUEST_CPU:
        case MIXER_LIMIT_CPU:
          answers[key] = `${ value }m`
          break;
        case PILOT_REQUEST_MEM:
        case PILOT_LIMIT_MEM:
        case PROMETHEUS_REQUEST_MEM:
        case PROMETHEUS_LIMIT_MEM:
        case MIXER_REQUEST_MEM:
        case MIXER_LIMIT_MEM:
          answers[key] = `${ value }Mi`
          break;
        case PROMETHEUS_RETENTION:
          answers[key] = `${ value }h`
          break;
        default:
          answers[key] = value
        }
      })

      if (get(this, 'config.grafanaEnabled') && get(this, 'config.grafanaPersistenceEnabled')) {
        this.willSavePersistence(answers, 'grafana')
      }

      ['prometheus', 'mixer'].map((component) => {
        (get(this, `${ component }NodeSelectors`) || []).map((selector) => {
          let { key, value } = selector

          if (key.includes('.')) {
            key = key.replace(/\./g, '\\.')
          }
          answers[`${ component }.nodeSelector."${ key }"`] = value
        });
      })

      if (get(this, 'config.gatewayEnabled') && get(this, 'config.gatewayType') === 'LoadBalancer') {
        (get(this, 'loadBalancerSourceRanges') || []).map((value, idx) => {
          answers[`${ LB_SOURCE_RANGES }[${ idx }]`] = value
        });
      }

      if (get(this, 'config.gatewayEnabled') && get(this, 'config.gatewayType') === 'NodePort') {
        Object.keys(NODE_PORT_KEYS).map((key) => {
          answers[key] = NODE_PORT_KEYS[key]
        })
        answers[HTTP2_PORT] = get(this, 'config.http2Port')
        answers[HTTPS_PORT] = get(this, 'config.httpsPort')
      }

      this.save(cb, answers);
    },
  },

  gatewayTypeContent: computed(() => {
    return GATEWAY_TYPE.map((value) => ({
      label: value,
      value
    }))
  }),

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

  prometheusSchedulableNodes: computed('prometheusNodeSelectors.[]', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];
    const out = allNodes.filterBy('isUnschedulable', false)
      .filter((node) => (get(this, 'prometheusNodeSelectors') || [])
        .every((selector) => {
          const labelValue = (get(node, 'labels') || {})[get(selector, 'key')];

          if ( get(selector, 'value') === '' ) {
            return labelValue !== undefined;
          } else {
            return get(selector, 'value') === labelValue;
          }
        }));

    return out;
  }),

  insufficientPrometheusCPU: computed('prometheusSchedulableNodes.@each.{allocatable,requested}', 'config.prometheusRequestCPU', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];

    if ( get(allNodes, 'length') === 0 ) {
      return false;
    }

    let maxLeftCpu = 0;

    get(this, 'prometheusSchedulableNodes').forEach((node) => {
      const left =  convertToMillis(get(node, 'allocatable.cpu')) - convertToMillis(get(node, 'requested.cpu'));

      if ( left > maxLeftCpu) {
        maxLeftCpu = left;
      }
    });

    return get(this, 'enabled') ? maxLeftCpu <= get(this, 'config.prometheusRequestCPU') - get(this, 'prePromtheusRequestCPU') : maxLeftCpu <= get(this, 'config.prometheusRequestCPU');
  }),

  insufficientPrometheusMemory: computed('prometheusSchedulableNodes.@each.{allocatable,requested}', 'config.prometheusRequestMemory', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];

    if ( get(allNodes, 'length') === 0 ) {
      return false;
    }

    let maxLeftMemory = 0;

    get(this, 'prometheusSchedulableNodes').forEach((node) => {
      const left =  (parseSi(get(node, 'allocatable.memory'), 1024) / 1048576) - (parseSi(get(node, 'requested.memory'), 1024) / 1048576);

      if ( left > maxLeftMemory) {
        maxLeftMemory = left;
      }
    });

    return !get(this, 'enabled') && maxLeftMemory <= get(this, 'config.prometheusRequestMemory');
  }),

  mixerSchedulableNodes: computed('mixerNodeSelectors.[]', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];
    const out = allNodes.filterBy('isUnschedulable', false)
      .filter((node) => (get(this, 'mixerNodeSelectors') || [])
        .every((selector) => {
          const labelValue = (get(node, 'labels') || {})[get(selector, 'key')];

          if ( get(selector, 'value') === '' ) {
            return labelValue !== undefined;
          } else {
            return get(selector, 'value') === labelValue;
          }
        }));

    return out;
  }),

  insufficientMixerCPU: computed('mixerSchedulableNodes.@each.{allocatable,requested}', 'config.mixerRequestCPU', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];

    if ( get(allNodes, 'length') === 0 ) {
      return false;
    }

    let maxLeftCpu = 0;

    get(this, 'mixerSchedulableNodes').forEach((node) => {
      const left =  convertToMillis(get(node, 'allocatable.cpu')) - convertToMillis(get(node, 'requested.cpu'));

      if ( left > maxLeftCpu) {
        maxLeftCpu = left;
      }
    });

    return !get(this, 'enabled') && maxLeftCpu <= get(this, 'config.mixerRequestCPU');
  }),

  insufficientMixerMemory: computed('mixerSchedulableNodes.@each.{allocatable,requested}', 'config.mixerRequestMemory', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];

    if ( get(allNodes, 'length') === 0 ) {
      return false;
    }

    let maxLeftMemory = 0;

    get(this, 'prometheusSchedulableNodes').forEach((node) => {
      const left =  (parseSi(get(node, 'allocatable.memory'), 1024) / 1048576) - (parseSi(get(node, 'requested.memory'), 1024) / 1048576);

      if ( left > maxLeftMemory) {
        maxLeftMemory = left;
      }
    });

    return !get(this, 'enabled') && maxLeftMemory <= get(this, 'config.mixerRequestMemory');
  }),

  pilotSchedulableNodes: computed('pilotNodeSelectors.[]', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];
    const out = allNodes.filterBy('isUnschedulable', false)
      .filter((node) => (get(this, 'pilotNodeSelectors') || [])
        .every((selector) => {
          const labelValue = (get(node, 'labels') || {})[get(selector, 'key')];

          if ( get(selector, 'value') === '' ) {
            return labelValue !== undefined;
          } else {
            return get(selector, 'value') === labelValue;
          }
        }));

    return out;
  }),

  insufficientPilotCPU: computed('pilotSchedulableNodes.@each.{allocatable,requested}', 'config.mixerRequestCPU', 'scope.currentCluster.nodes.@each.{allocatable,requested}', function() {
    const allNodes = get(this, 'scope.currentCluster.nodes') || [];

    if ( get(allNodes, 'length') === 0 ) {
      return false;
    }

    let maxLeftCpu = 0;

    get(this, 'pilotSchedulableNodes').forEach((node) => {
      const left =  convertToMillis(get(node, 'allocatable.cpu')) - convertToMillis(get(node, 'requested.cpu'));

      if ( left > maxLeftCpu) {
        maxLeftCpu = left;
      }
    });

    return !get(this, 'enabled') && maxLeftCpu <= get(this, 'config.pilotRequestCpu');
  }),

  saveDisabled: computed('prometheusWarning', 'mixerWarning', 'enabled', 'istioWarning', function() {
    const {
      prometheusWarning, mixerWarning, istioWarning
    } = this

    return prometheusWarning || mixerWarning || istioWarning;
  }),

  prometheusWarning: computed('insufficientPrometheusMemory', 'insufficientPrometheusCPU', 'prometheusNodeSelectors.[]', function() {
    const {
      insufficientPrometheusMemory, insufficientPrometheusCPU, prometheusNodeSelectors = [], intl
    } = this

    const cpu = get(this, 'config.prometheusRequestCPU')
    const memory = get(this, 'config.prometheusRequestMemory')
    let prefix = 'clusterIstioPage.insufficientSize.selectors'
    const component = 'Prometheus'

    if (prometheusNodeSelectors.length === 0) {
      prefix = 'clusterIstioPage.insufficientSize.workload'
    }

    if (insufficientPrometheusCPU && insufficientPrometheusMemory) {
      return intl.t(`${ prefix }.all`, {
        cpu,
        memory,
        component
      })
    } else if (insufficientPrometheusCPU) {
      return intl.t(`${ prefix }.cpu`, {
        cpu,
        component
      })
    } else if (insufficientPrometheusMemory) {
      return intl.t(`${ prefix }.memory`, {
        memory,
        component
      })
    }
  }),

  mixerWarning: computed('insufficientMixerCPU', 'insufficientMixerMemory', 'mixerNodeSelectors.[]', function() {
    const {
      insufficientMixerCPU, insufficientMixerMemory, mixerNodeSelectors = [], intl
    } = this

    const cpu = get(this, 'config.mixerRequestCPU')
    const memory = get(this, 'config.mixerRequestMemory')
    let prefix = 'clusterIstioPage.insufficientSize.selectors'
    const component = 'Mixer'

    if (mixerNodeSelectors.length === 0) {
      prefix = 'clusterIstioPage.insufficientSize.workload'
    }

    if (insufficientMixerCPU && insufficientMixerMemory) {
      return intl.t(`${ prefix }.all`, {
        cpu,
        memory,
        component
      })
    } else if (insufficientMixerCPU) {
      return intl.t(`${ prefix }.cpu`, {
        cpu,
        component
      })
    } else if (insufficientMixerMemory) {
      return intl.t(`${ prefix }.memory`, {
        memory,
        component
      })
    }
  }),

  pilotWarning: computed('insufficientPilotCPU', 'insufficientPiolotMemory', function() {
    const {
      insufficientPilotCPU, insufficientPiolotMemory, intl
    } = this

    const cpu = get(this, 'config.insufficientPilotCPU')
    const memory = get(this, 'config.insufficientPiolotMemory')
    let prefix = 'clusterIstioPage.insufficientSize.workload'
    const component = 'Pilot'

    if (insufficientPilotCPU && insufficientPiolotMemory) {
      return intl.t(`${ prefix }.all`, {
        cpu,
        memory,
        component
      })
    } else if (insufficientPilotCPU) {
      return intl.t(`${ prefix }.cpu`, {
        cpu,
        component
      })
    } else if (insufficientPiolotMemory) {
      return intl.t(`${ prefix }.memory`, {
        memory,
        component
      })
    }
  }),

  istioWarning: computed('insufficientCpu', 'insufficientMemory', function() {
    let {
      insufficientCpu, insufficientMemory, intl, minCpu, minMemory, enabled
    } = this
    const prefix = 'clusterIstioPage.insufficientSize.total'
    const action = enabled ? 'update' : 'enable'

    console.log(minCpu, 'minCpu')
    if (insufficientCpu && insufficientMemory) {
      return intl.t(`${ prefix }.all`, {
        minCpu,
        minMemory,
        action,
      })
    } else if (insufficientCpu) {
      return intl.t(`${ prefix }.cpu`, {
        minCpu,
        action,
      })
    } else if (insufficientMemory) {
      return intl.t(`${ prefix }.memory`, {
        minMemory,
        action,
      })
    }
  }),

  minCpu: computed('requestsCpu', 'clusterLevelMinCpu', 'projectLevelMinCpu', 'enabled', 'preRequestsCpu', function() {
    let cpu = parseInt(get(this, 'requestsCpu'), 10);
    let preRequestsCpu = parseInt(get(this, 'preRequestsCpu'), 10);

    if ( isNaN(cpu) ) {
      cpu = 0;
    }

    if ( isNaN(preRequestsCpu) ) {
      preRequestsCpu = 0
    }

    const minCpu = (get(this, 'level') === 'cluster' ? get(this, 'clusterLevelMinCpu') : get(this, 'projectLevelMinCpu'))

    console.log(cpu, 'cpu')
    console.log(preRequestsCpu, 'preRequestsCpu')

    return get(this, 'enabled') ? cpu - preRequestsCpu : minCpu + cpu
  }),

  minMemory: computed('requestsMemory', 'clusterLevelMinMemory', 'projectLevelMinMemory', 'enabled', 'preRequestsMemory', function() {
    let memory = parseInt(get(this, 'requestsMemory'), 10);
    let preRequestsMemory = parseInt(get(this, 'preRequestsMemory'), 10);

    if ( isNaN(memory) ) {
      memory = 0;
    }

    if ( isNaN(preRequestsMemory) ) {
      preRequestsMemory = 0
    }

    const minMemory = (get(this, 'level') === 'cluster' ? get(this, 'clusterLevelMinMemory') : get(this, 'projectLevelMinMemory'))

    return get(this, 'enabled') ? memory - preRequestsMemory : minMemory + memory
  }),

  enabled: computed('app.state', function() {
    return !!get(this, 'app') && get(this, 'app.state') !== 'removing'
  }),

  nsNeedMove: computed('namespace.projectId', 'project.id', function() {
    const { namespace = {}, project = {} } = this

    return namespace.projectId !== project.id
  }),

  requestsCpu: computed('config.mixerRequestCPU', 'config.prometheusRequestCPU', 'config.pilotRequestCpu', function() {
    return ['mixerRequestCPU', 'prometheusRequestCPU', 'pilotRequestCpu'].reduce((all, key) => {
      return all + parseInt(get(this, `config.${ key }`))
    }, 0)
  }),

  requestsMemory: computed('config.mixerRequestMemory', 'config.prometheusRequestMemory', 'config.pilotRequestMemory', function() {
    return ['mixerRequestMemory', 'prometheusRequestMemory', 'pilotRequestMemory'].reduce((all, key) => {
      return all + parseInt(get(this, `config.${ key }`))
    }, 0)
  }),

  clusterLevelMinCpu: computed(() => {
    const arr = ['grafana', 'citadel', 'galley', 'sidecar-injector', 'tracing', 'kiali']

    return arr.length * 50
  }),

  willSavePersistence(answers, component) {
    PERSISTENCE_KEYS.map((k) => {
      const key = `${ component }.persistence.${ k }`
      const useStorageClass = get(this, `use${ ucFirst(component) }StorageClass`)

      if (['storageClass', 'size'].includes(k) && useStorageClass) {
        answers[key] = get(this, key)
      }
      if (k === 'existingClaim' && !useStorageClass) {
        answers[key] = get(this, key)
      }
    })
  },

  validate() {
    const errors = []

    if (get(this, 'config.grafanaEnabled') && get(this, 'config.grafanaPersistenceEnabled')) {
      errors.pushObjects(this.validatePV('grafana'))
    }

    return errors
  },

  validatePV(component) {
    const { intl, storageClasses = [] } = this
    const errors = []

    const defaultStorageClasses = storageClasses.filter((s) => s.annotations && (s.annotations['storageclass.kubernetes.io/is-default-class'] === 'true' || s.annotations['storageclass.beta.kubernetes.io/is-default-class'] === 'true'))

    if (get(this, `use${ ucFirst(component) }StorageClass`)) {
      if (defaultStorageClasses.length === 0 && !get(this, `${ component }.persistence.storageClass`)) {
        const emptyError = intl.t('globalRegistryPage.config.storageClass.emptyError')

        errors.pushObject(emptyError)
      }
    } else if (!get(this, `${ component }.persistence.existingClaim`)){
      errors.pushObject(requiredError(`globalRegistryPage.config.${ component }.existingClaim.label`))
    }

    return errors
  },
});

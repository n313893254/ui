import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';
import { alias } from '@ember/object/computed';
import {
  computed, get, set, observer, setProperties
} from '@ember/object';
import { on } from '@ember/object/evented';

const DURATION = [60, 300, 600, 1800, 3600, 10800, 21600]
const TIME_OUT = 30 * 1000

export default Component.extend({
  scope:       service(),
  globalStore:     service(),
  growl:       service(),

  layout,
  versionedApp: null,

  namespaces:         alias('scope.currentProject.namespaces'),

  // elements: KiAli.MOCK_DATA.elements,

  init() {
    this._super(...arguments);
    const { namespaces = [] } = this

    if (namespaces.length > 0) {
      set(this, 'namespace', get(namespaces, 'firstObject.id'))
    }
    setProperties(this, { duration: 60, })
    this.getGraph()
    set(this, 'timer', setInterval(() => {
      this.getGraph()
      set(this, 'forceFit', false)
    }, TIME_OUT))

    this.getMetrics()
  },

  willDestroyElement() {
    clearInterval(get(this, 'timer'))
  },
  actions: {
    refresh() {
      this.getGraph()
    },
  },

  appChange: observer('versionedApp', 'duration', 'namespace', function() {
    set(this, 'forceFit', true)
    this.getGraph()
  }),

  namespaceObserver: on('init', observer('namespace', function() {
    const { workloads = [] } = this
    const filtered = workloads.filter((f) => f.namespaceId === get(this, 'namespace'))
    const out = filtered.map((f) => f.value).uniq().map((f) => {
      return {
        label: f,
        value: f,
      }
    })

    setProperties(this, {
      versionedAppContent: out,
      versionedApp:        null,
    })
  })),

  durationContent: computed(() => {
    return DURATION.map((d) => ({
      label: `istio.trafficMonitoring.duration.${ d }`,
      value: d
    }))
  }),

  getGraph() {
    console.log(get(this, 'versionedApp'), 'versionedApp')
    let url = `/k8s/clusters/${ get(this, 'scope.currentCluster.id') }/api/v1/namespaces/istio-system/services/http:kiali:20001/proxy/api/namespaces`
    const queryParams = `/graph?duration=${ get(this, 'duration') }s&graphType=versionedApp&injectServiceNodes=true&groupBy=app&appenders=deadNode,sidecarsCheck,serviceEntry,istio`

    if (get(this, 'versionedApp')) {
      url += `/${ get(this, 'namespace') }/applications/${ get(this, 'versionedApp') }${  queryParams }`
    } else {
      url += `${ queryParams  }&namespaces=${ get(this, 'namespace') }`
    }
    get(this, 'globalStore').rawRequest({
      url,
      method:  'GET',
      headers: { 'X-Auth-Type-Kiali-UI': '1' },
    }).then((res) => {
      const { body = {} } = res

      set(this, 'elements', body.elements)
      console.log(body.elements, 'elements')
    }).catch((err) => {
      get(this, 'growl').fromError(get(err, 'body'))
      clearInterval(get(this, 'timer'))
    })
  },

  getMetrics() {
    get(this, 'globalStore').rawRequest({
      url:    `istiomonitorgraphs?action=query`,
      method: 'POST',
      data:   {
        from:      'now-60s',
        interval:  '5s',
        to:        'now',
        isDetails: false,
        filters:   {
          clusterId:    get(this, 'scope.currentCluster.id'),
          resourceType: 'mesh',
        },
      }
    }).then((res) => {
      console.log(res, 'res')
      if (res.body) {
        const body = JSON.parse(res.body)
        const { series = [] } = body

        setProperties(this, {
          chartOption: { series },
          graphStatus: 'success',
        })
      } else {
        set(this, 'graphStatus', 'noData')
      }
    }).catch(() => {
      set(this, 'graphStatus', 'error')
    })
      .finally(() => {
        set(this, 'graphLoading', false)
      })
  },

});

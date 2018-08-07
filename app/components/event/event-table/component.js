import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import { set, get, computed, setProperties, observer } from '@ember/object';
import parseUri from 'shared/utils/parse-uri';

export default Component.extend({
  layout,
  scope: service(),
  k8sStore: service(),

  loading: false,
  hostChoices:      [],
  expandedLogs:     [],
  eventLogContent: [
    {
      label: 'Pod',
      value: 'Pod'
    },
    {
      label: 'Node',
      value: 'Node'
    },
  ],
  eventLevelContent: [
    {
      label: 'Any log level',
      value: 'any'
    },
    {
      label: 'Normal',
      value: 'Normal'
    },
    {
      label: 'Warning',
      value: 'Warning'
    }
  ],
  eventTimeContent: [
    {
      label: 'Last hour',
      value: 'lastHour'
    }
  ],
  // rows: alias('model.clusterEventLogs'),
  rows: computed('eventType', 'resourceKind', 'eventLevel', 'eventTime', 'namespaceId', 'resourceName', 'model.clusterEventLogs.[]', function() {
    const clusterEventLogs = get(this, 'model.clusterEventLogs').content || []
    const eventType = get(this, 'eventType')
    const resourceKind = get(this, 'resourceKind')
    const eventTime = get(this, 'eventTime')
    const namespaceId = get(this, 'namespaceId')
    const resourceName = get(this, 'resourceName')
    let arr = clusterEventLogs
    if (eventType !== 'any') {
      arr = arr.filter(a => a.eventType === eventType)
    }
    if (resourceKind !== 'all') {
      arr = arr.filter(a => a.resourceKind === resourceKind)
    }
    if (resourceKind === 'Pod' && namespaceId !== 'poi-all') {
      arr = arr.filter(a => a.namespaceId === namespaceId)
    }
    if (resourceName !== 'poi-all') {
      arr = arr.filter(a => a.resourceName === resourceName)
    }
    return arr
  }),

  namespaceContent: computed('model.namespaces.[]', function() {
    const namespaces = get(this, 'model.namespaces').content || []
    let arr = namespaces.map(n => ({label: n.id, value: n.id}))
    return [{label: 'All namespace', value: 'poi-all'}, ...arr]
  }),

  resourceNameContent: computed('model.projects.@each.pods.[]', function() {
    const namespaces = get(this, 'model.namespaces').content || []
    const namespaceId = get(this, 'namespaceId')
    const resourceKind = get(this, 'resourceKind')
    const projects = get(this, 'model.projects').content || []
    const clusterId = get(this, 'scope.currentCluster.id')
    let allPods = []
    projects.filter(p => p.clusterId === clusterId)
            .map(p => {
              const pods = p && p.pods && p.pods.content || []
              allPods = [...allPods, ...pods]
            })
    let podContent = allPods.map(p => ({label: p.name, value: p.name}))
    const allNodes = get(this, 'model.nodes').content || []
    return [{label: 'All resource', value: 'poi-all'}, ...podContent]

  }),

  resourceNameChange: observer('resourceName', function() {
    console.log('poi')
    const namespaces = get(this, 'model.namespaces').content || []
    const namespaceId = get(this, 'namespaceId')
    const resourceKind = get(this, 'resourceKind')
    const projects = get(this, 'model.projects').content || []
    const clusterId = get(this, 'scope.currentCluster.id')
    const k8sStore = get(this, 'k8sStore')
    let url = `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogs?action=queryName&refKind=${resourceKind}&clusterEventId=${clusterId}`
    k8sStore.rawRequest({
        url,
        method: 'GET',
    }).then((res => console.log(res)))
  }),

  headers: [
    {
      name:        'expand',
      sort:        false,
      searchField: null,
      width:       30
    },
    {
      name:           'created',
      translationKey: 'generic.time',
      width:          230
    },
    {
      name:           'source',
      translationKey: 'generic.namespace',
      sort:        false,
      width:          150
    },
    {
      name:           'kind',
      translationKey: 'generic.kind',
      sort:        false,
      width:          80
    },
    {
      name:           'source',
      translationKey: 'generic.level',
      sort:        false,
      width:          80
    },
    {
      name:           'source',
      translationKey: 'generic.reason',
      sort:        false,
      width:          200
    },
    {
      name:           'source',
      translationKey: 'generic.message',
      sort:        false,
    },
  ],

  init() {

    this._super(...arguments)
    setProperties(this, {
      'resourceKind': 'Pod',
      'eventType': 'any',
      'eventTime': 'lastHour',
      'namespaceId': 'poi-all',
      'resourceName': 'poi-all',
    })
    const projects = get(this, 'model.projects').content || []
    projects.map(p => p.importLink('pods').catch((err) => console.log(err)))
  },
  actions: {
    toggleExpand(instId) {

      let list = get(this, 'expandedLogs')

      if ( list.includes(instId) ) {

        list.removeObject(instId);

      } else {

        list.addObject(instId);

      }

    },
    add() {
      console.log('add')
    },
    search() {
      const eventType = get(this, 'eventType')
      const resourceKind = get(this, 'resourceKind')
      const eventTime = get(this, 'eventTime')
      const namespaceId = get(this, 'namespaceId')
      const clusterId = get(this, 'scope.currentCluster.id')
      const k8sStore = this.get('k8sStore')

      let filter = {
        clusterEventId: clusterId,
      }
      if (eventType !== 'any' && eventType) {
        filter.logType = eventType
      }
      if (resourceKind !== 'all' && resourceKind) {
        filter.refKind = resourceKind
      }
      if (namespaceId !== 'poi-all' && namespaceId) {
        filter.namespaceId = namespaceId
      }
      k8sStore.find('huaWeiClusterEventLog', null, {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
        forceReload: true,
        filter,
      }).then(res => set(this, 'model.clusterEventLogs', res))
    },

    configreSubscriber() {
      get(this, 'router').transitionTo('authenticated.cluster.subscriber.new')
    },

    loadMore() {
      if (get(this, 'loading')) {
        return
      }
      const k8sStore = this.get('k8sStore')
      const clusterEventLogs = get(this, 'model.clusterEventLogs')
      const next = clusterEventLogs.pagination && clusterEventLogs.pagination.next
      if (next) {
        const urlParser = parseUri(next) || {}
        const query = urlParser.query
        let url = `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`
        if (query) {
          url += `?${query}`
        }
        // get(this, 'store').rawRequest({
        //   url:    get(model, 'links.revision'),
        //   method: 'GET',
        // })
        set(this, 'loading', true)
        k8sStore.rawRequest({
          url,
          method: 'GET',
        }).then(res => {
          clusterEventLogs.pushObjects(res.body.data)
          if((res.body.pagination && res.body.pagination.next) !== next) {
            set(clusterEventLogs, 'pagination.next', res.body.pagination.next)
          }
        }).finally(() => set(this, 'loading', false))
      }
    },
  },
});

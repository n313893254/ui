import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import { set, get, computed, setProperties, observer } from '@ember/object';
import parseUri from 'shared/utils/parse-uri';
import { task, timeout } from 'ember-concurrency';
import C from 'ui/utils/constants'

export default Component.extend({
  layout,
  scope: service(),
  k8sStore: service(),
  clusterId: alias('scope.currentCluster.id'),
  loading: false,
  searching: false,
  hostChoices:      [],
  expandedLogs:     [],
  dateStrOption: {format: 'YYYY-MM-DD'},
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
      label: 'All Time',
      value: 'all'
    },
    {
      label: 'Last hour',
      value: moment().subtract(1, 'hours').format(C.MOMENT_FORMAT)
    },
    {
      label: 'Last 6 hours',
      value: moment().subtract(6, 'hours').format(C.MOMENT_FORMAT)
    },
    {
      label: 'Last 24 hours',
      value: moment().subtract(24, 'hours').format(C.MOMENT_FORMAT)
    },
    {
      label: 'Custom',
      value: 'custom',
    },

  ],
  rows: alias('model.clusterEventLogs'),
  // rows: computed('eventType', 'resourceKind', 'eventLevel', 'eventTime', 'namespaceId', 'resourceName', 'model.clusterEventLogs.[]', function() {
  //   const clusterEventLogs = get(this, 'model.clusterEventLogs').content || []
  //   const eventType = get(this, 'eventType')
  //   const resourceKind = get(this, 'resourceKind')
  //   const eventTime = get(this, 'eventTime')
  //   const namespaceId = get(this, 'namespaceId')
  //   const resourceName = get(this, 'resourceName')
  //   let arr = clusterEventLogs
  //   if (eventType !== 'any') {
  //     arr = arr.filter(a => a.eventType === eventType)
  //   }
  //   if (resourceKind !== 'all') {
  //     arr = arr.filter(a => a.resourceKind === resourceKind)
  //   }
  //   if (resourceKind === 'Pod' && namespaceId !== 'poi-all') {
  //     arr = arr.filter(a => a.namespaceId === namespaceId)
  //   }
  //   if (!!resourceName && resourceName !== 'poi-all') {
  //     arr = arr.filter(a => a.resourceName === resourceName)
  //   }
  //   console.log(eventTime)
  //   if (eventTime !== 'all') {
  //     arr = arr.filter(a => a.createdTS > eventTime)
  //   }
  //   return arr
  // }),

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

  poi: observer('resourceKind', function() {
    this.searchTes
  }),

  // resourceNameChange: observer('resourceName', function() {
  //   console.log(get(this, 'resourceName'))
  //   const namespaces = get(this, 'model.namespaces').content || []
  //   const namespaceId = get(this, 'namespaceId')
  //   const resourceKind = get(this, 'resourceKind')
  //   const projects = get(this, 'model.projects').content || []
  //   const clusterId = get(this, 'scope.currentCluster.id')
  //   const k8sStore = get(this, 'k8sStore')
  //   // let url = `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogs?action=queryName&refKind=${resourceKind}&clusterEventId=${clusterId}`
  //   // k8sStore.rawRequest({
  //   //     url,
  //   //     method: 'GET',
  //   // }).then((res => console.log(res)))
  // }),

  searchTest: task(function * (term) {
    yield timeout(DEBOUNCE_MS);
    return xhr;
  }).restartable(),

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
      'eventTime': 'all',
      'namespaceId': 'poi-all',
      'startDate': moment([]).format(C.MOMENT_FORMAT),
      'endDate': moment([]).format(C.MOMENT_FORMAT),
    })
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

    add(value) {
      const addInput = get(this, 'addInput') || {}
      if (addInput.value) {
        set(this, 'resourceName', addInput.value)
      } else {
        set(this, 'resourceName', value)
      }
    },

    search() {
      if (get(this, 'searching')) {
        return
      }
      const eventType = get(this, 'eventType')
      const resourceKind = get(this, 'resourceKind')
      const eventTime = get(this, 'eventTime')
      const namespaceId = get(this, 'namespaceId')
      const clusterId = get(this, 'scope.currentCluster.id')
      const k8sStore = this.get('k8sStore')
      const resourceName = get(this, 'resourceName')
      const startDate = get(this, 'startDate')
      const endDate = get(this, 'endDate')

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
      if (resourceName !== 'poi-all' && resourceName) {
        filter.refName = resourceName
      }
      if (eventTime !== 'all' && eventTime !== 'custom') {
        filter.logCreatedRangeStart = `${eventTime}Z`
      }
      if (eventTime === 'custom') {
        filter.logCreatedRangeStart = `${moment(startDate).format(C.MOMENT_FORMAT)}Z`
        filter.logCreatedRangeEnd = `${moment(endDate).format(C.MOMENT_FORMAT)}Z`
      }
      set(this, 'searching', true)
      k8sStore.find('huaWeiClusterEventLog', null, {
        url:         `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog`,
        forceReload: true,
        depaginate: false,
        filter,
      }).then(res => {
        set(this, 'searching', false)
        set(this, 'model.clusterEventLogs', res)
      })
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
        }).catch(err => console.log(err)).finally(() => set(this, 'loading', false))
      }
    },
  },
});

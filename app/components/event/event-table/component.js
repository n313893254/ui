import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import { set, get, computed, setProperties } from '@ember/object';

export default Component.extend({
  layout,
  scope: service(),
  k8sStore: service(),
  allWorkloads: service(),

  hostChoices:      [],
  expandedLogs:     [],
  eventTypeContent: [
    {
      label: 'Cloud HTTP Load Balancer',
      value: 'loadBalancer'
    },
  ],
  eventLogContent: [
    {
      label: 'All kind',
      value: 'all'
    },
    {
      label: 'Node',
      value: 'Node'
    },
    {
      label: 'Pod',
      value: 'Pod'
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
  rows: computed('eventType', 'resourceKind', 'eventLevel', 'eventTime', 'namespaceId', 'model.clusterEventLogs.[]', function() {
    const clusterEventLogs = get(this, 'model.clusterEventLogs').content || []
    const eventType = get(this, 'eventType')
    const resourceKind = get(this, 'resourceKind')
    const eventTime = get(this, 'eventTime')
    const namespaceId = get(this, 'namespaceId')
    let arr = clusterEventLogs
    if (eventType !== 'any') {
      arr = arr.filter(a => a.eventType === eventType)
    }
    if (resourceKind !== 'all') {
      arr = arr.filter(a => a.resourceKind === resourceKind)
    }
    if (namespaceId !== 'poi-all') {
      arr = arr.filter(a => a.namespaceId === namespaceId)
    }
    return arr
  }),

  namespaceContent: computed('model.namespaces.[]', function() {
    const namespaces = get(this, 'model.namespaces').content || []
    let arr = namespaces.map(n => ({label: n.id, value: n.id}))
    return [{label: 'All namespace', value: 'poi-all'}, ...arr]
  }),

  resourceNameContent: computed('model.namespaces.[]', function() {
    const namespaces = get(this, 'model.namespaces').content || []
    const namespaceId = get(this, 'namespaceId')
    const resourceKind = get(this, 'resourceKind')
    let allPods = []
    console.log(get(this, 'allWorkloads'), 'allWorkloads')
    namespaces.map(n => {
      const pods = n.pods || []
      console.log(pods, 'pods')
      allPods = [...allPods, ...pods]
      console.log(allPods, 'allPods')
    })
    // if (resourceKind !== 'all') {
    //   arr = arr.filter(a => a.resourceKind === resourceKind)
    // }
    // if (namespaceId !== 'poi-all') {
    //   arr = arr.filter(a => a.namespaceId === namespaceId)
    // }
    return [{label: 'All resource', value: 'poi-all'}, ...allPods]
  }),

  headers: [
    {
      name:        'expand',
      sort:        false,
      searchField: null,
      width:       30
    },
    {
      name:           'state',
      searchField:    'displayState',
      translationKey: 'generic.time',
      width:          200
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.namespace',
      width:          150
    },
    {
      name:           'name',
      searchField:    'displayName',
      translationKey: 'generic.kind',
      width:          80
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.level',
      width:          80
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.reason',
      width:          200
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.message',
    },
  ],

  init() {

    this._super(...arguments)
    setProperties(this, {
      'resourceKind': 'all',
      'eventType': 'any',
      'eventTime': 'lastHour',
      'namespaceId': 'poi-all',
      'resourceName': 'poi-all',
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
    search() {
      const eventType = get(this, 'eventType')
      const resourceKind = get(this, 'resourceKind')
      const eventTime = get(this, 'eventTime')
      const namespaceId = get(this, 'namespaceId')
      const clusterId = get(this, 'scope.currentCluster.id');
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
  },
});

import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import {
  set, get, computed, setProperties
} from '@ember/object';
import parseUri from 'shared/utils/parse-uri';

export default Component.extend({
  scope:    service(),
  k8sStore: service(),

  layout,
  loading:         false,
  hostChoices:      [],
  expandedLogs:     [],
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
  headers: [
    {
      name:           'created',
      translationKey: 'generic.name',
      sort:           ['created'],
    },
    {
      name:           'source',
      translationKey: 'generic.address',
      sort:           false,
    },
  ],

  rows: alias('model.subscribers'),

  init() {

    this._super(...arguments)

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
      const clusterId = get(this, 'scope.currentCluster.id')
      const k8sStore = this.get('k8sStore')

      let filter = { clusterEventId: clusterId, }

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
      }).then((res) => set(this, 'model.clusterEventLogs', res))

    },

    configreSubscriber() {

      get(this, 'router').transitionTo('authenticated.cluster.event.subscriber')

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

          url += `?${ query }`

        }
        // get(this, 'store').rawRequest({
        //   url:    get(model, 'links.revision'),
        //   method: 'GET',
        // })
        set(this, 'loading', true)
        k8sStore.rawRequest({
          url,
          method: 'GET',
        }).then((res) => {

          clusterEventLogs.pushObjects(res.body.data)
          // debugger
          if ((res.body.pagination && res.body.pagination.next) !== next) {

            set(clusterEventLogs, 'pagination.next', res.body.pagination.next)

          }

        })
          .finally(() => set(this, 'loading', false))

      }

    },
  },
});

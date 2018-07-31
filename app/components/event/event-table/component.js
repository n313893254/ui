import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import { set, get, computed } from '@ember/object';

export default Component.extend({
  layout,
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
  rows: computed('eventType', 'resourceKind', 'eventLevel', 'eventTime', 'model.clusterEventLogs.[]', function() {
    const clusterEventLogs = get(this, 'model.clusterEventLogs').content || []
    const eventType = get(this, 'eventType')
    const resourceKind = get(this, 'resourceKind')
    const eventTime = get(this, 'eventTime')
    let arr = clusterEventLogs
    if (eventType !== 'any') {
      arr = arr.filter(a => a.eventType === eventType)
    }
    if (resourceKind !== 'all') {
      arr = arr.filter(a => a.resourceKind === resourceKind)
    }
    return arr
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
    set(this, 'resourceKind', 'all')
    set(this, 'eventType', 'any')
    set(this, 'eventTime', 'lastHour')

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
  },
});

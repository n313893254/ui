import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import { set, get } from '@ember/object';

export const headers = [
  {
    name:           'state',
    sort:           ['sortState', 'displayName'],
    searchField:    'displayState',
    translationKey: 'generic.state',
    width:          120
  },
  {
    name:           'name',
    sort:           ['sortName', 'id'],
    searchField:    'displayName',
    translationKey: 'generic.name',
  },
  {
    name:           'source',
    sort:           ['displaySource', 'name', 'id'],
    searchField:    ['displaySource', 'configName'],
    translationKey: 'persistentVolumePage.source.label',
  },
  {
    name:           'source',
    sort:           ['displaySource', 'name', 'id'],
    searchField:    ['displaySource', 'configName'],
    translationKey: 'persistentVolumePage.source.label',
  },
  {
    name:           'source',
    sort:           ['displaySource', 'name', 'id'],
    searchField:    ['displaySource', 'configName'],
    translationKey: 'persistentVolumePage.source.label',
  },
  {
    name:           'source',
    sort:           ['displaySource', 'name', 'id'],
    searchField:    ['displaySource', 'configName'],
    translationKey: 'persistentVolumePage.source.label',
  },
  {
    name:           'source',
    sort:           ['displaySource', 'name', 'id'],
    searchField:    ['displaySource', 'configName'],
    translationKey: 'persistentVolumePage.source.label',
  },
];

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
      value: 'node'
    },
    {
      label: 'Pod',
      value: 'pod'
    },
  ],
  eventLevelContent: [
    {
      label: 'Any log level',
      value: 'any'
    },
    {
      label: 'Normal',
      value: 'normal'
    },
    {
      label: 'Warning',
      value: 'warning'
    }
  ],
  eventTimeContent: [
    {
      label: 'Last hour',
      value: 'lastHour'
    }
  ],
  rows: alias('model.clusterEventLogs'),

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
      width:          250
    },
    {
      name:           'name',
      searchField:    'displayName',
      translationKey: 'generic.kind',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.level',
      width:          120
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
      translationKey: 'generic.namespace',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.message',
    },
  ],

  init() {

    this._super(...arguments)
    set(this, 'eventType', 'loadBalancer')
    set(this, 'eventLog', 'all')
    set(this, 'eventLevel', 'any')
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

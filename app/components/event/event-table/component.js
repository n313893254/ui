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
  eventTypeContent: [
    {
      label: 'Cloud HTTP Load Balancer',
      value: 'loadBalancer'
    },
  ],
  eventLogContent: [
    {
      label: 'All logs',
      value: 'all'
    },
  ],
  eventLevelContent: [
    {
      label: 'Any log level',
      value: 'any'
    }
  ],
  eventTimeContent: [
    {
      label: 'Last hour',
      value: 'lastHour'
    }
  ],
  rows: [{
    time:      '2018-07-24 10:56:21.003 HKT',
    method:    'GET',
    code:      '502',
    size:      '488B',
    requestor: 'Gemini/2.0',
    url:       'http://35.190.53.225',
  }, {
    time:      '2018-07-24 10:56:21.003 HKT',
    method:    'GET',
    code:      '502',
    size:      '488B',
    requestor: 'Gemini/2.0',
    url:       'http://35.190.53.225',
  }],

  headers: [
    {
      name:           'state',
      searchField:    'displayState',
      translationKey: 'generic.time',
      width:          250
    },
    {
      name:           'name',
      searchField:    'displayName',
      translationKey: 'generic.method',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.code',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.size',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.requestor',
      width:          120
    },
    {
      name:           'source',
      searchField:    ['displaySource', 'configName'],
      translationKey: 'generic.url',
    },
  ],

  init() {

    this._super(...arguments)
    set(this, 'eventType', 'loadBalancer')
    set(this, 'eventLog', 'all')
    set(this, 'eventLevel', 'any')
    set(this, 'eventTime', 'lastHour')

  }
});

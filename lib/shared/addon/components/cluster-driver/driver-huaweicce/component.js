import Component from '@ember/component'
import ClusterDriver from 'shared/mixins/cluster-driver';
import layout from './template';

import { get, set, computed, observer, setProperties } from '@ember/object';
import { satisfies } from 'shared/utils/parse-version';
import { sortableNumericSuffix } from 'shared/utils/util';
import { reject, all } from 'rsvp';
import { alias } from '@ember/object/computed';

export default Component.extend(ClusterDriver, {
  layout,
  configField: 'huaweiCloudContainerEngineConfig',
  zones: [{
    label: 'cn-north-1',
    value: 'cn-north-1',
  }],
  clusterType: [{
    label: 'VirtualMachine',
    value: 'VirtualMachine',
  }, {
    label: 'BareMetal',
    value: 'BareMetal',
  }],
  masterVersions: [{
    label: 'v1.9.2-r1',
    value: 'v1.9.2-r1',
  }, {
    label: 'v1.7.3-r10',
    value: 'v1.7.3-r10',
  }],
  billingModeContent: [{
    label: 'Pay-As-You-Go',
    value: '0',
  }],
  eipChargeModeContent: [{
    label: 'Pay-As-You-Go',
    value: '0',
  }],
  containerNetworkMode: [{
    label: 'overlay_l2',
    value: 'overlay_l2',
  }, {
    label: 'underlay_ipvlan',
    value: 'underlay_ipvlan',
  }, {
    label: 'vpc-router',
    value: 'vpc-router',
  }],
  clusterFlavorContent: [{
    label: 'cce.s1.small',
    value: 'cce.s1.small',
  }, {
    label: 'cce.s2.small',
    value: 'cce.s2.small',
  }, {
    label: 'cce.s1.medium',
    value: 'cce.s1.medium',
  }, {
    label: 'cce.s2.medium',
    value: 'cce.s2.medium',
  }, {
    label: 'cce.s1.large',
    value: 'cce.s1.large',
  }, {
    label: 'cce.s2.large',
    value: 'cce.s2.large',
  }],
  volumeTypeContent: [{
    label: 'SATA',
    value: 'SATA',
  }, {
    label: 'SAS',
    value: 'SAS',
  }, {
    label: 'SSD',
    value: 'SSD',
  }],
  eipTypeContent: [{
    label: '5_bgp',
    value: '5_bgp',
  }, {
    label: '5_sbgp',
    value: '5_sbgp',
  }],
  containerNetworkModeContent: [{
    label: 'overlay_l2',
    value: 'overlay_l2',
  }, {
    label: 'underlay_ipvlan',
    value: 'underlay_ipvlan',
  }, {
    label: 'vpc-router',
    value: 'vpc-router',
  }],
  vpcs: null,
  subnets: null,
  eipIds: null,
  nodeFlavors: null,
  keypairs: null,
  availableZones: null,
  eipSelector: null,
  step: 1,
  eipSelection: 'none',

  init() {
    this._super(...arguments);
    let config = get(this, 'cluster.huaweiCloudContainerEngineConfig');
    if ( !config ) {
      config = this.get('globalStore').createRecord({
        type: 'huaweiCloudContainerEngineConfig',
        accessKey: null,
        secretKey: null,
        zone: 'cn-north-1',
        availableZone: 'cn-north-1a',
        projectId: null,
        dataVolumeSize: 100,
        vpcId: null,
        clusterType: 'VirtualMachine',
        masterVersion: 'v1.9.2-r1',
        billingMode: '0',
        containerNetworkMode: 'overlay_l2',
        clusterFlavor: 'cce.s1.small',
        dataVolumeType: 'SATA',
        rootVolumeType: 'SATA',
        nodeCount: 1,
        rootVolumeSize: 40,
        eipShareType: 'PER',
        externalServerEnabled: false,
      });

      set(this, 'cluster.huaweiCloudContainerEngineConfig', config);
    }
  },

  editing: computed('mode', function() {
    return get(this, 'mode') === 'edit' ? true : false
  }),

  vpcContent: computed('vpcs.[]', function() {
    const vpcs = get(this, 'vpcs') || []
    return vpcs.map(v => {return {label: v.name, value: v.id}})
  }),

  vpcIdChange: observer('config.vpcId', function() {
    const vpcId = get(this, 'config.vpcId')
    const subnets = get(this, 'subnets') || []

    const filter = subnets.filter(s => s.vpc_id === vpcId)
    set(this, 'config.subnetId', filter[0] && filter[0].id || null)
  }),

  editedVpcName: computed('config.vpcId', function() {
    const vpcId = get(this, 'config.vpcId')
    const vpcs =get(this, 'vpcs') || []
    const filter = vpcs.filter(v => v.id === vpcId)[0] || {}
    return filter.name
  }),

  subnetContent: computed('config.vpcId', 'subnets.[]', function() {
    const subnets = get(this, 'subnets') || []
    const vpcId = get(this, 'config.vpcId')
    const filter = subnets.filter(s => s.vpc_id === vpcId).map(s => ({
      label: s.name,
      value: s.id,
    }))
    return filter
  }),

  editedSubnetName: computed('config.subnetId', function() {
    const subnetId = get(this, 'config.subnetId')
    const subnets =get(this, 'subnets') || []
    const filter = subnets.filter(s => s.id === subnetId)[0] || {}
    return filter.name
  }),

  eipIdContent: computed('eipIds.[]', function() {
    const eipIds = get(this, 'eipIds') || []
    return eipIds.filter(e => e.status === 'DOWN').map(e => ({label: e.public_ip_address, value: e.id}))
  }),

  eipChange: observer('eipSelector.[]', function() {
    const eipSelector = get(this, 'eipSelector') || []
    const arr = eipSelector.map(e => e.value)
    set(this, 'config.eipIds', arr)
  }),

  clusterEipName: computed('config.clusterEipId', function() {
    const eipIds = get(this, 'eipIds') || []
    const clusterEipId = get(this, 'config.clusterEipId')
    const filter = eipIds.filter(e => e.id === clusterEipId)[0] || {}
    return filter.public_ip_address
  }),

  nodeFlavorContent: computed('nodeFlavors.[]', function() {
    const nodeFlavors = get(this, 'nodeFlavors') || []
    return nodeFlavors.map(n => {return {label: n.name, value: n.id}})
  }),

  availableZoneContent: computed('availableZones.[]', function() {
    const zones = get(this, 'availableZones')
    return zones.map(z => {
      if (z.zoneState.available) {
        return {label: z.zoneName, value: z.zoneName}
      }
    })
  }),

  eipSelectionChange: observer('eipSelection', function() {
    const eipSelection = get(this, 'eipSelection')
    if (eipSelection === 'none') {
      setProperties(this, {
        'config.eipIds': null,
        'config.eipCount': null,
        'config.eipType': null,
        'config.eipChargeMode': null,
        'config.eipBandwidthSize': null,
      })
    }
    if (eipSelection === 'exist') {
      setProperties(this, {
        'config.eipCount': null,
        'config.eipType': null,
        'config.eipChargeMode': null,
        'config.eipBandwidthSize': null,
      })
    }
    if (eipSelection === 'new') {
      setProperties(this, {
        'config.eipIds': null,
        'config.eipCount': 1,
        'config.eipType': '5_bgp',
        'config.eipChargeMode': '0',
        'config.eipBandwidthSize': 1,
      })
    }
  }),

  sshkeyContent: computed('keypairs.[]', function() {
    const keypairs = get(this, 'keypairs')
    return keypairs.map(k => {return {label: k.keypair.name, value: k.keypair.name}})
  }),

  editedSshName: computed('config.sshKey', function() {
    const sshKey = get(this, 'config.sshKey')
    const keypairs = get(this, 'keypairs')
    const filter = keypairs.filter(k => k.keypair.name === sshKey)[0] || {}
    return filter.keypair && filter.keypair.name || ''
  }),

  externalServerChange: observer('config.externalServerEnabled', function() {
    const externalServerEnabled = get(this, 'config.externalServerEnabled')
    if (externalServerEnabled) {
      const eipIds = get(this, 'eipIds') || []
      const defaultId = eipIds[0] && eipIds[0].id
      set(this, 'config.clusterEipId', defaultId)
    } else {
      set(this, 'config.clusterEipId', null)
    }
  }),

  nodeCountMax: computed('config.clusterFlavor', function() {
    const clusterFlavor = get(this, 'config.clusterFlavor') || ''
    if (clusterFlavor.endsWith('small')) {
      return 50
    }
    if (clusterFlavor.endsWith('medium')) {
      return 200
    }
    return 1000
  }),

  actions: {
    checkAccount(cb) {
      set(this, 'errors', [])
      if(!get(this, 'cluster.name')) {
        let errors = this.get('errors')||[];
        errors.pushObject('Cluster name is required.');
        set(this, 'errors', errors);
        cb();
        return;
      }
      setProperties(this, {
        'errors':null,
        'config.accessKey': (get(this, 'config.accessKey')||'').trim(),
        'config.secretKey': (get(this, 'config.secretKey')||'').trim(),
      });

      try {
        const location = window.location;
        const region = get(this, 'config.zone')
        let endpoint = `vpc.${region}.myhuaweicloud.com`;
        endpoint = get(this,'app.proxyEndpoint') + '/' + endpoint.replace('//', '/');
        endpoint = `${location.origin}${endpoint}`;

        var client = new HW.ECS({
          // ak: 'OCQKNSBYFGW2OBYVK2HO',
          // sk: 'te2yPx4rHOuaeaoN7AAbWdAqM2gyydEmVoB3UNfN',
          // projectId: 'e72385fde3574f8bb07d58f0de8ef948',
          ak: get(this, 'config.accessKey'),
          sk: get(this, 'config.secretKey'),
          projectId: get(this, 'config.projectId'),
          endpoint,
          region: region,
          toSignedHost: `vpc.${region}.myhuaweicloud.com`,
        })

        client.getVpcs((err, response) => {
          if ( err ) {
            let errors = this.get('errors')||[];
            errors.pushObject(err);
            set(this, 'errors', errors);
            cb();
            return;
          }

          set(this, 'vpcs', response.body.vpcs)

          if (get(this, 'mode') === 'new') {
            set(this, 'config.vpcId', response.body.vpcs[0] && response.body.vpcs[0].id || null)
          }

          client.getSubnet((err, response) => {
            if (err) {
              let errors = this.get('errors')||[];
              errors.pushObject(err);
              set(this, 'errors', errors);
              cb();
              return;
            }

            const vpcId = get(this, 'config.vpcId')
            const filter = response.body.subnets.filter(s => s.vpc_id === vpcId)

            set(this, 'subnets', response.body.subnets)

            client.getPublicips((err, response) => {
              if (err) {
                let errors = this.get('errors')||[];
                errors.pushObject(err);
                set(this, 'errors', errors);
                cb();
                return;
              }

              set(this, 'eipIds', response.body.publicips)
              set(this, 'step', 2);
              cb();
            })
          })
        })
      } catch (err) {
        const errors = get(this, 'errors') || [];
        errors.pushObject(err.message || err);
        set(this, 'errors', errors);
        cb();
        return;
      }
    },

    configreNode(cb) {
      set(this, 'errors', [])
      if(!get(this, 'config.vpcId') || !get(this, 'config.subnetId')) {
        let errors = this.get('errors')||[];
        errors.pushObject('VPC name and subnet name are required.');
        set(this, 'errors', errors);
        cb();
        return;
      }
      try {
        const location = window.location;
        const region = get(this, 'config.zone')
        let endpoint = `ecs.${region}.myhuaweicloud.com`;
        endpoint = get(this,'app.proxyEndpoint') + '/' + endpoint.replace('//', '/');
        endpoint = `${location.origin}${endpoint}`;

        var client = new HW.ECS({
          // ak: 'OCQKNSBYFGW2OBYVK2HO',
          // sk: 'te2yPx4rHOuaeaoN7AAbWdAqM2gyydEmVoB3UNfN',
          // projectId: 'e72385fde3574f8bb07d58f0de8ef948',
          ak: get(this, 'config.accessKey'),
          sk: get(this, 'config.secretKey'),
          projectId: get(this, 'config.projectId'),
          endpoint,
          region: region,
          toSignedHost: `ecs.${region}.myhuaweicloud.com`,
          service: 'ecs',
        })

        client.listCloudServerFlavors((err, response) => {
          if (err) {
            let errors = this.get('errors')||[];
            errors.pushObject(err);
            set(this, 'errors', errors);
            cb();
            return;
          }

          // setProperties(this, {
          //   'nodeFlavors': response.body.flavors,
          //   'step': 3,
          // })

          set(this, 'nodeFlavors', response.body.flavors)

          if (get(this, 'mode') === 'new') {
            set(this, 'config.nodeFlavor', response.body.flavors[0] && response.body.flavors[0].id || null)
          }
          client.listKeypairs((err, response) => {
            if (err) {
              let errors = this.get('errors')||[];
              errors.pushObject(err);
              set(this, 'errors', errors);
              cb();
              return;
            }

            set(this, 'keypairs', response.body.keypairs)
            if (get(this, 'mode') === 'new') {
              set(this, 'config.sshKey', response.body.keypairs[0] && response.body.keypairs[0].keypair.name || null)
            }

            client.getAvaliableZone((err, response) => {
              if (err) {
                let errors = this.get('errors')||[];
                errors.pushObject(err);
                set(this, 'errors', errors);
                cb();
                return;
              }

              set(this, 'availableZones', response.body.availabilityZoneInfo)
              if (get(this, 'mode') === 'new') {
                set(this, 'config.keypairs', response.body.availabilityZoneInfo[0] && response.body.availabilityZoneInfo[0].zoneName || null)
              }
              set(this, 'step', 3)
            })

          })
        })
      } catch (err) {
        const errors = get(this, 'errors') || [];
        errors.pushObject(err.message || err);
        set(this, 'errors', errors);
        cb();
        return;
      }
    },

    setLabels(section, labels) {
      let obj = {}
      section.map(s => {
        if (s.key && s.value) {
          obj[s.key] = s.value
        }
      })
      set(this, 'config.labels', obj)
    },

    setNodeLabels(section, labels) {
      let obj = {}
      section.map(s => {
        if (s.key && s.value) {
          obj[s.key] = s.value
        }
      })
      set(this, 'config.nodeLabels', obj)
    },
  },
});

import Component from '@ember/component'
import ClusterDriver from 'shared/mixins/cluster-driver';
import layout from './template';

import { get, set, computed, observer, setProperties } from '@ember/object';
import { satisfies } from 'shared/utils/parse-version';
import { sortableNumericSuffix } from 'shared/utils/util';
import { reject, all } from 'rsvp';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend(ClusterDriver, {
  layout,
  k8sStore: service(),
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
  masterVersions: [],
  eipChargeModeContent: [{
    label: 'BandWith',
    value: null,
  }, {
    label: 'Traffic',
    value: 'traffic',
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
  managementScaleContent: computed('config.clusterType', function() {
    const clusterType = get(this, 'config.clusterType')
    if (clusterType === 'BareMetal') {
      return [{
        label: '10',
        value: 'small',
      }, {
        label: '100',
        value: 'medium',
      }, {
        label: '500',
        value: 'large',
      }]
    }
    return [{
      label: '50',
      value: 'small',
    }, {
      label: '200',
      value: 'medium',
    }, {
      label: '1000',
      value: 'large',
    }]
  }),
  nodeOperationSystemContent: [{
    label: 'EulerOS 2.2',
    value: 'EulerOS 2.2',
  }, {
    label: 'EulerOS 2.3',
    value: 'EulerOS 2.3',
  }],
  containerNetworkCidrContent: [
    {label: '172.16.0.0/16', value: '172.16.0.0/16'}
  ],
  validityPeriodContent: [
    {label: '1 month', value: '1 month'},
    {label: '2 months', value: '2 month'},
    {label: '3 months', value: '3 month'},
    {label: '4 months', value: '4 month'},
    {label: '5 months', value: '5 month'},
    {label: '6 months', value: '6 month'},
    {label: '7 months', value: '7 month'},
    {label: '8 months', value: '8 month'},
    {label: '9 months', value: '9 month'},
    {label: '1 year', value: '1 year'},
  ],
  eipShareTypeContent: [
    {label: 'PER', value: 'PER'},
  ],
  vpcs: null,
  subnets: null,
  eipIds: null,
  nodeFlavors: null,
  keypairs: null,
  availableZones: null,
  eipSelector: null,
  step: 1,
  eipSelection: 'none',
  highAvailabilityEnabled: 's2',
  managementScale: 'small',
  validityPeriod: '1 month',
  authConfigred: computed('config.businessId', function() {
    let businessId = get(this, 'config.businessId') || ''
    if (businessId && businessId !== 'null') {
      return true
    }
    return false
  }),
  publicCloud: null,
  loginMode: 'password',

  init() {
    this._super(...arguments);
    const k8sStore = get(this, 'k8sStore')
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
        masterVersion: 'v1.9.7-r0',
        billingMode: 0,
        containerNetworkMode: 'overlay_l2',
        clusterFlavor: 'cce.s2.small',
        dataVolumeType: 'SATA',
        rootVolumeType: 'SATA',
        nodeCount: 1,
        rootVolumeSize: 40,
        externalServerEnabled: false,
        nodeOperationSystem: 'EulerOS 2.2',
        containerNetworkCidr: '172.16.0.0/16',
        bmsIsAutoRenew: 'false',
        userName: 'root',
      });

      set(this, 'cluster.huaweiCloudContainerEngineConfig', config);
      const business = get(this, 'model.business').content
      let businessId = business[0] && business[0].id
      if (!businessId) {
        set(this, 'cluster.huaweiCloudContainerEngineConfig.businessId', 'null')
      }
      this.validityPeriodChange()
    } else {
      const clusterFlavor = get(config, 'clusterFlavor')
      if (clusterFlavor) {
        const arr = clusterFlavor.split('.')
        set(this, 'highAvailabilityEnabled', arr[1])
        set(this, 'managementScale', arr[2])
      }

      const labels = get(this, 'config.labels') || {}
      let businessId = labels.business
      businessId = businessId.replace('_', ':')
      set(this, 'config.businessId', businessId)

      // const sshKey = get(this, 'config.sshKey')
      // if (sshKey) {
      //   set(this, 'loginMode', 'keyPair')
      // } else {
      //   set(this, 'loginMode', 'password')
      // }
    }
    if (get(this, 'customer') === 'huawei') {
      const business = get(this, 'model.business').content
      let businessId = business[0] && business[0].id
      set(this, 'config.businessId', businessId)
      set(this, 'authConfigred', true)
    }
    k8sStore.rawRequest({
      url:    `${k8sStore.baseUrl}/v3/businesses?action=getHuaweiCloudRegion`,
      method: 'POST',
    }).then(res => {
      const {body={}} = res
      const {regions=[], masterVersions=[]} = body
      set(this, 'zones', regions.map(r => ({label: r, value: r})))
      set(this, 'masterVersions', masterVersions.map(m => ({label: m, value: m})))
      if (get(this, 'mode') === 'new') {
        set(this, 'config.zone', regions[0])
        set(this, 'config.masterVersion', masterVersions[0])
      }
    })
  },

  clusterTypeChange: observer('config.clusterType', function() {
    const clusterType = get(this, 'config.clusterType')
    const publicCloud = get(this, 'publicCloud')
    if (clusterType === 'VirtualMachine') {
      set(this, 'config.billingMode', 0)
      set(this, 'config.highwaySubnet', null)
      set(this, 'highAvailabilityEnabled', 's2')
    }
    if (clusterType !== 'BareMetal' || get(this, 'mode') !== 'new') {
      return
    }
    const networks = get(this, 'networks') || []
    let filter = []
    if (publicCloud) {
      filter = networks.filter(n => n.status === 'ACTIVE' && n.tenant_id === get(this, 'config.projectId') && n[`provider:network_type`] === 'geneve')
    } else {
      filter = networks.filter(n => n.status === 'ACTIVE')
    }
    set(this, 'config.highwaySubnet', filter[0] && filter[0].id)
    set(this, 'highAvailabilityEnabled', 't2')
  }),

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
    const vpcs = get(this, 'vpcs') || []
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
    return nodeFlavors.map(n => {return {label: `${n.name} ( vCPUs: ${n.vcpus}, memory: ${n.ram / 1024} GB )`, value: n.name}})
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
        'config.eipShareType': null,
        'config.eipChargeMode': null,
        'config.eipBandwidthSize': null,
      })
    }
    if (eipSelection === 'exist') {
      setProperties(this, {
        'config.eipCount': null,
        'config.eipType': null,
        'config.eipShareType': null,
        'config.eipChargeMode': null,
        'config.eipBandwidthSize': null,
      })
    }
    if (eipSelection === 'new') {
      setProperties(this, {
        'config.eipIds': null,
        'config.eipCount': 1,
        'config.eipType': '5_bgp',
        'config.eipBandwidthSize': 1,
        'config.eipShareType': 'PER',
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

  clusterFlavorObserver: observer('managementScale', 'highAvailabilityEnabled', function() {
    const managementScale = get(this, 'managementScale')
    const highAvailabilityEnabled = get(this, 'highAvailabilityEnabled')
    set(this, 'config.clusterFlavor', `cce.${highAvailabilityEnabled}.${managementScale}`)
  }),

  managementScaleDisplay: computed('managementScale', function() {
    const managementScale = get(this, 'managementScale')
    const managementScaleContent = get(this, 'managementScaleContent') || []
    const filter = managementScaleContent.filter(m => m.value === managementScale)[0] || {}
    return filter.label
  }),

  networkContent: computed('networks.[]', function() {
    const networks = get(this, 'networks')
    const publicCloud = get(this, 'publicCloud')
    let arr = []
    if (publicCloud) {
      arr = networks.filter(n => n.status === 'ACTIVE' && n.tenant_id === get(this, 'config.projectId') && n[`provider:network_type`] === 'geneve')
    } else {
      arr = networks.filter(n => n.status === 'ACTIVE')
    }

    return arr.map(a => ({label: a.name, value: a.id}))
  }),

  businessContent: computed('model.business.[]', function() {
    const business = get(this, 'model.business') && get(this, 'model.business').content || []
    let arr = business.map(m => ({
      label: m.name,
      value: m.id,
    }))
    arr.push({label: 'No business', value: 'null'})
    return arr
  }),

  // businessName: computed('model.business.[]', function() {
  //   const business = get(this, 'model.business') && get(this, 'model.business').content || []
  //   const labels = get(this, 'config.labels') || {}
  //   let businessId = labels.business
  //   if (!businessId) {
  //     return 'No business'
  //   }
  //   businessId = businessId.replace('_', ':')
  //   const filter = business.filter(b => b.id === businessId)
  //   if (filter.length > 0) {
  //     return filter[0].name
  //   }
  //   return 'No business'
  // }),

  billingModeName: computed('config.billingMode', function() {
    const billingMode = get(this, 'config.billingMode')
    return billingMode === 0 ? 'Pay-per-use' : 'Yearly/Monthly'
  }),

  billingModeContent: computed('config.clusterType', function() {
    const clusterType = get(this, 'config.clusterType')
    if (clusterType === 'VirtualMachine') {
      return [{
        label: 'Pay-per-use',
        value: 0,
      }]
    } else {
      return [{
        label: 'Pay-per-use',
        value: 0,
      }, {
        label: 'Yearly/Monthly',
        value: 2,
      }]
    }
  }),

  validityPeriodChange: observer('validityPeriod', function() {
    const validityPeriod = get(this, 'validityPeriod')
    if (!validityPeriod) {
      setProperties(this, {
        'config.bmsPeriodNum': null,
        'config.bmsPeriodType': null,
      })
      return
    }
    const arr = validityPeriod.split(' ')
    set(this, 'config.bmsPeriodNum', parseInt(arr[0]))
    set(this, 'config.bmsPeriodType', arr[1])
  }),

  validityPeriodName: computed('config.bmsPeriodNum', 'config.bmsPeriodType', function() {
    const bmsPeriodNum = get(this, 'config.bmsPeriodType')
    const bmsPeriodType = get(this, 'config.bmsPeriodType')
    return `${bmsPeriodNum} ${bmsPeriodType}`
  }),

  bmsIsAutoRenewName: computed('config.bmsIsAutoRenew', function() {
    const bmsIsAutoRenew = get(this, 'config.bmsIsAutoRenew')
    return bmsIsAutoRenew === 'true' ? 'Enabled' : 'Disabled'
  }),

  billingModeChange: observer('config.billingMode', function() {
    const billingMode = get(this, 'config.billingMode')
    if (billingMode === 0) {
      setProperties(this, {
        'validityPeriod': null,
        'config.bmsIsAutoRenew': null,
      })
    }
    if (billingMode === 2) {
      setProperties(this, {
        'config.bmsIsAutoRenew': 'false',
        'validityPeriod': '1 month',
      })
    }
  }),

  loginModeChange: observer('loginMode', function() {
    const loginMode = get(this, 'loginMode')
    const keypairs = get(this, 'keypairs') || []
    if (loginMode === 'keyPair') {
      set(this, 'config.sshKey', keypairs[0] && keypairs[0].keypair.name)
      set(this, 'config.password', null)
      set(this, 'preBase64Password', null)
    }
    if (loginMode === 'password') {
      set(this, 'config.sshKey', null)
    }
  }),

  willSave() {
    let businessId = get(this, 'config.businessId') || '' || ''
    const labels = get(this, 'config.labels') || {}
    const formatBusinessId = businessId.replace(':', '_')
    set(labels, 'business', formatBusinessId)
    if (get(this, 'mode') === 'new') {
      const authenticatingProxyCa = get(this, 'authenticatingProxyCa') || ''
      set(this, 'config.authenticatingProxyCa', AWS.util.base64.encode(authenticatingProxyCa))

      const preBase64Password = get(this, 'preBase64Password') || ''
      set(this, 'config.password', AWS.util.base64.encode(preBase64Password))
    }
    return this._super(...arguments);
  },

  checkout(cb) {
    const k8sStore = get(this, 'k8sStore')
    let businessId = get(this, 'config.businessId') || ''
    const business = get(this, 'model.business') && get(this, 'model.business').content || []
    businessId = businessId.replace('_', ':')
    const filter = business.filter(b => b.id === businessId)[0]

    filter.doAction('checkout', {
      businessName: businessId,
      nodeCount: get(this, 'config.nodeCount'),
    }, {
      url: `${k8sStore.baseUrl}/v3/business/${businessId}?action=checkout`
    }).then(res => {
      cb()
    })
  },

  validate() {
    this._super(...arguments);
    const errors = get(this,'errors')||[];

    let businessId = get(this, 'config.businessId') || ''
    const business = get(this, 'model.business') && get(this, 'model.business').content || []
    businessId = businessId.replace('_', ':')
    const filterBusiness = business.filter(b => b.id === businessId)[0] || {}

    if (filterBusiness.nodeCount < get(this, 'config.nodeCount')) {
      errors.pushObject('Checkout failed, there is no enough quotas')
    }

    const password = get(this, 'config.password')
    const preBase64Password = get(this, 'preBase64Password')
    const sshKey = get(this, 'config.sshKey')
    if (!(password || sshKey || preBase64Password)) {
      errors.pushObject('Password is required')
    }

    if (!get(this, 'config.authenticatingProxyCa')) {
      errors.pushObject('Certificate is required')
    }
    set(this, 'errors', errors);
    return errors.length === 0;
  },

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
      if(!get(this, 'config.projectId')) {
        let errors = this.get('errors')||[];
        errors.pushObject('Project Id is required.');
        set(this, 'errors', errors);
        cb();
        return;
      }
      setProperties(this, {
        'errors':null,
        'config.accessKey': (get(this, 'config.accessKey')||'').trim(),
        'config.secretKey': (get(this, 'config.secretKey')||'').trim(),
      });

      if (get(this, 'authConfigred')) {
        const labels = get(this, 'config.labels') || {}
        const k8sStore = get(this, 'k8sStore')
        let businessId = get(this, 'config.businessId') || '' || labels.business
        const business = get(this, 'model.business') && get(this, 'model.business').content || []
        businessId = businessId.replace('_', ':')
        const filter = business.filter(b => b.id === businessId)[0]

        filter.doAction('getHuaweiCloudApiInfo', {
          projectId: get(this, 'config.projectId'),
          zone: get(this, 'config.zone'),
        }, {
          url: `${k8sStore.baseUrl}/v3/business/${businessId}?action=getHuaweiCloudApiInfo`
        }).then(res => {
          console.log(res, 'res')



          setProperties(this, {
            step: 2,
            vpcs: res.vpcs,
            availableZones: res.availabilityZoneInfo,
            nodeFlavors: res.flavors,
            keypairs: res.keypairs,
            subnets: res.subnets,
            networks: res.networks,
          })

          const vpcId = res.vpcs[0].id
          const filter = res.subnets.filter(s => s.vpc_id === vpcId)[0]

          if (get(this, 'mode') === 'new') {
            setProperties(this, {
              'config.vpcId': res.vpcs[0].id,
              'config.availableZone': res.availabilityZoneInfo[0].zoneName,
              'config.nodeFlavor': res.flavors[0].name,
              // 'config.sshKey': res.keypairs[0].keypair.name,
              'config.subnetId': filter.id,
            })
          }
          cb()
        }).catch((err) => {
          let errors = this.get('errors') || []
          console.log(err, 'err')
          errors.pushObject('Get Huawei cloud api info failed')
          set(this, 'errors', errors)
          cb()
          return
        })
      } else {
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

              if (get(this, 'mode') === 'new') {
                set(this, 'config.subnetId', response.body.subnets[0] && response.body.subnets[0].id || null)
              }

              client.getPublicips((err, response) => {
                if (err) {
                  let errors = this.get('errors')||[];
                  errors.pushObject(err);
                  set(this, 'errors', errors);
                  cb();
                  return;
                }

                set(this, 'eipIds', response.body.publicips)

                client.getNetwork((err, response) => {
                  if (err) {
                    let errors = this.get('errors') || []
                    errors.pushObject(err)
                    set(this, 'errors', errors)
                    cb()
                    return
                  }
                  set(this, 'publicCloud', true)
                  set(this, 'networks', response.body.networks)
                  // if (get(this, 'mode') === 'new') {
                  //   set(this, 'config.highwaySubnet', response.body.networks[0] && response.body.networks[0].id || null)
                  // }

                  set(this, 'step', 2);
                  cb();
                })
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
      }
    },

    configreNode(cb) {
      set(this, 'errors', [])
      let errors = this.get('errors')||[];
      if(!get(this, 'config.vpcId') || !get(this, 'config.subnetId')) {
        errors.pushObject('VPC name and subnet name are required.');
      }
      if(!get(this, 'config.containerNetworkCidr')) {
        errors.pushObject('Container Network Cidr are required.');
      }
      if (errors.length > 0) {
        set(this, 'errors', errors);
        cb();
        return;
      }
      if (get(this, 'authConfigred')) {
        set(this, 'step', 3)
        cb()
        return
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
            set(this, 'config.nodeFlavor', response.body.flavors[0] && response.body.flavors[0].name || null)
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
            // if (get(this, 'mode') === 'new') {
            //   set(this, 'config.sshKey', response.body.keypairs[0] && response.body.keypairs[0].keypair.name || null)
            // }

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

import {
  getProjectId, getClusterId, bulkAdd
} from 'ui/utils/navigation-tree';

const rootNav = [
  // Project
  {
    scope:           'project',
    id:              'containers',
    localizedLabel:  'nav.containers.tab',
    route:           'authenticated.project.index',
    ctx:             [getProjectId],
    resource:        ['workload', 'ingress', 'dnsrecord'],
    resourceScope:   'project',
    moreCurrentWhen: [
      'containers', 'workload',
      'ingresses',
      'authenticated.project.dns',
      'volumes',
      'authenticated.project.pipeline'
    ],
  },

  {
    scope:          'project',
    id:             'project-apps',
    localizedLabel: 'nav.apps.tab',
    route:          'apps-tab',
    ctx:            [getProjectId],
    resource:       ['app'],
    resourceScope:  'project',
  },
  {
    scope:          'project',
    id:             'infra',
    localizedLabel: 'nav.infra.tab',
    ctx:            [getProjectId],
    route:          'authenticated.project.alert',
    submenu:        [
      {
        id:             'tools-alerts',
        localizedLabel: 'nav.tools.alerts',
        icon:           'icon icon-alert',
        route:          'authenticated.project.alert',
        resource:       [],
        ctx:            [getProjectId],
        resourceScope:  'global',
      },
      {
        id:             'infra-certificates',
        localizedLabel: 'nav.infra.certificates',
        icon:           'icon icon-certificate',
        route:          'authenticated.project.certificates',
        ctx:            [getProjectId],
        resource:       ['certificate'],
        resourceScope:  'project',
      },
      {
        id:             'infra-config-maps',
        localizedLabel: 'nav.infra.configMaps',
        icon:           'icon icon-file',
        route:          'authenticated.project.config-maps',
        ctx:            [getProjectId],
        resource:       ['configmap'],
        resourceScope:  'project',
      },
      {
        id:             'tools-logging',
        localizedLabel: 'nav.tools.logging',
        icon:           'icon icon-files',
        route:          'authenticated.project.logging',
        resourceScope:  'global',
        resource:       [],
        ctx:            [getProjectId],
      },
      {
        id:             'infra-registries',
        localizedLabel: 'nav.infra.registries',
        icon:           'icon icon-database',
        route:          'authenticated.project.registries',
        ctx:            [getProjectId],
        resource:       ['dockercredential'],
        resourceScope:  'project',
      },
      {
        id:             'infra-secrets',
        localizedLabel: 'nav.infra.secrets',
        icon:           'icon icon-secrets',
        route:          'authenticated.project.secrets',
        ctx:            [getProjectId],
        resource:       ['namespacedsecret', 'secret'],
        resourceScope:  'project',
      },
    ],
  },
  {
    scope:          'project',
    id:             'namespaces',
    localizedLabel: 'nav.project.namespaces',
    route:          'authenticated.project.ns.index',
    ctx:            [getProjectId],
    resource:       ['namespace'],
    resourceScope:  'cluster',
  },
  {
    scope:          'project',
    id:             'project-security-roles',
    localizedLabel: 'nav.infra.members',
    icon:           'icon icon-users',
    route:          'authenticated.project.security.members',
    resource:       ['projectroletemplatebinding'],
    resourceScope:  'global',
    ctx:            [getProjectId],
  },
  // Cluster
  {
    scope:          'cluster',
    id:             'cluster-k8s',
    localizedLabel: 'nav.cluster.dashboard',
    route:          'authenticated.cluster.index',
    ctx:            [getClusterId],
    resource:       ['node'],
    resourceScope:  'global',
  },
  {
    scope:          'cluster',
    id:             'cluster-nodes',
    localizedLabel: 'nav.cluster.nodes',
    route:          'authenticated.cluster.nodes',
    ctx:            [getClusterId],
    resource:       ['node'],
    resourceScope:  'global',
  },
  {
    scope:          'cluster',
    id:             'cluster-storage',
    localizedLabel: 'nav.cluster.storage.tab',
    ctx:            [getClusterId],
    resource:       ['clusterroletemplatebinding'],
    resourceScope:  'global',
    route:          'authenticated.cluster.storage',
    submenu:        [
      {
        scope:          'cluster',
        id:             'cluster-storage-volumes',
        localizedLabel: 'nav.cluster.storage.volumes',
        route:          'authenticated.cluster.storage.persistent-volumes.index',
        ctx:            [getClusterId],
        resource:       ['project'],
        resourceScope:  'global',
      },
      {
        scope:          'cluster',
        id:             'cluster-storage-classes',
        localizedLabel: 'nav.cluster.storage.classes',
        route:          'authenticated.cluster.storage.classes.index',
        ctx:            [getClusterId],
        resource:       ['project'],
        resourceScope:  'global',
      },
    ]
  },
  {
    scope:          'cluster',
    id:             'cluster-projects',
    localizedLabel: 'nav.cluster.projects',
    route:          'authenticated.cluster.projects.index',
    ctx:            [getClusterId],
    resource:       ['project'],
    resourceScope:  'global',
  },
  {
    scope:          'cluster',
    id:             'cluster-security-roles',
    localizedLabel: 'nav.cluster.members',
    icon:           'icon icon-users',
    route:          'authenticated.cluster.security.members.index',
    resource:       ['clusterroletemplatebinding'],
    resourceScope:  'global',
    ctx:            [getClusterId],
  },
  {
    scope:          'cluster',
    id:             'cluster-tools',
    localizedLabel: 'nav.tools.tab',
    ctx:            [getClusterId],
    resource:       [],
    resourceScope:  'global',
    route:          'authenticated.cluster.alert',
    submenu:        [
      {
        id:             'cluster-tools-alert',
        localizedLabel: 'nav.tools.alerts',
        // icon: 'icon icon-key',
        route:          'authenticated.cluster.alert',
        resourceScope:  'global',
        resource:       [],
        ctx:            [getClusterId],
      },
      {
        id:             'cluster-tools-notifiers',
        localizedLabel: 'nav.tools.notifiers',
        // icon: 'icon icon-key',
        route:          'authenticated.cluster.notifier',
        resourceScope:  'global',
        resource:       [],
        ctx:            [getClusterId],
      },
      { divider: true },
      {
        id:             'cluster-tools-logging',
        localizedLabel: 'nav.tools.logging',
        // icon: 'icon icon-key',
        route:          'authenticated.cluster.logging',
        resourceScope:  'global',
        resource:       [],
        ctx:            [getClusterId],
      },
      { divider: true },
      {
        id:             'cluster-tools-pipeline',
        localizedLabel: 'nav.tools.pipeline',
        route:          'authenticated.cluster.pipeline.settings',
        ctx:            [getClusterId],
        resourceScope:  'cluster',
      },
      { divider: true },
      {
        id:             'cluster-tools-event',
        localizedLabel: 'nav.tools.event',
        route:          'authenticated.cluster.event',
        ctx:            [getClusterId],
        resourceScope:  'cluster',
      },
      {
        id:             'cluster-tools-event',
        localizedLabel: 'nav.tools.subscriber',
        route:          'authenticated.cluster.subscriber',
        ctx:            [getClusterId],
        resourceScope:  'cluster',
      },
      { divider: true },
      {
        id:             'cluster-tools-hook',
        localizedLabel: 'nav.tools.hook',
        route:          'authenticated.cluster.hooks',
        ctx:            [getClusterId],
        resourceScope:  'cluster',
      },
    ],
  },

  // Global
  {
    scope:          'global',
    id:             'global-clusters',
    localizedLabel: 'nav.admin.clusters',
    route:          'global-admin.clusters',
    resource:       ['cluster'],
    resourceScope:  'global',
  },
  {
    scope:          'global',
    id:             'global-node-drivers',
    localizedLabel: 'nav.admin.nodeDrivers',
    route:          'global-admin.node-drivers',
    resource:       ['nodedriver'],
    resourceScope:  'global',
  },
  {
    scope:          'global',
    id:             'global-catalogs',
    localizedLabel: 'nav.admin.catalogs',
    route:          'global-admin.catalog',
    resource:       ['catalog'],
    resourceScope:  'global',
  },
  {
    scope:          'global',
    id:             'global-accounts',
    localizedLabel: 'nav.admin.accounts',
    route:          'global-admin.accounts',
    resource:       ['user'],
    resourceScope:  'global',
  },
  {
    scope:          'global',
    id:             'global-settings',
    localizedLabel: 'nav.settings.tab',
    route:          'global-admin.settings.advanced',
    resourceScope:  'global',
  },
  {
    scope:          'global',
    id:             'global-security',
    localizedLabel: 'nav.admin.security.tab',
    route:          'global-admin.security',
    submenu:        [
      {
        id:             'global-security-roles',
        localizedLabel: 'nav.admin.security.roles',
        icon:           'icon icon-key',
        route:          'global-admin.security.roles',
        resource:       ['roletemplate'],
        resourceScope:  'global',
      },
      {
        id:             'global-security-roles',
        localizedLabel: 'nav.admin.security.podSecurityPolicies',
        icon:           'icon icon-files',
        route:          'global-admin.security.policies',
        resource:       ['podsecuritypolicytemplate'],
        resourceScope:  'global',
      },
      {
        id:             'global-security-authentication',
        localizedLabel: 'nav.admin.security.authentication',
        icon:           'icon icon-users',
        route:          'global-admin.security.authentication',
        condition() {

          const authConfigs = this.get('globalStore').all('authConfig');

          return authConfigs.get('length') > 0;

        }
      },
    ],
  },
  {
    scope:          'global',
    id:             'global-business',
    localizedLabel: 'nav.admin.business',
    route:          'global-admin.business',
    resourceScope:  'global',
  },
//  {
//    scope: 'global',
//    id: 'global-advanced',
//    localizedLabel: 'nav.admin.settings.advanced',
//    route: 'global-admin.settings.advanced',
//    disabled: true,
//  },
]

export function initialize(/* appInstance*/) {

  bulkAdd(rootNav);

}

export default {
  name:       'nav',
  initialize,
  after:      'store',
};

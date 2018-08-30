import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { alternateLabel } from 'ui/utils/platform';
import ModalBase from 'ui/mixins/modal-base';
import layout from './template';



export default Component.extend(ModalBase, {
  layout,
  classNames: ['medium-modal'],
  resources: alias('modalService.modalOpts.resources'),
  alternateLabel: alternateLabel,
  settings: service(),
  intl: service(),
  clusterStore:    service(),

  showProtip: function() {
    let show = this.get('modalService.modalOpts.showProtip');
    if ( show === undefined ) {
      show = true;
    }

    return show;
  }.property('modalService.modalOpts.showProtip'),

  actions: {
    confirm: function() {
      const resources = this.get('resources').slice().reverse();
      const k8sStore = this.get('k8sStore') || {}
      const clusterStore = this.get('clusterStore') || {}
      const store = this.get('store') || {}
      async.eachLimit(resources, 5, function(resource, cb) {
        if ( !resource ) {
          return cb();
        }

        if ( resource.cb ) {
          const out = resource.cb();
          if ( out && out.finally ) {
            out.finally(cb);
          } else {
            cb();
          }

          return;
        } else {
          if (resource.type === 'business') {
            resource.delete({url:`${k8sStore.baseUrl}/v3/business/${resource.id}`}).then(() => {
              clusterStore._remove('business', resource)
            }).finally(cb)
          } else if (resource.type === 'huaWeiClusterEventLogSubscriber') {
            resource.delete({url:`${k8sStore.baseUrl}/v3/huaWeiClusterEventLogSubscriber/${resource.id}`}).then(() => {
              clusterStore._remove('huaWeiClusterEventLogSubscriber', resource)
            }).finally(cb)
          } else if (resource.type === 'nodeAutoScaler') {
            resource.delete({url:`${k8sStore.baseUrl}/v3/nodeAutoScaler/${resource.id}`}).then(() => {
              clusterStore._remove('huaWeiClusterEventLogSubscriber', resource)
            }).finally(cb)
          } else if (resource.type === 'workloadAutoScaler') {
            resource.delete({url:`${k8sStore.baseUrl}/v3/workloadAutoScalers/${resource.id}`}).then(() => {
              store._remove('workloadAutoScaler', resource)
            }).finally(cb)
          } else if (resource.type === 'app') {
            const {targetNamespace} = resource
            const namespace = clusterStore.getById('namespace', targetNamespace)
            namespace.delete().then(() => {
              resource.delete().finally(cb);
            }).catch(() => console.log('namespace delete fail'))
          } else {
            resource.delete().finally(cb);
          }
        }
      });

      this.send('cancel');
    },
  },

  isEnvironment: computed('resources', function() {
    return !!this.get('resources').findBy('type','project');
  }),

  isCluster: computed('resources', function() {
    return !!this.get('resources').findBy('type','cluster');
  }),

  didRender: function() {
    setTimeout(() => {
      try {
        this.$('BUTTON')[0].focus();
      } catch (e) {}
    }, 500);
  }
});

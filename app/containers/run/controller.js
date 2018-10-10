import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  growl:        service(),
  scope:        service(),
  modalService: service('modal'),

  queryParams: ['namespaceId', 'workloadId', 'podId', 'addSidekick', 'upgrade', 'launchConfigIndex'],
  namespaceId: null,
  serviceId:   null,
  containerId: null,
  addSidekick: null,
  upgrade:     false,
  deleting:    false,
  dataMap:     alias('model.dataMap'),

  actions: {
    transitionOut() {

      this.transitionToRoute('containers.index', get(this, 'scope.currentProject.id'));

    },

    done() {

      this.send('transitionOut');

    },

    cancel() {

      this.send('transitionOut');


    },

    goback() {

      if (get(this, 'dataMap.workload.secondaryLaunchConfigs.length') > 0) {

        set(this, 'dataMap.selectLaunchConfig', true)
        set(this, 'launchConfigIndex', null)

      } else {

        this.send('transitionOut');

      }

    },

    cancelSidekick() {

      this.send('transitionOut');
      // const secondaryLaunchConfigs = get(this, 'dataMap.workload.secondaryLaunchConfigs') || []
      // console.log(secondaryLaunchConfigs, 'secondaryLaunchConfigs')
      // if (get(this, 'dataMap.workload.secondaryLaunchConfigs.length') > 0) {
      //   set(this, 'dataMap.selectLaunchConfig', true)
      //   set(this, 'launchConfigIndex', null)
      //   set(this, 'addSidekick', null)
      //   set(this, 'upgrade', true)
      // } else {
      //   this.send('transitionOut');
      // }

    },

    promptRemove(idx) {

      let slc = get(this, 'dataMap.workload.secondaryLaunchConfigs').objectAt(idx);
      let resources = [{
        cb:          () => {

          this.removeSidekick(idx)

        },
        displayName: get(slc, 'name'),
      }];

      get(this, 'modalService').toggleModal('confirm-delete', {
        resources,
        showProtip: false
      });

    },
  },

  removeSidekick(idx) {

    let workload = get(this, 'dataMap.workload').clone();

    set(workload, 'completeLaunchConfigs', true);
    set(workload, 'completeUpdate', true);

    let slcs = get(workload, 'secondaryLaunchConfigs');

    slcs.removeAt(idx);
    const containers = [get(workload, 'containers.firstObject')];

    containers.pushObjects(slcs);
    set(workload, 'containers', containers)
    set(this, 'deleting', true);
    workload.save().then(() => {

      this.send('done');
      set(this, 'deleting', false);

    })
      .catch((err) => {

        get(this, 'growl').fromError(err);
        set(this, 'deleting', false);

      });

  },
});

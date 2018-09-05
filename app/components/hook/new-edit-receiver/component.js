import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import {
  set, get, computed, setProperties
} from '@ember/object';
import NewOrEdit from 'ui/mixins/new-or-edit';

export default Component.extend(NewOrEdit, {
  scope:        service(),
  k8sStore:     service(),
  clusterStore: service(),

  layout,
  metricsTypeContent: [{
    label: 'CPU',
    value: 'cpu',
  }, {
    label: 'Memory',
    value: 'memory',
  }, {
    label: 'Custom',
    value: 'custom',
  }],
  advanced:        false,

  receiver:        alias('model.receiver'),
  primaryResource: alias('model.receiver'),
  workloadContent: computed('model.workloads.[]', function() {

    const workloads = get(this, 'model.workloads').content || []

    return workloads.filter((w) => w.projectId === get(this, 'primaryResource.projectId'))
      .map((w) => ({
        label: w.name,
        value: w.id
      }))

  }),

  init() {

    this._super(...arguments)
    const mode = get(this, 'model.mode')
    const primaryResource = get(this, 'primaryResource')

    if (mode === 'new') {

      setProperties(primaryResource, {
        isScaleUp:    false,
        scaleStep:    1,
        minimumScale: 1,
        maximumScale: 100,
        tolerance:    10,
        metricsType:  'cpu',
      })

    }

    if (mode === 'edit') {

      setProperties(primaryResource, {})

    }

  },

  actions: {
    cancel() {

      this.goBack();

    },
  },
  goBack() {

    if (get(this, 'model.pageScope') === 'project') {

      get(this, 'router').transitionTo('authenticated.project.hooks.index')

    } else {

      get(this, 'router').transitionTo('authenticated.cluster.hooks.index')

    }

  },

  validate() {

    set(this, 'errors', null)
    let errors = get(this, 'errors') || []
    const name = get(this, 'primaryResource.name')
    const metricsCondition = get(this, 'primaryResource.metricsCondition')
    const pageScope = get(this, 'model.pageScope')
    const workloadId = get(this, 'primaryResource.workloadId')

    if (!name) {

      errors.pushObject('Name is required')

    }
    if (!metricsCondition) {

      errors.pushObject('Metrics Condition is required')

    }
    if (pageScope === 'project') {

      if (!workloadId) {

        errors.pushObject('Workload is required')

      }

    }
    set(this, 'errors', errors)

    return errors.length > 0 ? false : true

  },

  doSave() {

    const k8sStore = get(this, 'k8sStore')
    let url = ``
    const currentPageScope = get(this, 'scope.currentPageScope')

    if (currentPageScope === 'project') {

      url = `${ k8sStore.baseUrl }/v3/workloadautoscalers`

    } else {

      url = `${ k8sStore.baseUrl }/v3/nodeAutoScaler`

    }

    if (get(this, 'model.mode') === 'edit') {

      url += `/${ get(this, 'primaryResource.id') }`

    }

    return get(this, 'primaryResource').save({ url, })
      .then((newData) => {

        return this.mergeResult(newData);

      })
      .catch((err) => this.send('error', err));

  },

  doneSaving() {

    this.goBack();

  },

});

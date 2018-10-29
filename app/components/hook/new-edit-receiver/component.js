import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias, reads } from '@ember/object/computed';
import {
  set, get, computed, setProperties
} from '@ember/object';
import NewOrEdit from 'ui/mixins/new-or-edit';

const metricsType = [{
  label: 'CPU',
  value: 'cpu',
}, {
  label: 'Memory',
  value: 'memory',
}]

export default Component.extend(NewOrEdit, {
  scope:        service(),
  k8sStore:     service(),
  clusterStore: service(),
  pageScope:    reads('scope.currentPageScope'),

  layout,
  metricsTypeContent: computed('model.autoScalerTemplates.[]', 'pageScope', function() {
    const pageScope = get(this, 'pageScope')
    const autoScalerTemplates = (get(this, 'model.autoScalerTemplates') || []).filter(f => {
      if (pageScope === 'cluster') {
        return f.templateType === 'Node'
      }
      if (pageScope === 'project') {
        return f.templateType === 'Pod'
      }
      return true
    }).map(a => ({
      label: a.name,
      value: a.name,
    }))
    return [...metricsType, ...autoScalerTemplates]
  }),
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

      const metricsType = get(this, 'primaryResource.metricsType')
      if (metricsType !== 'cpu' || metricsType !== 'memory') {
        const autoScalerTemplates = get(this, 'model.autoScalerTemplates') || []
        const filter = autoScalerTemplates.filter(a => a.templateInstance === metricsType)
        if (filter[0] && filter[0].name) {
          set(this, 'primaryResource.metricsType', filter[0].name)
        }
      }

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

  format() {
    const metricsType = get(this, 'primaryResource.metricsType')
    if (metricsType !== 'cpu' || metricsType !== 'memory') {
      const autoScalerTemplates = get(this, 'model.autoScalerTemplates') || []
      const filter = autoScalerTemplates.filter(a => a.name === metricsType)
      if (filter[0] && filter[0].templateInstance) {
        set(this, 'primaryResource.metricsType', filter[0].templateInstance)
      }
    }
  },

  doSave() {

    this.format()
    const k8sStore = get(this, 'k8sStore')
    let url = ``
    const currentPageScope = get(this, 'scope.currentPageScope')

    if (currentPageScope === 'project') {

      url = `${ k8sStore.baseUrl }/workloadautoscalers`

    } else {

      url = `${ k8sStore.baseUrl }/nodeAutoScaler`

    }

    if (get(this, 'model.mode') === 'edit') {

      url += `/${ get(this, 'primaryResource.id') }`

    }

    return get(this, 'primaryResource').save({ url, })
      .then((newData) => {
        this.goBack();
        return this.mergeResult(newData);

      })
      .catch((err) => {
        this.format()
        this.send('error', err)}
      );

  },

  doneSaving() {



  },

});

import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { alias } from '@ember/object/computed';
import {
  set, get, setProperties
} from '@ember/object';
import NewOrEdit from 'ui/mixins/new-or-edit';

const resourceTypeContent = [
  {
    label: 'Pod',
    value: 'Pod',
  },
  {
    label: 'Node',
    value: 'Node',
  },
]

export default Component.extend(NewOrEdit, {
  scope:    service(),
  k8sStore: service(),

  layout,
  subscriber:      alias('model.subscriber'),
  primaryResource: alias('model.subscriber'),
  resourceTypeContent,

  init() {

    this._super(...arguments)
    const mode = get(this, 'model.mode')

    if (mode === 'new') {

      setProperties(this, {
        'subscriber.clusterId':                get(this, 'scope.currentCluster.id'),
        'subscriber.expectedHttpResponseCode': 200,
        'subscriber.attachHttpRequestHeader':  {},
        'subscriber.resourceType':             'Pod',
      })

    }

  },

  actions: {
    updateData(map) {

      set(this, 'subscriber.attachHttpRequestHeader', map);

    },

    cancel() {

      this.goBack();

    },
  },
  goBack() {

    get(this, 'router').transitionTo('authenticated.cluster.subscriber.index');

  },

  validate() {

    set(this, 'errors', null)
    let errors = get(this, 'errors') || []
    const name = get(this, 'subscriber.name')
    const subscriptionAddress = get(this, 'subscriber.subscriptionAddress')

    if (!name) {

      errors.pushObject('Name is required')

    }
    if (!subscriptionAddress) {

      errors.pushObject('Subscription Address is required')

    }
    set(this, 'errors', errors)

    return errors.length > 0 ? false : true

  },

  doSave() {

    const k8sStore = get(this, 'k8sStore')
    let url = `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLogSubscriber`

    if (get(this, 'model.mode') === 'edit') {

      url += `/${ get(this, 'subscriber.id') }`

    }

    return get(this, 'primaryResource').save({ url, })
      .then((newData) => {

        return this.mergeResult(newData);

      }).catch(err => this.send('error', err););

  },

  doneSaving() {

    this.goBack();

  },

});

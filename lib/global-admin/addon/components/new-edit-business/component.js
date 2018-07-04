import { alias, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import NewOrEdit from 'ui/mixins/new-or-edit';
import C from 'ui/utils/constants';
import layout from './template';
import { get, computed, set } from '@ember/object';
import ChildHook from 'shared/mixins/child-hook';
import { isEmpty } from '@ember/utils';

const ruleVerbs = C.RULE_VERBS.map(verb => `rolesPage.new.form.allow.${verb}`);

const BASIC_CONTEXT = [
  {
    label: 'All',
    value: '',
  },
  {
    label: 'Project',
    value: 'project',
  },
  {
    label: 'Cluster',
    value: 'cluster',
  },
];

const MEMBER_CONFIG = {
  type: 'clusterRoleTemplateBinding',
};

export default Component.extend(NewOrEdit, ChildHook, {
  layout,
  intl: service(),
  router: service(),
  k8sStore: service(),
  model: null,

  business: alias('model.business'),
  ruleArray: null,
  roleArray: null,
  readOnly: null,
  contexts: BASIC_CONTEXT,
  ruleVerbs,
  memberConfig: MEMBER_CONFIG,
  newBusiness: false,

  init() {
    this._super(...arguments);
    let editing = get(this, 'editing');
    if ( !editing ) {
      const config = this.get('k8sStore').createRecord({
        type: 'business',
        nodeCount: 0,
      });

      set(this, 'model.business', config);
    }

    if ( isEmpty(get(this, 'business.id')) ){
      set(this, 'newBusiness', true);
    }
  },

  validation() {
    set(this, 'errors', null)
    let errors = get(this, 'errors') || []
    const name = get(this, 'business.name')
    if (!name) {
      errors.pushObject('Name is required')
    }
    set(this, 'errors', errors)
  },

  actions: {
    save(cb) {
      this.validation()
      if (get(this, 'errors.length') > 0) {
        cb()
        return
      }
      const business = get(this, 'business')
      const k8sStore = get(this, 'k8sStore') || {}
      let url = ''
      if (get(this, 'editing')) {
        url = `${k8sStore.baseUrl}/v3/business/${business.id}`
      } else {
        url = `${k8sStore.baseUrl}/v3/business`
      }
      business.save({url}).then(() => {
        this.send('cancel')
      }).catch(() => {
        console.log('fail')
      }).finally(() => {
        cb()
      })
    },
    cancel() {
      this.goBack();
    },
    setLabels(labels) {
      let obj = {}
      labels.map(l => {
        if (l.key && l.value) {
          obj[l.key] = l.value
        }
      })
      set(this, 'business.labels', obj)
    },
    addCluster() {
      get(this, 'router').transitionTo('global-admin.business.new-cluster');
    },
  },

  goBack() {
    get(this, 'router').transitionTo('global-admin.business.index');
  },

  doneSaving() {
    this.goBack();
  },
});

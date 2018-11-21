import Component from '@ember/component';
import { reads, alias } from '@ember/object/computed';
import { get, set, observer } from '@ember/object'
import NewOrEdit from 'ui/mixins/new-or-edit';
import { inject as service } from '@ember/service'

export default Component.extend(NewOrEdit, {
  router:       service(),
  intl:         service(),
  globalStore:  service(),
  scope:        service(),
  showAdvanced: false,
  errors:       null,
  pods:         null,
  workloads:    null,

  pageScope: reads('scope.currentPageScope'),
  newAlert:    alias('resourceMap.newAlert'),
  metrics:    alias('resourceMap.metrics'),

  actions: {
    showAdvanced() {
      this.set('showAdvanced', true);
    },

    save(cb) {
      set(this, 'errors', null);
      const ps = get(this, 'pageScope');
      let toSaveAlert;

      if (ps === 'cluster') {
        toSaveAlert = this.beforeSaveClusterAlert();
      } else {
        toSaveAlert = this.beforeSaveProjectAlert();
      }
      if (get(this, 'errors') && get(this, 'errors').length > 0) {
        cb();

        return;
      }
      set(this, 'primaryResource', toSaveAlert);
      this._super(cb);
    },

    cancel() {
      const ps = get(this, 'pageScope');
      const router = get(this, 'router');

      if (ps === 'cluster') {
        router.transitionTo('authenticated.cluster.alert.index');
      } else {
        router.transitionTo('authenticated.project.alert.index');
      }
    },
  },
  initialWaitSecondsObersver: observer('newAlert._targetType', 'newAlert.eventRule.resourceKind', function(){
    const rk = get(this, 'newAlert.eventRule.resourceKind');
    const t = get(this, 'newAlert._targetType');

    if (t === 'normalEvent' && rk === 'Pod') {
      set(this, 'newAlert.initialWaitSeconds', 1)
    }
  }),

  validateRecipients(alert, errors) {
    const recipients = alert.get('recipients');
    const filteredRecipients = recipients.filter((r) => !!r.notifierId);

    if (filteredRecipients.length === 0) {
      errors.push(['Recipient required']);
    } else {
      alert.set('recipients', filteredRecipients);
    }
  },
  beforeSaveProjectAlert() {
    const newAlert = get(this, 'newAlert');
    const t = newAlert.get('_targetType');
    const clone = newAlert.clone();
    const errors = [];

    // project _targetType:
    // 1. workload
    // 2. workloadSelector
    // 3. Pod
    if (t === 'workload') {
      const type = clone.get('targetWorkload.workloadType');

      clone.setProperties({
        targetPod:                 null,
        'targetWorkload.selector': null,
        'targetWorkload.type':     type,
      });
    }
    if (t === 'workloadSelector') {
      const type = clone.get('targetWorkload.workloadSelectorType');
      const selector = clone.get('targetWorkload.selector') || {};
      const keys = Object.keys(selector);

      if (keys.length === 0) {
        errors.push('Workload selector required');
      }
      clone.setProperties({
        targetPod:                   null,
        'targetWorkload.workloadId': null,
        'targetWorkload.type':       type,
      });
    }
    if (t === 'pod') {
      clone.setProperties({ targetWorkload: null, });
    }
    this.validateRecipients(clone, errors);
    set(this, 'errors', errors);

    return clone;
  },

  beforeSaveClusterAlert() {
    // cluster _targetType:
    // 1. node
    // 2. nodeSelector
    // 3. systemService
    // 4. k8s event
    const newAlert = get(this, 'newAlert');
    const t = newAlert.get('_targetType');
    const clone = newAlert.clone();
    const errors = [];
    const intl = get(this, 'intl');
    console.log(t, 't')
    // for node and nodeSelector, there's no way to validate
    // the user input just bese on the schema, so need to check it manually.
    if (t === 'node') {
      if (!get(clone, 'nodeRule.nodeId')) {
        errors.push(intl.t('alertPage.newOrEdit.nodeRequired'));
      }
      clone.setProperties({
        'nodeRule.selector': null,
        systemServiceRule:   null,
        eventRule:           null,
        metricRule: null,
      });
    }

    if (t === 'nodeSelector') {
      const selector = get(clone, 'nodeRule.selector') || {};
      const keys = Object.keys(selector);

      if (keys.length === 0) {
        // check there is at least one node selector.
        errors.push(intl.t('alertPage.newOrEdit.nodeSelectorRequired'));
      }
      clone.setProperties({
        'nodeRule.nodeId': null,
        systemServiceRule: null,
        eventRule:         null,
        metricRule: null,
      });
    }

    if (t === 'systemService') {
      clone.setProperties({
        nodeRule:  null,
        eventRule: null,
        metricRule: null,
      });
    }

    if (t === 'warningEvent' || t === 'normalEvent') {
      clone.setProperties({
        nodeRule:          null,
        systemServiceRule: null,
        metricRule: null,
      });
    }

    if (t === 'expression') {
      clone.setProperties({
        nodeRule:          null,
        systemServiceRule: null,
        eventRule: null,
      });
    }

    this.validateRecipients(clone, errors);
    set(this, 'errors', errors);

    return clone;
  },

  doneSaving() {
    this.send('cancel');
  },

});

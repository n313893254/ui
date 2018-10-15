import Component from '@ember/component';
import { reads, alias } from '@ember/object/computed';
import { get, set, observer, setProperties } from '@ember/object'
import NewOrEdit from 'ui/mixins/new-or-edit';
import { inject as service } from '@ember/service'
import { all as PromiseAll, resolve } from 'rsvp';

export default Component.extend(NewOrEdit, {
  router:       service(),
  intl:         service(),
  globalStore:  service(),
  scope:        service(),
  showAdvanced: false,
  errors:       null,
  pods:         null,
  workloads:    null,

  pageScope:  reads('scope.currentPageScope'),
  newAlert:    alias('resourceMap.newAlert'),
  metrics:    alias('resourceMap.metrics'),
  alertGroup:    alias('resourceMap.alertGroup'),
  alertRules:    alias('resourceMap.alertRules'),

  actions: {
    showAdvanced() {
      this.set('showAdvanced', true);
    },

    save(cb) {
      set(this, 'errors', null);
      const ps = get(this, 'pageScope');
      let toSaveAlert;

      if (ps === 'cluster') {
        toSaveAlert = get(this, 'alertGroup').clone()
        set(toSaveAlert, 'clusterId', get(this, 'scope.currentCluster.id'))
      } else {
        toSaveAlert = get(this, 'alertGroup').clone()
        set(toSaveAlert, 'projectId', get(this, 'scope.currentProject.id'))
      }
      if (get(this, 'errors') && get(this, 'errors').length > 0) {
        cb();

        return;
      }
      set(this, 'primaryResource', toSaveAlert);

      cb = cb || function() {};

      // Will save can return true/false or a promise
      resolve(this.willSave()).then((ok) => {
        if ( !ok ) {
          // Validation or something else said not to save
          cb(false);

          return;
        }

        this.doSave()
          .then((group) => {
            const obj = {}
            const alertRules = get(this, 'alertRules').map((a) => {
              let newAlert = {}

              if (ps === 'cluster') {
                newAlert = this.beforeSaveClusterAlert(a, group)
              } else {
                console.log(a)
                newAlert = this.beforeSaveProjectAlert(a, group)
              }

              return newAlert
            })

            return PromiseAll(alertRules.map((a) => a.save()))
          })
          .then(this.didSave.bind(this))
          .then(this.doneSaving.bind(this))
          .then(() => {
            cb(true);
          })
          .catch((err) => {
            this.send('error', err);
            this.errorSaving(err);
            cb(false);
          });
      });
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
  beforeSaveProjectAlert(alertRule, group) {
    const clone = alertRule.clone();
    const t = get(alertRule, '_targetType');
    const errors = [];

    setProperties(clone, {
      projectId: get(this, 'scope.currentProject.id'),
      groupId:   group.id,
    })
    // project _targetType:
    // 1. workload
    // 2. workloadSelector
    // 3. Pod
    if (t === 'workload') {
      const type = clone.get('workloadRule.workloadType');

      clone.setProperties({
        podRule:                 null,
        'workloadRule.selector': null,
        'workloadRule.type':     type,
        metricRule:              null,
      });
    }
    if (t === 'workloadSelector') {
      const type = clone.get('workloadRule.workloadSelectorType');
      const selector = clone.get('workloadRule.selector') || {};
      const keys = Object.keys(selector);

      if (keys.length === 0) {
        errors.push('Workload selector required');
      }
      clone.setProperties({
        podRule:                   null,
        'workloadRule.workloadId': null,
        'workloadRule.type':       type,
        metricRule:                null,
      });
    }
    if (t === 'pod') {
      clone.setProperties({
        workloadRule: null,
        metricRule:   null,
      });
    }
    // this.validateRecipients(clone, errors);
    set(this, 'errors', errors);

    return clone;
  },

  beforeSaveClusterAlert(alertRule, group) {
    // cluster _targetType:
    // 1. node
    // 2. nodeSelector
    // 3. systemService
    // 4. k8s event
    const clone = alertRule.clone();

    setProperties(clone, {
      clusterId: get(this, 'scope.currentCluster.id'),
      groupId:   group.id,
    })
    // console.log(alertRule, 'alertRule')
    const t = alertRule.get('_targetType');
    // set(clone, 'clusterRules', get(this, 'alertRules'))
    const errors = [];
    const intl = get(this, 'intl');

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
        metricRule:          null,
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
        metricRule:        null,
      });
    }

    if (t === 'systemService') {
      clone.setProperties({
        nodeRule:   null,
        eventRule:  null,
        metricRule: null,
      });
    }

    if (t === 'warningEvent' || t === 'normalEvent') {
      clone.setProperties({
        nodeRule:          null,
        systemServiceRule: null,
        metricRule:        null,
      });
    }

    if (t === 'expression') {
      clone.setProperties({
        nodeRule:          null,
        systemServiceRule: null,
        eventRule:         null,
      });
    }

    // this.validateRecipients(clone, errors);
    set(this, 'errors', errors);

    return clone;
  },

  doneSaving() {
    this.send('cancel');
  },

});

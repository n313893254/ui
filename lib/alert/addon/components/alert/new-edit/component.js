import Component from '@ember/component';
import { reads, alias } from '@ember/object/computed';
import { get, set, observer } from '@ember/object'
import NewOrEdit from 'ui/mixins/new-or-edit';
import { inject as service } from '@ember/service'
import { all as PromiseAll, resolve } from 'rsvp';
import AlertRule from 'alert/mixins/alert-rule';

export default Component.extend(NewOrEdit, AlertRule, {
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
      const errors = get(this, 'errors') || []

      if (ps === 'cluster') {
        toSaveAlert = get(this, 'alertGroup').clone()
        set(toSaveAlert, 'clusterId', get(this, 'scope.currentCluster.id'))
      } else {
        toSaveAlert = get(this, 'alertGroup').clone()
        set(toSaveAlert, 'projectId', get(this, 'scope.currentProject.id'))
      }
      this.validateRecipients(toSaveAlert, errors)
      set(this, 'errors', errors)
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
            const alertRules = get(this, 'alertRules').map((a) => {
              let newAlert = {}

              if (ps === 'cluster') {
                newAlert = this.beforeSaveClusterAlert(a, group)
              } else {
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
    const recipients = get(alert, 'recipients');
    const filteredRecipients = recipients.filter((r) => !!r.notifierId);

    if (filteredRecipients.length === 0) {
      errors.push(['Recipient required']);
    } else {
      set(alert, 'recipients', filteredRecipients);
    }
  },

  doneSaving() {
    this.send('cancel');
  },

});

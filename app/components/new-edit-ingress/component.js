import { resolve } from 'rsvp';
import {
  get, set, computed, setProperties
} from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import NewOrEdit from 'shared/mixins/new-or-edit';
import layout from './template';

const TARGET_TYPE = [{
  label: 'ip',
  value: 'ip',
}, {
  label: 'instance',
  value: 'instance',
}]

export default Component.extend(NewOrEdit, {
  intl:  service(),
  scope: service(),

  layout,
  ingress:                null,
  editing:                null,
  existing:               null,
  namespacedCertificates: null,
  certificates:           null,

  targetTypeContent: TARGET_TYPE,

  isGKE:   alias('scope.currentCluster.isGKE'),
  isCCE:   alias('scope.currentCluster.isCCE'),
  isEKS:   alias('scope.currentCluster.isEKS'),
  isLocal: alias('scope.currentCluster.isLocal'),

  primaryResource: alias('ingress'),
  headerLabel:     computed('intl.locale', 'existing', function() {

    let k;

    if (get(this, 'existing')) {

      k = 'newIngress.header.edit';

    } else {

      k = 'newIngress.header.add';

    }

    return get(this, 'intl').t(k);

  }),

  init() {

    this._super(...arguments)
    const annotations = get(this, 'ingress.annotations') || {}

    if (get(this, 'isCCE')) {

      setProperties(this, {
        eipIp:   annotations['kubernetes.io/elb.ip'] || null,
        eipPort: annotations['kubernetes.io/elb.port'] || null,
      })

    }
    if (get(this, 'isEKS') && !get(this, 'isLocal')) {

      setProperties(this, {
        targetType:     annotations['alb.ingress.kubernetes.io/target-type'] || null,
        listenPorts:    annotations['alb.ingress.kubernetes.io/listen-ports'] || null,
      })

      let subnets = (annotations['alb.ingress.kubernetes.io/subnets'] || '').split(',')
      let securityGroups = (annotations['alb.ingress.kubernetes.io/security-groups'] || '').split(',')
      const eksResources = get(this, 'eksResources')
      let mapSubnets = {}
      let mapSecurityGroups = {};

      (eksResources.subnets || []).map((s) => {

        const subnetId = s.split(':')[1]

        mapSubnets[subnetId] = s

      });
      (eksResources.securityGroups || []).map((s) => {

        const securityGroupId = s.split(':')[1]

        mapSecurityGroups[securityGroupId] = s

      });
      if (subnets) {

        set(this, 'subnets', subnets.map((s) => mapSubnets[s]))

      }
      if (securityGroups) {

        set(this, 'securityGroups', securityGroups.map((s) => mapSecurityGroups[s]))

      }

    }

  },

  actions: {
    done() {

      this.sendAction('done');

    },
    cancel() {

      this.sendAction('cancel');

    },

    setLabels(labels) {

      let out = {};

      labels.forEach((row) => {

        out[row.key] = row.value;

      });

      set(this, 'ingress.labels', out);

    },
  },

  willSave() {

    let pr = get(this, 'primaryResource');

    // Namespace is required, but doesn't exist yet... so lie to the validator
    let nsId = get(pr, 'namespaceId');

    set(pr, 'namespaceId', '__TEMP__');
    let ok = this.validate();

    set(pr, 'namespaceId', nsId);

    let annotations = get(this, 'ingress.annotations') || {}

    if (get(this, 'isCCE')) {

      if (get(this, 'eipIp')) {

        Object.assign(annotations, { 'kubernetes.io/elb.ip': get(this, 'eipIp'), })

      }
      if (get(this, 'eipPort')) {

        Object.assign(annotations, { 'kubernetes.io/elb.port': `${ get(this, 'eipPort') }`, })

      }

    }

    if (get(this, 'isEKS') && !get(this, 'isLocal')) {

      if (get(this, 'targetType')) {

        Object.assign(annotations, { 'alb.ingress.kubernetes.io/target-type': get(this, 'targetType'), })

      }
      if (get(this, 'listenPorts')) {

        Object.assign(annotations, { 'alb.ingress.kubernetes.io/listen-ports': `${ get(this, 'listenPorts') }`, })

      }
      if (get(this, 'subnets')) {

        const value = get(this, 'subnets').map((s) => {

          return s.split(':')[1]

        })

        Object.assign(annotations, { 'alb.ingress.kubernetes.io/subnets': `${ value }`, })

      }
      if (get(this, 'securityGroups')) {

        const value = get(this, 'securityGroups').map((s) => {

          return s.split(':')[1]

        })

        Object.assign(annotations, { 'alb.ingress.kubernetes.io/security-groups': `${ value }`, })

      }

    }

    set(this, 'ingress.annotations', annotations)

    return ok;

  },

  doSave() {

    let pr = get(this, 'primaryResource');

    let namespacePromise = resolve();

    if (!get(this, 'existing')) {

      // Set the namespace ID
      if (get(this, 'namespace.id')) {

        set(pr, 'namespaceId', get(this, 'namespace.id'));

      } else if (get(this, 'namespace')) {

        namespacePromise = get(this, 'namespace').save()
          .then((newNamespace) => {

            set(pr, 'namespaceId', get(newNamespace, 'id'));

            return newNamespace.waitForState('active');

          });

      }

    }

    let self = this;
    let sup = self._super;

    return namespacePromise.then(() => sup.apply(self, arguments));

  },

  validate() {

    let intl = get(this, 'intl');

    let pr = get(this, 'primaryResource');
    let errors = pr.validationErrors() || [];

    errors.pushObjects(get(this, 'namespaceErrors') || []);

    if (!get(this, 'ingress.rules.length') && !get(this, 'ingress.defaultBackend')) {

      errors.push(intl.t('newIngress.error.noRules'));

    }
    if (get(this, 'ingress.rules.length')) {

      const invalid = get(this, 'ingress.rules').some((rule) => {

        const paths = [];

        Object.keys(rule.paths).forEach((key) => {

          paths.push(rule.paths[key]);

        });

        return paths.some((path) => !path.targetPort)

      });

      if (invalid) {

        errors.push(intl.t('validation.required', { key: intl.t('generic.port') }));

      }

    }

    if (errors.length) {

      set(this, 'errors', errors.uniq());

      return false;

    }

    return true;

  },

  doneSaving() {

    this._super(...arguments);
    this.send('done');

  },
});

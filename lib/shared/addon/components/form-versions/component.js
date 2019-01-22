import Component from '@ember/component';
import layout from './template';
import { get, set, computed, setProperties } from '@ember/object';
import C from 'shared/utils/constants';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { satisfies, maxSatisfying } from 'shared/utils/parse-version';
import { sortVersions } from 'shared/utils/sort';
import { scheduleOnce } from '@ember/runloop';
import { lt, gt }  from 'semver';
import Semver from 'semver';

export default Component.extend({
  settings: service(),
  intl:     service(),

  layout,

  cluster:                null,
  versionChoices:         null,
  versions:               null,
  initialVersion:         null,
  editing:                false,
  value:                  null,

  defaultK8sVersionRange: alias(`settings.${ C.SETTING.VERSION_SYSTEM_K8S_DEFAULT_RANGE }`),
  supportedVersionsRange: alias(`settings.${ C.SETTING.VERSION_K8S_SUPPORTED_RANGE }`),

  init() {
    this._super(...arguments);

    scheduleOnce('afterRender', () => {
      this.initVersions();
    });
  },

  isRke: computed('cluster', function() {
    const { cluster } = this;

    if (get(cluster, 'rancherKubernetesEngineConfig')) {
      return true;
    }

    return false;
  }),

  initVersions() {
    const {
      defaultK8sVersionRange, versions, supportedVersionsRange, editing, initialVersion
    } = this;

    let maxVersion = maxSatisfying(versions, defaultK8sVersionRange);
    maxVersion = Semver.coerce(maxVersion).version
    console.log(maxVersion, 'maxVersion')
    if (!editing && defaultK8sVersionRange) {
      if (maxVersion) {
        set(this, 'value', maxVersion);
      }
    }

    let out = versions;

    if ( !out.includes(initialVersion) && editing ) {
      out.unshift(initialVersion);
    }

    set(this, 'versionChoices', sortVersions(out).reverse().map((v) => {
      let label = v;
      let out   = null;

      console.log(v, maxVersion, 'sdfsdf')
      const poi = Semver.coerce(v).version
      console.log(poi, 'poi')
      if (gt(poi, maxVersion)) {
        label = `${ v } ${ this.intl.t('formVersions.experimental') }`
      }
      console.log('if (gt(poi, maxVersion)) {')
      out = {
        label,
        value: v
      };
      console.log(supportedVersionsRange, 'supportedVersionsRange')
      console.log(!satisfies(poi, supportedVersionsRange), '!satisfies(poi, supportedVersionsRange)')
      console.log(initialVersion, 'initialVersion')
      console.log(lt(poi, initialVersion), 'lt(poi, initialVersion)')
      if ((supportedVersionsRange && !satisfies(poi, supportedVersionsRange) ) || (editing && initialVersion && lt(poi, initialVersion))) {
        if (!gt(poi, maxVersion)) {
          setProperties(out, {
            disabled: true,
            label:    `${ label } ${ this.intl.t('formVersions.unsupported') }`,
          });
        }
      }
      console.log(out, 'sdffsd')
      return out;
    }));
  },
});

import { get, set, computed } from '@ember/object'
import EmberObject from '@ember/object';
import Mixin from '@ember/object/mixin';

const DEFAULT_TARGET_TYPE = 'none';

export default Mixin.create({
  // needs to override the type props
  type: null,

  patch() {
    const t = get(this, 'targetType');
    const store = get(this, 'store');

    const nue = store.createRecord({ type: this.get('type'), });

    const map = EmberObject.create({});

    const loggingTagets = [
      'kafka',
      'elasticsearch',
      'splunk',
      'syslog',
      'fluentForwarder',
      'customTarget',
    ];

    loggingTagets.forEach((key) => {
      let config

      if (key === 'fluentForwarder') {
        config = store.createRecord({ type: `fluentForwarderConfig`, });
      } else {
        config = store.createRecord({ type: `${ key }Config`, });
      }

      nue.set('config', config);
      set(map, key, nue.clone());
    });

    this.setProperties(map);
    if (t && t !== 'none') {
      set(this, `${ t }.config`, get(this, `${ t }Config`));
      set(this, `${ t }.outputFlushInterval`, get(this, 'outputFlushInterval'));
      set(this, `${ t }.outputTags`, get(this, 'outputTags'));
      set(this, `${ t }.dockerRootDir`, get(this, 'dockerRootDir'));
      set(this, `${ t }.excludeSystemComponent`, get(this, 'excludeSystemComponent'));
    }

    return this;
  },

  targetType: computed('elasticsearchConfig', 'splunkConfig', 'kafkaConfig', 'syslogConfig', 'fluentForwarderConfig', 'customTargetConfig', function() {
    const es = get(this, 'elasticsearchConfig');
    const splunk = get(this, 'splunkConfig');
    const kafka = get(this, 'kafkaConfig');
    const syslog = get(this, 'syslogConfig');
    const fluentd = get(this, 'fluentForwarderConfig');
    const customTarget = get(this, 'customTargetConfig');

    if (es) {
      return 'elasticsearch';
    }
    if (splunk) {
      return 'splunk';
    }
    if (syslog) {
      return 'syslog';
    }
    if (kafka) {
      return 'kafka';
    }
    if (fluentd) {
      return 'fluentForwarder'
    }
    if (customTarget) {
      return 'customTarget'
    }

    return DEFAULT_TARGET_TYPE;
  }),
});

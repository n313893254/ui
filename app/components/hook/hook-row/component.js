import { or } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { computed, get } from '@ember/object';

export default Component.extend({
  scope:          service(),
  session:           service(),

  layout,
  model:             null,
  tagName:           '',
  subMatches:        null,
  expanded:          null,

  showInstanceCount: true,
  showImage:         true,

  canExpand:    true,

  showLabelRow:      or('model.displayUserLabelStrings.length'),
  logString:    computed('model', function() {

    const model = get(this, 'model')

    return `{
  "clusterEventId": ${ model.clusterEventId },
  "count": ${ model.count },
  "created": ${ model.created },
  "createdTS": ${ model.createdTS },
  "eventType": ${ model.eventType },
  "id": ${ model.id },
  "message": ${ model.message },
  "namespaceId": ${ model.namespaceId },
  "reason": ${ model.reason },
  "resourceKind": ${ model.resourceKind },
  "resourceName": ${ model.resourceName },
  "source": {
    "component": ${ model.component },
    "host": ${ model.host }
  }
}`

  }),

  metricsType: computed('model.metricsType', function() {

    const metricsType = get(this, 'model.metricsType')

    if (metricsType !== 'cpu' || metricsType !== 'memory') {

      const autoScalerTemplates = get(this, 'autoScalerTemplates') || []

      console.log(autoScalerTemplates, 'autoScalerTemplates')
      const filter = autoScalerTemplates.filter((a) => a.templateInstance === metricsType)

      if (filter[0] && filter[0].name) {

        return filter[0].name

      }

    }

    return metricsType

  }),

  actions: {
    toggle() {

      this.sendAction('toggle');

    },
  },
});

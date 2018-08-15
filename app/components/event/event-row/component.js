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

    console.log(model, 'model')
    const { attachPod = {} } = model
    let tplAttachPod = ``

    for (let key in attachPod) {

      if (key === 'status') {

        continue

      }
      tplAttachPod += `
    ${ key }: ${ attachPod[key] },`

    }

    return `{
  "attachPod": {${ tplAttachPod }
  },
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
  "resourceName": ${ model.resourceName }
}`

  }),

  actions: {
    toggle() {

      this.sendAction('toggle');

    },
  },
});

import Resource from 'ember-api-store/models/resource';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { ucFirst } from 'shared/utils/util';
import C from 'ui/utils/constants';
import alertMixin from 'ui/mixins/model-alert';

export default Resource.extend(alertMixin, {
  type: 'clusteralertgroup',

  init(...args) {
    this._super(...args);
  },
});

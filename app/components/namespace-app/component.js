import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';
import {
  get, set, computed, setProperties, observer
} from '@ember/object';

export default Component.extend({
  scope:         service(),
  layout,
  classNames:    ['namespace-app'],
  srcSet:        false,
  latestVersion: null,

  filterWorkloads: computed('pods.[]', 'model.targetNamespace', function() {

    const filter = get(this, 'workloads').filter((w) => w.namespaceId === get(this, 'model.targetNamespace'))

    return filter.length > 0 ? filter[0] : []

  }),
  didRender() {

    if (!this.get('srcSet')) {

      this.set('srcSet', true);
      var $icon = this.$('.catalog-icon > img');

      $icon.attr('src', $icon.data('src'));
      this.$('img').on('error', () => {

        $icon.attr('src', `${ this.get('app.baseAssets') }assets/images/generic-catalog.svg`);

      });

    }

  },

});

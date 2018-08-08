import { inject as service } from '@ember/service';
import C from 'ui/utils/constants';
import { get, set, computed, observer } from '@ember/object';
import { task, timeout } from 'ember-concurrency';
import { isBlank } from '@ember/utils';
import SearchableSelect from '../searchable-select/component';
import { alias } from '@ember/object/computed';
import { later } from '@ember/runloop';
import { on } from '@ember/object/evented';
import { isAlternate, isMore, isRange } from 'ui/utils/platform';

const DEBOUNCE_MS = 250;
export default SearchableSelect.extend({
  classNames:     'principal-search',
  globalStore:    service(),
  errors:         null,
  content:        alias('filteredPrincipals'),
  value:          alias('filter'),
  _principals:    null,
  useLabel:       null,
  showDropdownArrow: false,
  k8sStore:       service(),

  clientSideFiltering: false,
  loading: false,
  focused: false,
  selectExactOnBlur: true,
  includeLocal: true,

  init() {
    this._super(...arguments);
  },

  didInsertElement() {
    //Explicitly not calling super here to not show until there's content this._super(...arguments);

    this.$('input').on('focus', () => {
      if (this.isDestroyed || this.isDestroying) {
        return;
      }

      set(this, 'focused', true);
      const term = get(this,'value');
      if ( term ) {
        set(this, '_pods', []);
        get(this, 'search').perform(term);
        this.send('show');
      }
    });

    this.$('input').on('blur', () => {
      later(() => {
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        set(this, 'focused', false);
        if ( get(this, 'selectExactOnBlur') ) {
          this.scheduleSend();
        }

        this.send('hide');
      }, 250);
    });
  },

  scheduleSend() {
    if ( get(this, 'loading') ) {
      set(this, 'sendExactAfterSearch', true);
    } else {
      set(this, 'sendExactAfterSearch', false);
      this.sendSelectExact();
    }
  },

  sendSelectExact() {
    const value = get(this,'value');
    const match = get(this,'filteredPrincipals').findBy('label', value);

    let principal = null;
    if ( match ) {
      principal = match.principal;
    } else {
      set(this, 'value', '');
    }

    this.sendAction('selectExact', principal);
    this.send('hide');
  },

  sendAfterLoad: false,

  filteredPrincipals: computed('_pods.[]', 'namespaceId', function() {
    const namespaces = get(this, '_pods') || {}
    const namespaceId = get(this, 'namespaceId')
    const resourceKind = get(this, 'resourceKind')
    let res = []

    if (resourceKind === 'Pod') {
      if (namespaceId === 'poi-all' || !namespaceId) {
        for (let key in namespaces) {
          const pods = namespaces[key] || []
          res = [...res, ...pods]
        }
      } else {
        res = [...res, ...(namespaces[namespaceId] || [])]
      }
    }

    if (resourceKind === 'Node') {
      res = [...namespaces]
    }

    return res.map(r => ({label: r, value: r}))
  }),

  metas: computed(function() {
    return Object.keys(C.KEY).map(k => C.KEY[k]);
  }),

  actions: {
    search(term, e) {
      const kc = e.keyCode;
      this.send('show');
      if ( kc === C.KEY.CR || kc === C.KEY.LF ) {
        this.scheduleSend();
        return;
      }

      var isAlpha = (k) => {
        return !get(this, 'metas').includes(k)
          && !isAlternate(k)
          && !isRange(k)
          && !isMore(k);
      }
      if (isAlpha(kc)) {
        set(this, 'principal', null);
        this.sendAction('add', term);
        get(this, 'search').perform(term);
      }
    },

    show() {
      if (this.get('showOptions') === true) {
        return;
      }
      const toBottom = $('body').height() - $(this.$()[0]).offset().top - 60;  // eslint-disable-line
      this.set('maxHeight', toBottom < get(this,'maxHeight') ? toBottom : get(this,'maxHeight'));
      this.set('showOptions', true);
    },

    hide() {
      set(this, 'filter', get(this, 'displayLabel'))
      this.set('showOptions', false);
      this.set('$activeTarget', null);
    },
  },

  displayLabel: computed('value', 'prompt', 'interContent.[]', function () {
    const value = this.get('value');
    if (!value) {
      return null;
    }

    const vp = this.get('optionValuePath');
    const lp = this.get('optionLabelPath');
    const selectedItem = this.get('interContent').filterBy(vp, value).get('firstObject');

    if (selectedItem) {
      let label = get(selectedItem, lp);
      if (this.get('localizedLabel')) {
        label = this.get('intl').t(label);
      }
      return label;
    }
    return value;
  }),

  setSelect(item) {
    const gp = this.get('optionGroupPath');
    const vp = this.get('optionValuePath');

    this.set('value', get(item, vp));
    if (gp && get(item, gp)) {
      this.set('group', get(item, gp));
    }

    this.set('filter', this.get('displayLabel'));

    set(this, 'principal', item);
    this.sendAction('add');
    this.send('hide');
  },

  showMessage: computed('filtered.[]','value', function() {
    if ( !get(this,'value') ) {
      return false;
    }

    return get(this, 'filtered.length') === 0;
  }),

  search: task(function * (term) {
    if (isBlank(term)) {
      set(this, '_pods', []);
      set(this, 'loading', false);
      return;
    }

    // Pause here for DEBOUNCE_MS milliseconds. Because this
    // task is `restartable`, if the principal starts typing again,
    // the current search will be canceled at this point and
    // start over from the beginning. This is the
    // ember-concurrency way of debouncing a task.

    set(this, 'loading', true);

    yield timeout(DEBOUNCE_MS);

    let xhr = yield this.get('goSearch').perform(term);
    return xhr;
  }).restartable(),


  goSearch: task(function * (term) {
    const globalStore = get(this, 'globalStore');
    const k8sStore = get(this, 'k8sStore')
    const resourceKind = get(this, 'resourceKind')
    const clusterId = get(this, 'clusterId')
    let promise;
    let url = `${ k8sStore.baseUrl }/v3/huaWeiClusterEventLog?action=queryName&clusterEventId=${clusterId}&refKind=${resourceKind}`
    if (term) {
      url += `&refName=${term}`
    }
    promise = k8sStore.rawRequest({
      url,
      method: 'GET',
    }).then((xhr) => {
      let neu = [];
      if ( xhr.status !== 204 ) {
        if ( xhr.body && typeof xhr.body === 'object' && xhr.body.data ) {
          neu = xhr.body.data;
        }
      }

      set(this, '_pods', neu);

      return xhr;
    }).catch((xhr) => {
      set(this, 'errors', [`${xhr.status}: ${xhr.statusText}`]);
      return xhr;
    }).finally(() => {
      set(this, 'loading', false);
      if ( get(this,'sendExactAfterSearch') ) {
        this.scheduleSend();
      }
    });

    let result = yield promise;
    return result;
  }),
});

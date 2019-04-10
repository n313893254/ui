import Component from '@ember/component';
import { get, set, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import CodeMirror from 'codemirror';
import jsyaml from 'js-yaml';
import ModalBase from 'shared/mixins/modal-base';
import layout from './template';
import ChildHook from 'shared/mixins/child-hook';
import json2yaml from 'json2yaml';
import dotObject from 'dot-object';

export default Component.extend(ModalBase, ChildHook, {
  intl:  service(),
  growl: service(),
  scope: service(),
  store: service('store'),

  layout,
  mode:      'project',
  namespace: null,
  yaml:      '',

  errors:     null,
  compose:    null,
  classNames: ['modal-container', 'large-modal', 'fullscreen-modal', 'modal-shell', 'alert'],

  init() {
    this._super(...arguments);
    window.jsyaml || (window.jsyaml = jsyaml);
  },

  actions: {
    cancel() {
      return this._super(...arguments);
    },

    close() {
      return this._super(...arguments);
    },

    save(cb) {
      let yaml = get(this, 'yaml');
      const lintError = [];

      jsyaml.safeLoadAll(yaml, (y) => {
        lintError.pushObjects(CodeMirror.lint.yaml(y));
      });

      if ( lintError.length ) {
        set(this, 'errors', [get(this, 'intl').t('yamlPage.errors')]);
        cb(false);

        return;
      }

      set(this, 'errors', null);

      const opts = { yaml: get(this, 'yaml'), };

      switch ( get(this, 'mode') ) {
      case 'namespace':
        opts.namespace = get(this, 'namespace.name');
        break;
      case 'project':
        opts.project = get(this, 'projectId');
        opts.defaultNamespace = get(this, 'namespace.name');
        break;
      case 'cluster':
        break;
      }

      if ( get(this, 'mode') === 'cluster' ) {
        this.send('actuallySave', opts, cb);
      } else {
        return this.applyHooks('_beforeSaveHooks').then(() => {
          this.send('actuallySave', opts, cb);
        })
          .catch(() => {
            cb(false);
          });
      }
    },

    actuallySave(opts, cb) {
      return get(this, 'scope.currentCluster').doAction('importYaml', opts)
        .then(() => {
          cb();
          this.send('cancel');
        })
        .catch(() => {
          cb(false);
        });
    }
  },

  lintObserver: observer('yaml', function() {
    const yaml = get(this, 'yaml');
    const lintError = [];
    try {
      const poi = jsyaml.safeLoad(yaml);
      const answers = this.toAnswer(poi)
      const newObj = dotObject.dot(answers)
      console.log(JSON.stringify(newObj), 'newObj')
      const expandObj = this.expand(newObj)
      // const expandObj = dotObject.object(newObj)
      console.log(expandObj, 'expandObj')
      const out = json2yaml.stringify(expandObj)
      console.log(out, 'out')
    } catch (e) {
      console.log(e, 'error')
    } finally {

    }
  }),

  toAnswer(obj) {
    const keys = Object.keys(obj)
    let out = {}
    keys.map((key='') => {
      let dotKey = key
      if (key.includes('.')) {
        // dotKey = `"${key}"`
        dotKey = key.replace(/[^\\]\./g, '\\.')
      }
      if (typeOf(obj[key]) === 'string' || typeOf(obj[key]) === 'number' || typeOf(obj[key]) === 'boolean') {
        out[dotKey] = obj[key]
      }
      if (Array.isArray(obj[key])) {
        const arr = obj[key]
        arr.map((a, index) => {
          if (typeOf(a !== 'object')) {
            out[`${dotKey}[${index}]`] = a
          } else {
            out[`${dotKey}[${index}]`] = this.toAnswer(a)
          }
        })
      }
      if (typeOf(obj[key]) === 'object') {
        out[dotKey] = this.toAnswer(obj[key])
      }
    })

    return out
  },

  removeSlash(obj={}) {
    Object.keys(obj).map((key='') => {
      key.replace(/[^\\]\./g, '\\.')
    })
  },

  dotify(obj, current, out={}) {
    for (let key in obj) {
      let dotKey = key
      if (key.includes('.')) {
        dotKey = key.replace(/[^\\]\./g, '\.')
      }
      const value = obj[key]
      const newKey = current ? current + '.' + dotKey : dotKey
      if (value && typeof value === 'object') {
        this.dotify(value, newKey, out);
      } else {
        out[`${newKey}`] = value;
      }
    }
  },

  expand(obj) {
    let out = {}

    Object.keys(obj).map((key='') => {
      const paths = key.split('.')
      const queue = this.pathMerge(paths)

      queue.reduce((accumulator, value, idx) => {
        if (idx + 1 === queue.length) {
          accumulator[value] = obj[key]
        } else {
          accumulator[value] = {}
        }

        return accumulator[value]
      }, out)
    })

    return out
  },

  pathMerge(paths) {
    let queue = []
    let flag = undefined
    paths.map((p, index) => {
      if (flag + 1 === index ) {
        return
      }
      if (p.endsWith('\\') && (index + 1 !== paths.length)) {
        flag = index
        queue.push([p, paths[index + 1]].join('.'))
      } else {
        queue.push(p)
      }
    })

    if (queue.filter((key='', idx) => key.endsWith('\\') && (idx + 1 !== queue.length)).length > 0) {
      queue = this.pathMerge(queue)
    }

    return queue
  },

});

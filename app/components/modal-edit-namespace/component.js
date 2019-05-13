import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import NewOrEdit from 'shared/mixins/new-or-edit';
import ModalBase from 'shared/mixins/modal-base';
import layout from './template';
import { inject as service } from '@ember/service';
import {
  computed, set, get, observer, setProperties
} from '@ember/object';
import { next } from '@ember/runloop';

const ISTIO_APP_NAME = 'cluster-istio'

export default Component.extend(ModalBase, NewOrEdit, {
  scope: service(),

  layout,
  classNames:    ['large-modal'],
  editing:       true,
  model:         null,
  istioEnabled:  null,

  allNamespaces:     null,
  allProjects:       null,
  tags:              null,
  beforeSaveModel:   null,

  originalModel:  alias('modalService.modalOpts'),
  init() {
    this._super(...arguments);

    const orig  = get(this, 'originalModel');
    const clone = orig.clone();

    delete clone.services;

    setProperties(this, {
      model:         clone,
      tags:          (get(this, 'primaryResource.tags') || []).join(','),
      allNamespaces: get(this, 'clusterStore').all('namespace'),
      allProjects:   get(this, 'globalStore').all('project')
        .filterBy('clusterId', get(this, 'scope.currentCluster.id')),
    })

    const cluster = get(this, 'scope.currentCluster')
    const systemProject = get(cluster, 'systemProject')

    if (systemProject) {
      get(this, 'globalStore').rawRequest({
        url:    get(systemProject, 'links.apps'),
        method: 'GET',
      }).then(({ body = {} }) => {
        const apps = body.data

        set(this, 'istioEnabled', !!(apps || []).findBy('name', ISTIO_APP_NAME))
      });
    } else {
      set(this, 'istioEnabled', false)
    }

    const labels = get(this, 'primaryResource.labels')

    if (labels && labels['istio-injection'] === 'enabled') {
      set(this, 'istioInjection', true)
    } else {
      set(this, 'istioInjection', false)
    }
  },

  actions: {
    addTag(tag) {
      const tags = get(this, 'primaryResource.tags') || [];

      tags.addObject(tag);

      set(this, 'tags', tags.join(','));
    },

    updateNsQuota(quota) {
      if ( quota ) {
        set(this, 'primaryResource.resourceQuota', { limit: quota });
      } else {
        set(this, 'primaryResource.resourceQuota', null);
      }
    },

    updateContainerDefault(limit) {
      set(this, 'primaryResource.containerDefaultResourceLimit', limit);
    },

    setLabels(labels) {
      let out = {};

      labels.forEach((row) => {
        out[row.key] = row.value;
      });

      set(this, 'primaryResource.labels', out);
    },

    toggleAutoInject() {
      const newSelection = !get(this, 'istioInjection')
      const labels = {
        ...get(this, 'primaryResource.labels'),
        'istio-injection': newSelection ? 'enabled' : 'disabled'
      }

      setProperties(this, {
        istioInjection:           newSelection,
        'primaryResource.labels': labels,
      })
    },
  },

  projectDidChange: observer('primaryResource.project.id', function() {
    set(this, 'switchingProject', true);
    next(() => {
      set(this, 'switchingProject', false);
    });
    if ( !get(this, 'primaryResource.project.resourceQuota') ) {
      set(this, 'primaryResource.resourceQuota', null);
    }
  }),

  tagsDidChanged: observer('tags', function() {
    set(this, 'primaryResource.tags', get(this, 'tags').split(',') || []);
  }),

  projectLimit: computed('primaryResource.resourceQuota.{limit}', 'primaryResource.projectId', function() {
    const projectId = get(this, 'primaryResource.projectId');
    const project   = get(this, 'allProjects').findBy('id', projectId);

    return get(project, 'resourceQuota.limit');
  }),

  projectUsedLimit: computed('primaryResource.resourceQuota.{limit}', 'primaryResource.projectId', function() {
    const projectId = get(this, 'primaryResource.projectId');
    const project   = get(this, 'allProjects').findBy('id', projectId);

    return get(project, 'resourceQuota.usedLimit');
  }),

  nsDefaultQuota: computed('primaryResource.resourceQuota.{limit}', 'primaryResource.projectId', function() {
    const projectId = get(this, 'primaryResource.projectId');
    const project   = get(this, 'allProjects').findBy('id', projectId);

    return get(project, 'namespaceDefaultResourceQuota.limit');
  }),

  validate() {
    this._super();

    const errors      = get(this, 'errors') || [];
    const quotaErrors = get(this, 'primaryResource').validateResourceQuota(get(this, 'originalModel.resourceQuota.limit'));

    if ( quotaErrors.length > 0 ) {
      errors.pushObjects(quotaErrors);
    }

    set(this, 'errors', errors);

    return get(this, 'errors.length') === 0;
  },

  willSave() {
    set(this, 'beforeSaveModel', get(this, 'originalModel').clone());

    return this._super(...arguments);
  },

  didSave(pr) {
    const { projectId } = pr;

    if ( projectId !== get(this, 'beforeSaveModel.projectId') ) {
      return pr.doAction('move', { projectId }).then((pr) => pr);
    }
  },

  doneSaving() {
    this.send('cancel');
  }
});

import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { set, get } from '@ember/object';

let precanStages = () => [{
  name:  'clone',
  steps: []
}];

export default Route.extend({
  projectStore: service('store'),
  precanStages: precanStages(),

  model(params) {
    var store = get(this, 'store');
    var projectStore = get(this, 'projectStore');

    let projectDockerCredentials = projectStore.all('dockerCredential');
    let pipelines = store.findAll('pipeline');

    const pipelineYaml = store.findAll('pipeline').then(res => {
      return res.findBy('id', params.pipeline_id).followLink('configs')
    })

    return hash({
      projectDockerCredentials,
      pipelines,
      pipelineYaml,
    }).then((hash) => {
      const { projectDockerCredentials, pipelines, pipelineYaml='' } = hash;
      let pipeline = pipelines.findBy('id', params.pipeline_id);
      const notification = JSON.parse(pipelineYaml) && JSON.parse(pipelineYaml)
      // console.log(notification, 'notification')

      if ( !get(pipeline, 'sourceCodeCredentialId') ){
        return {
          pipelineConfig: {
            selectedSource: 'github',
            name:           pipeline.name,
            url:            pipeline.repositoryUrl,
            notification,
          },
          pipeline,
          accounts: [],
          projectDockerCredentials,
        };
      } else {
        return {
          pipelineConfig: {
            selectedSource: get(pipeline, 'sourceCodeCredential.sourceCodeType'),
            name:           pipeline.name,
            url:            pipeline.repositoryUrl,
            trigger:        {
              triggerWebhookPr:      pipeline.triggerWebhookPr,
              triggerWebhookPush:    pipeline.triggerWebhookPush,
              triggerWebhookTag:     pipeline.triggerWebhookTag,
              triggerCronExpression: pipeline.triggerCronExpression,
              triggerCronTimezone:   pipeline.triggerCronTimezone,
            },
            notification,
          },
          pipeline,
          accounts: [get(pipeline, 'sourceCodeCredential')],
          projectDockerCredentials,
        }
      }
    })
  },
  resetController(controller){
    controller.set('errors', '');
    controller.set('saved', false);
    set(this, 'precanStages', precanStages())
  },
});

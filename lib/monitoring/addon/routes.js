import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function() {
  // Define your engine's route map here
  this.route('index', { path: '/' });
  this.route('cluster-setting');
<<<<<<< HEAD
  this.route('project-setting');
=======
>>>>>>> alerting
  this.route('node-detail', { path: '/:node_id' })
});

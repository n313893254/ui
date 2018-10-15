import { hash } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return hash({ autoScalerTemplate: this.get('globalStore').findAll('autoScalerTemplate'), });
  },
});

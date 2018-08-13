import Ember from 'ember';
import layout from './template';
// import JSONFormatter from 'json-formatter';

export default Ember.Component.extend({
    layout,
    didInsertElement(){
        const formatter = new window.JSONFormatter(this.value, 0);
        let v = formatter.render();
        this.$().append(v);
    },
    value: {}
});

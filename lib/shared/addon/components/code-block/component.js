import Component from '@ember/component';
import layout from './template';
import { observer } from '@ember/object'
import prismjs from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';

export default Component.extend({
  layout,
  language:          'javascript',
  code:              '',
  hide:              false,
  constrained:       true,
  collapsed:         false,

  tagName:           'PRE',
  classNames:        ['line-numbers'],
  classNameBindings: ['languageClass', 'hide:hide', 'constrained:constrained', 'collapsed:collapsed'],

  highlighted:        null,

  didReceiveAttrs() {
    this.highlightedChanged();
  },

  highlightedChanged: observer('language', 'code', function() {
    var lang = this.get('language');

    this.set('highlighted', prismjs.highlight(this.get('code') || '', prismjs.languages[lang], lang));
  }),

  languageClass: function() {
    var lang = this.get('language');

    if ( lang ) {
      return `language-${ lang }`;
    }
  }.property('language'),

});

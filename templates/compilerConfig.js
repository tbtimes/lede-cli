let path = require('path');
let os = require('os');
let slug = require('slug');
let lede = require('lede');


module.exports = {
  compilers: {
    html: new lede.NunjucksCompiler({
      watch: false,
      noCache: true,
      autoescape: false,
      filters: [
        {
          name: "linebreaks",
          fn: function(txt) {
            return txt
              .split("\r\n").join("\n").split("\n")
              .filter(x => x.trim().length)
              .map(x => `<p>${x}</p>`)
              .join("\n")
          }
        },
        {
          name: "slugify",
          fn: function(txt, opts) {
            return slug(txt, opts);
          }
        }
      ]
    }),
    css: new lede.SassCompiler({
      includePaths: [],
      outputStyle: 'compact',
      sourceComments: false,
      sourceMapEmbed: false
    }),
    js: new lede.Es6Compiler()
  }
};
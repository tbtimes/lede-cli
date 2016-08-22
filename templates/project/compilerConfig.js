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
          name: "tweetlines",
          fn: function (txt, url) {
            var regex = new RegExp('tweet\{.+\}', 'g');
            var tweetline = txt.match(regex);
            if (tweetline) {
              var replacer = tweetline.map(function (line, ind) {
                var title = line.slice(6, -1);
                var uniq = slug(title);
                if (title.length > 117) {
                  title = title.slice(0, 114) + '...';
                }
                return `<span class="tweetline" id="tweetline${uniq}" onclick="gigya.services.socialize.plugins.reactions.instances[\'componentDiv${uniq}\'].buttonInstances[\'componentDiv${uniq}-reaction0\'].onClick()">${line.slice(
                  6,
                  -1)}<script type="text/javascript">var act = new gigya.socialize.UserAction();act.setTitle("${title}");act.setLinkBack("${url}");var showShareBarUI_params={containerID: "componentDiv${uniq}", shareButtons: [{provider: "twitter", iconImgUp: "http://www.tampabay.com/projects/assets/sharing/twitter_inline.png"}], showCounts: "none", iconsOnly: "true", userAction: act};var params = {userAction:act, enabledProviders: "twitter"};</script><span class="componentDivInline" id="componentDiv${uniq}"></span></span><script type="text/javascript">gigya.socialize.showShareBarUI(showShareBarUI_params);</script>`;
              });
              tweetline.forEach((e, i) => {
                txt = txt.replace(/tweet{.+}/, replacer[i]);
              });
              return txt;
            } else {
              return txt;
            }
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
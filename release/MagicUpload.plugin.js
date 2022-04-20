/**
 * @name MagicUpload
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/mack/magic-upload
 * @source 
 */

module.exports = (() => {
    const config = {"info":{"name":"Magic Upload","authors":[{"name":"Mack","discord_id":"365247132375973889","github_username":"mack","twitter_username":"mackboudreau"}],"version":"0.0.1","description":"🧙‍♀️ A BetterDiscord plugin to automagically upload files over 8MB.","github":"https://github.com/mack/magic-upload","github_raw":""},"changelog":[],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
  "use strict";

  const { Logger, Patcher, WebpackModules, DiscordModules, DOMTools, PluginUtilities, ContextMenu, Settings } = Library;
  const { SettingPanel, Slider } = Settings;
  const { Dispatcher, React, SelectedChannelStore, SelectedGuildStore } = DiscordModules;

  // Set globals
  const fileCheckMod = WebpackModules.getByProps("anyFileTooLarge", "maxFileSize");
  const fileUploadMod = WebpackModules.getByProps("instantBatchUpload", "upload");
  

  class MagicUpload extends Plugin {
      onStart() {
        console.log("hi")
      }

      onStop() {
  
      }
  };

  return MagicUpload;
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
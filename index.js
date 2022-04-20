module.exports = (Plugin, Library) => {
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
}
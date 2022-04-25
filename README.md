# 🧙‍♀️✨ Magic Upload
A BetterDiscord plugin to automagically upload files over 8MB.
<details>
<summary style="cursor: pointer;"><b>How it works</b></summary>
This plugin uses Google Drive in the background. Users must connect their Google account and then they're able to upload files that exceed Discords upload limit. The plugin will upload large files in the background, resume an upload if it's interupted, and send a share link on your behalf.
</details>

## Getting Started
1. Download & install [BetterDiscord](https://betterdiscord.app).
2. Copy [MagicUpload.plugin.js](MagicUpload.plugin.js) into your BetterDiscord plugins folder.
    1. Where is my plugins folder? Click [here](#install).
3. Enable the plugin and click on `Connect Google Account` from the popup.
    1. How do I enable the plugin? Go to Settings > Plugins and make sure MagicUpload is switch on.
    2. Will you have access to my Google Drive? No! Your Google Drive credentials are stored on your computer, and **your computer only**.
4. 🎉 Start uploading large files!

## Contributing
To get started contributing, clone the repository and run:
```
$ make watch
```
You will then be able to make changes to `index.js` and on save the plugin will be built and installed. For changes to the HTML templates used in OAuth, see the templates [README.md](templates).

#### Makefile Commands
```
build                          Build a minified bundled version of the plugin.
install                        Copy release to BetterDiscord plugin directory.
setup                          Install tools used to build and hot reload plugin.
watch                          Automatically build and install plugin on save.
```

## Frequently Asked Questions
<h3 id="install">How do I install a BetterDiscord plugin?</h3>
TBD
<h3 id="security">Will anyone have access to my Google Drive?</h3>
TBD
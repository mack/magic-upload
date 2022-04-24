/**
 * @name MagicUpload
 * @website https://github.com/mack/magic-upload
 * @source 
 */

module.exports = (() => {
    const config = {"main":"bundled.js","info":{"name":"Magic Upload","authors":[{"name":"Mack","discord_id":"365247132375973889","github_username":"mack","twitter_username":"mackboudreau"}],"version":"0.0.1","description":"🧙‍♀️ A BetterDiscord plugin to automagically upload files over 8MB.","github":"https://github.com/mack/magic-upload","github_raw":""},"changelog":[],"defaultConfig":[]};

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
  /* ========== Required Dependencies ========== */
  const http = require('http');
  const https = require('https');
  const url = require('url');
  const crypto = require('crypto');
  const fs = require('fs');

  const moduleFileCheck = global.BdApi.findModuleByProps('anyFileTooLarge', 'maxFileSize');
  const moduleFileUpload = global.BdApi.findModuleByProps('instantBatchUpload', 'upload');
  const moduleMessageActions = global.BdApi.findModuleByProps('sendMessage');
  const moduleButtonElement = global.BdApi.findModuleByProps('BorderColors');
  const moduleModalActions = global.BdApi.findModuleByProps('useModalsStore', 'closeModal');

  /* ========== Global Constants & Internal Config ========== */
  const INTERNAL_CONFIG = {
    meta: {
      name: 'Magic Upload',
    },
    oauth: {
      handler: {
        port: 29842,
        host: 'localhost',
      },
      clientId: '911268808772-r7sa3s88f2o36hdcu9g4tmih6dbo4n77.apps.googleusercontent.com',
      clientSecret: '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',
    },
    storage: {
      algorithm: 'aes-256-ctr',
      secretKey: 'jXn2r5u8x/A?D*G-KaPdSgVkYp3s6v9y',
      iv: crypto.randomBytes(16),
      credentialsKey: '_magicupload_oa_creds_gd',
      uploadsKey: '_magicupload_files_inprogress',
    },
    upload: {
      // Google Drive requires chunks to be multiples of 256KB
      chunkMultiplier: 10,
    },
  };

  const HTTP_CODE_OK = 200;
  const HTTP_CODE_UPLOAD_OK = 308;
  const HTTP_CODE_UNAUTHORIZED = 401;
  const HTTP_CODE_NOT_FOUND = 404;
  const HTTP_CODE_INTERNAL_ERR = 500;
  const OAUTH_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${INTERNAL_CONFIG.oauth.handler.host}:${INTERNAL_CONFIG.oauth.handler.port}&response_type=code&client_id=${INTERNAL_CONFIG.oauth.clientId}`;
  const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  const OAUTH_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
  const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
  const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
  const DRIVE_READ_ROLE = 'reader';
  const DRIVE_ANYONE_GRANTEE = 'anyone';
  const SUCCESS_HTML = () => '<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">✅ You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); </script> </body></html>';
  const ERROR_HTML = (props) => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${props.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); </script> </body></html>`;

  /* ========== Miscellaneous Helper Functions ========== */
  const optionsWithAuth = (options, storage) => {
    const modifiedOptions = options;
    const accessToken = storage.getAccessToken();
    if (accessToken) {
      modifiedOptions.headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
    }
    return options;
  };

  const truncate = (str, n) => ((str.length > n) ? `${str.substr(0, n - 1)}...` : str);
  const getDriveLink = (driveId) => `https://drive.google.com/file/d/${driveId}`;
  const getDirectDriveLink = (driveId) => `https://drive.google.com/uc?export=download&id=${driveId}`;
  const convertFileToMagicFile = (file, destination, content) => ({
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
    name: file.name,
    path: file.path,
    size: file.size,
    type: file.type,
    webkitRelativePath: file.webkitRelativePath,
    mu_destination: destination,
    mu_content: content,
  });
  const parseRecievedRange = (rangeHeader) => {
    const range = rangeHeader.split('-');
    if (range.length === 2) {
      return parseInt(range[1], 10);
    }
    return undefined;
  };
  const closeLastModal = () => {
    const lastModal = moduleModalActions.useModalsStore.getState().default[0];
    if (lastModal) {
      moduleModalActions.closeModal(lastModal.key);
    }
  };

  const successToast = (content, overrides) => global.BdApi.showToast(content, { type: 'success', ...overrides });
  const infoToast = (content, overrides) => global.BdApi.showToast(content, { type: 'info', ...overrides });
  const warnToast = (content, overrides) => global.BdApi.showToast(content, { type: 'warning', ...overrides });
  const errorToast = (content, overrides) => global.BdApi.showToast(content, { type: 'error', ...overrides });

  class XUtil {
    static log(...message) {
      XUtil.console(message, "log");
    }

    static info(message) {
      XUtil.console(message, "info");
    }

    static warn(message) {
      XUtil.console(message, "warn");
    }

    static err(message) {
      XUtil.console(message, "err");
    }

    static console(message, type) {
      const consoleTypes = {
        log: "log",
        info: "info",
        dbg: "debug",
        debug: "debug",
        warn: "warn",
        err: "error",
        error: "error"
      }
      let parsedType = Object.prototype.hasOwnProperty.call(consoleTypes, type) ? consoleTypes[type] : "log";
      let parsedMessage = message;
      if (!Array.isArray(message)) parsedMessage = [parsedMessage];
      console[parsedType](`%c[${INTERNAL_CONFIG.meta.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', ...parsedMessage);
    }

    static encrypt(plain) {
      const { algorithm, secretKey, iv } = INTERNAL_CONFIG.storage;
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);

      return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
      };
    }

    static decrypt(hash) {
      const { algorithm, secretKey } = INTERNAL_CONFIG.storage;
      const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
      const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
      return decrpyted.toString();
    }

    static override(module, methodName, method, options) {
      const cancel = global.BdApi.monkeyPatch(module, methodName, { ...options, instead: method });
      if (window.magicUploadOverrides) {
        window.magicUploadOverrides.push(cancel);
      } else {
        window.magicUploadOverrides = [cancel];
      }
    }

    static clearOverrides() {
      window.magicUploadOverrides.forEach((cancel) => cancel());
    }
  }

  /* ========== File Uploader ========== */
  class FileUploader {
    static sendUploadMessage(file, link) {
      const formattedMessage = file.mu_content !== '' ? `${file.mu_content}\n${link}` : link;
      moduleMessageActions.sendMessage(
        file.mu_destination,
        {
          content: formattedMessage,
          validNonShortcutEmojis: [],
        },
      );
    }

    constructor(storage, oauther) {
      this.storage = storage;
      this.oauther = oauther;
      this.continue();
    }

    continue() {
      const registeredUploads = this.getRegisteredUploads();
      Object.keys(registeredUploads).forEach((streamLocation) => {
        if (Object.prototype.hasOwnProperty.call(registeredUploads, streamLocation)) {
          this.getStreamStatus(streamLocation, (response) => {
            switch (response.status) {
              case HTTP_CODE_OK: {
                // File has finished uploading, remove from registry
                this.unregisterUpload(streamLocation);
                break;
              }
              case HTTP_CODE_UPLOAD_OK: {
                XUtil.log('Resuming inprogress upload.');
                // Upload session active, resume upload
                const cursor = parseRecievedRange(response.headers.get('Range'));
                this.streamChunks(
                  streamLocation,
                  registeredUploads[streamLocation],
                  cursor,
                  (data) => {
                  // Upload has finished
                  // Data has ID for file in google drive
                    this.unregisterUpload(streamLocation);
                  },
                );
                break;
              }
              case HTTP_CODE_NOT_FOUND: {
                // Upload session has expired, restart upload
                const file = registeredUploads[streamLocation];
                this.unregisterUpload(streamLocation);
                this.upload(file);
                break;
              }
              default:
            }
          });
        }
      });
    }

    getRegisteredUploads() {
      return this.storage.load(INTERNAL_CONFIG.storage.uploadsKey) || {};
    }

    registerUpload(streamLocation, file) {
      XUtil.log('Registering new file into upload registry.');
      const fileCopy = JSON.parse(JSON.stringify(file));
      const registry = this.getRegisteredUploads();
      registry[streamLocation] = fileCopy;
      this.storage.store(INTERNAL_CONFIG.storage.uploadsKey, registry);
    }

    unregisterUpload(streamLocation) {
      XUtil.log('Unregistering upload from upload registry.');
      const registry = this.getRegisteredUploads();
      delete registry[streamLocation];
      this.storage.store(INTERNAL_CONFIG.storage.uploadsKey, registry);
    }

    getStreamStatus(streamLocation, callback) {
      const options = optionsWithAuth({
        method: 'PUT',
        headers: {
          'Content-Length': 0,
          'Content-Range': 'bytes 0-*/*',
        },
      }, this.storage);
      fetch(streamLocation, options).then((response) => {
        if (callback) callback(response);
      });
    }

    streamChunks(streamLocation, file, from, callback) {
      const accessToken = this.storage.getAccessToken();
      // const unregisterUpload = this.storage.unregisterUpload;
      const CHUNK_SIZE = INTERNAL_CONFIG.upload.chunkMultiplier * 256 * 1024;
      console.log(streamLocation);
      console.log(file);

      const buffer = Buffer.alloc(CHUNK_SIZE);

      fs.open(file.path, 'r', (err, fd) => {
        if (err || !fd) {
          callback(null, err);
        }
        const readNextChunk = (cursor) => {
          fs.read(fd, buffer, 0, CHUNK_SIZE, cursor, (err, byteLength) => {
            if (err) {
              callback(null, err);
            }
            let chunk;
            if (byteLength < CHUNK_SIZE) {
              // Read bytes are smaller than the chunk size.
              // This can occur when a file is smaller than the
              // chunk size, or we are uploading the last portion
              // of a file.
              chunk = buffer.slice(0, byteLength);
            } else {
              chunk = buffer;
            }

            const start = cursor;
            const end = cursor + (chunk.length - 1); // -1 start cuz zero index
            const total = file.size;

            const locaton = new URL(streamLocation);
            const options = {
              host: locaton.host,
              path: locaton.pathname + locaton.search,
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Length': chunk.length,
                'Content-Range': `bytes ${start}-${end}/${total}`,
              },
            };
            XUtil.info(`[${((start / total) * 100).toFixed(2)}%] Uploading ${file.name} (${start}/${total})`);
            // Fetch unfortunately does handle Buffer objects well
            // so we're forced to use `https` to process our requests
            const uploadChunk = https.request(options, (res) => {
              if (res.statusCode === HTTP_CODE_UPLOAD_OK) {
                // TODO: Eventually we'll want to check to make sure
                // the user hasn't cancelled the upload
                // in the UI here
                readNextChunk(parseRecievedRange(res.headers.range));
              }
              if (res.statusCode === HTTP_CODE_OK) {
                // File has been uploaded
                let responseData = '';
                res.on('data', (chunk) => { responseData += chunk; });
                res.on('close', () => {
                  fs.close(fd, () => {
                    successToast(`Successfully uploaded ${truncate(file.name, 35)}`);
                    callback(JSON.parse(responseData), null);
                  });
                });
              }
            });
            uploadChunk.write(chunk);
            uploadChunk.end();
          });
        };
        readNextChunk(from);
      });
    }

    share(driveId, callback, retry) {
      const body = {
        role: DRIVE_READ_ROLE,
        type: DRIVE_ANYONE_GRANTEE,
      };
      const options = optionsWithAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(body),
      }, this.storage);

      fetch(`${GOOGLE_DRIVE_API_URL}/${driveId}/permissions`, options).then((response) => response.json())
        .then((data) => {
          if (data.error) {
            if (data.error.code === HTTP_CODE_UNAUTHORIZED && !retry) {
              this.oauther.refresh(() => {
                this.share(driveId, callback, true);
              });
            }
          } else if (callback) callback();
        });
    }

    upload(file, retry) {
      const body = {
        name: file.name,
        mimeType: file.type,
      };
      const options = optionsWithAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Content-Length': file.size,
        },
        body: JSON.stringify(body),
      }, this.storage);

      fetch(GOOGLE_DRIVE_UPLOAD_URL, options).then((response) => {
        if (response.status === HTTP_CODE_OK) {
          const streamLocation = response.headers.get('Location');
          // Forced to copy the file reference.
          this.registerUpload(streamLocation, file);
          this.streamChunks(streamLocation, file, 0, (driveItem, err) => {
            // Upload has completed or failed. Remove from registry
            this.unregisterUpload(streamLocation);
            if (err === null) {
              // Upload was successful, add permissions and share!
              this.share(driveItem.id, () => {
                console.log('SHARRINGNNGGNG!');
                FileUploader.sendUploadMessage(file, getDriveLink(driveItem.id));
              });
            } else {
              XUtil.err('Upload has failed.');
              errorToast(`Upload failed ${truncate(file.name, 35)}`);
            }
          });
        } else if (response.status === HTTP_CODE_UNAUTHORIZED && !retry) {
          // Access token may be expired, try to refresh
          this.oauther.refresh(() => {
            this.upload(file, true);
          });
        }
      });
    }
  }

  /* ========== Persistant Storage ========== */
  class StorageHandler {
    constructor(pluginName) {
      this.pluginName = pluginName;

      /* Alias Functions */
      const { credentialsKey } = INTERNAL_CONFIG.storage;
      this.deleteCredentials = () => this.delete(credentialsKey);
      this.getAccessToken = () => {
        const credentials = this.load(credentialsKey, true);
        return credentials && credentials.access_token;
      };
      this.patchAccessToken = (token) => {
        const credentials = this.load(credentialsKey, true);
        credentials.access_token = token;
        this.store(credentialsKey, credentials, true);
        return token;
      };
    }

    load(key, decrypt) {
      let data = global.BdApi.loadData(this.pluginName, key);
      if (data && decrypt) {
        // Base64 decode the hash
        const hash = Buffer.from(data, 'base64').toString('ascii');
        data = JSON.parse(XUtil.decrypt(JSON.parse(hash)));
      }
      return data;
    }

    store(key, obj, encrypt) {
      let data;
      if (encrypt) {
        const hash = XUtil.encrypt(JSON.stringify(obj));
        // Base64 encode the hash
        data = Buffer.from(JSON.stringify(hash)).toString('base64');
      } else {
        data = obj;
      }
      global.BdApi.saveData(this.pluginName, key, data);
    }

    delete(key) {
      global.BdApi.deleteData(this.pluginName, key);
    }
  }

  /* ========== OAuth Logic ========== */
  class OAuther {
    static postAccessToken(authorizationCode, callback) {
      const body = new URLSearchParams({
        client_id: INTERNAL_CONFIG.oauth.clientId,
        client_secret: INTERNAL_CONFIG.oauth.clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: `http://${INTERNAL_CONFIG.oauth.handler.host}:${INTERNAL_CONFIG.oauth.handler.port}`,
      }).toString();
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      };
      fetch(OAUTH_TOKEN_URL, options).then((response) => response.json()).then((data) => {
        if (callback) callback(data);
      });
    }

    static postRefreshAccessToken(refreshToken, callback) {
      const body = new URLSearchParams({
        client_id: INTERNAL_CONFIG.oauth.clientId,
        client_secret: INTERNAL_CONFIG.oauth.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString();
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      };
      fetch(OAUTH_TOKEN_URL, options).then((response) => response.json()).then((data) => {
        if (callback) callback(data);
      });
    }

    static postRevokeToken(token) {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      fetch(`${OAUTH_REVOKE_URL}?token=${token}`, options).then((response) => {
        if (response.status === HTTP_CODE_OK) {
          XUtil.log('Token has successfully been revoked.');
        } else {
          XUtil.warn('Unable to revoke OAuth token.');
        }
      });
    }

    constructor(storage) {
      this.storage = storage;
      this.server = http.createServer((req, res) => {
        const { query } = url.parse(req.url, true);
        console.log('can handle a request');
        if (query.code) {
          XUtil.log('Recieved authorization code.');
          OAuther.postAccessToken(query.code, (credentials) => {
            if (credentials.access_token && credentials.refresh_token) {
              XUtil.log('Exchanged authorization code for access and refresh tokens.');
              this.storage.store(INTERNAL_CONFIG.storage.credentialsKey, credentials, true);
              res.writeHeader(HTTP_CODE_OK, { 'Content-Type': 'text/html' });
              res.write(SUCCESS_HTML());
              successToast('Google Drive connected!', { timeout: 5500 });
            } else {
              XUtil.err('Failed to retrieve access and refresh tokens.');
              res.writeHeader(HTTP_CODE_INTERNAL_ERR, { 'Content-Type': 'text/html' });
              res.write(ERROR_HTML({ error_message: JSON.stringify(credentials) }));
              errorToast('An error occured connecting Google Drive', { timeout: 5500 });
            }
            res.end();
            this.shutdownHandler();
          });
        }
      });
    }

    launch() {
      this.activateHandler(() => {
        XUtil.log('Sending user to OAuth consent flow.');
        window.open(OAUTH_AUTH_URL);
      });
    }

    activateHandler(callback) {
      if (this.server.listening) {
        callback();
        return;
      }
      const { port, host } = INTERNAL_CONFIG.oauth.handler;
      this.server.listen(port, host, () => {
        XUtil.log(`Listening for OAuth redirects on http://${host}:${port}...`);
        if (callback) callback();
      });
    }

    shutdownHandler(callback) {
      if (this.server.listening) {
        this.server.close(callback);
      }
    }

    refresh(callback) {
      const credentials = this.storage.load(INTERNAL_CONFIG.storage.credentialsKey, true);
      const refreshToken = credentials.refresh_token;
      if (refreshToken) {
        OAuther.postRefreshAccessToken(refreshToken, (newCredentals) => {
          const accessToken = newCredentals.access_token;
          if (accessToken) {
            // Access token has been refreshed.
            XUtil.log('Successfully refreshed access token.');
            this.storage.patchAccessToken(accessToken);
            if (callback) callback(accessToken);
          } else {
            // Refresh token may have expired, force another oauth prompt
            XUtil.warn('Refresh token may have expired. Please reconnect your Google account.');
            this.storage.deleteCredentials();
            this.launch();
          }
        });
      } else {
        XUtil.err('Something went wrong. Clearing OAuth credentials.');
        this.storage.deleteCredentials();
      }
    }
  }

  /* ==========  Magic Upload Plugin ========== */
  return class MagicUpload extends Plugin {
    openOAuthPrompt() {
      global.BdApi.showConfirmationModal('🔌 Connect your Google Drive', 'Magic Upload requires Google Drive. To use this plugin you must connect your Google account.', {
        confirmText: 'Connect Google Account',
        cancelText: 'Disable Plugin',
        onConfirm: () => {
          this.oauther.launch();
        },
        onCancel: () => {
          global.BdApi.Plugins.disable(this.getName());
        },
      });
    }

    // eslint-disable-next-line class-methods-use-this
    openUploadPrompt(filename, callback) {
      // BdApi.React.createElement(_checkbox, "This is a link.")
      global.BdApi.showConfirmationModal(filename, [
        'Are you sure you want to upload this file to Google Drive and share it?',
      ], {
        confirmText: 'Upload to Drive',
        cancelText: 'Cancel',
        onConfirm: () => {
          callback();
        },
      });
    }

    /* ========== Plugin Lifecycle Methods ========== */
    init() {
      XUtil.log(this.getName(), 'This is a test');
      this.storage = new StorageHandler(this.getName());
      this.oauther = new OAuther(this.storage);
      this.uploader = new FileUploader(this.storage, this.oauther);

      /* Plugin helper functions */
      this.uploadLimit = () => moduleFileCheck.maxFileSize('', true); // Get real upload limit
    }

    overrideDiscordUpload() {
      /* Patch upload methods */
      XUtil.log('Patching Discord file modules.');
      XUtil.override(moduleFileCheck, 'maxFileSize', ({ methodArguments, callOriginalMethod }) => {
        const useOriginal = methodArguments[1];
        if (useOriginal === true) {
          return callOriginalMethod();
        }
        return Number.MAX_VALUE;
      });
      XUtil.override(moduleFileCheck, 'anyFileTooLarge', () => false);
      XUtil.override(moduleFileCheck, 'uploadSumTooLarge', () => false);
      XUtil.override(moduleFileCheck, 'getUploadFileSizeSum', () => 0);
      XUtil.override(moduleFileUpload, 'uploadFiles', ({ methodArguments, thisObject, originalMethod }) => {
        const [originalArguments] = methodArguments;
        const { channelId, uploads, parsedMessage } = originalArguments;
        uploads.forEach((upload) => {
          if (upload.item.file.size < this.uploadLimit()) {
            // File is within discord upload limit, upload as normal
            const argsCopy = { ...originalArguments };
            argsCopy.uploads = [upload];
            console.log(argsCopy);
            originalMethod.apply(thisObject, [argsCopy]);
          } else {
            const magicFile = convertFileToMagicFile(
              upload.item.file,
              channelId,
              parsedMessage.content,
            );
            this.openUploadPrompt(magicFile.name, () => this.uploader.upload(magicFile));
          }
        });
      });
    }

    onStart() {
      this.init();
      if (!this.storage.getAccessToken()) {
        // No token found. Prompt user to connect Google Drive.
        this.openOAuthPrompt();
      } else {
        // OAuth has been enabled. Override upload methods.
        this.overrideDiscordUpload();
      }
      console.log(this.uploadLimit());
    }

    onStop() {
      XUtil.log('MagicUpload has stopped...');
      this.oauther.shutdownHandler();
      XUtil.clearOverrides();
    }

    buildSetting(data) {
      /*
      class Button extends ZLibrary.Settings.SettingField {
        constructor(name, note, value, onClick) {
          const style = {
            display: 'flex',
            // justifyContent: 'flex-end'
          };
          const _reactButton = BdApi.React.createElement(moduleButtonElement, { onClick }, value);

          super(name, note, _, (props) =>
            BdApi.React.createElement('div', { ...props, style }, _reactButton), {});
        }
      }
      const {
        name, note, type, value, onClick,
      } = data;
      if (type === 'button') {
        return new Button(name, note, value, onClick);
      }
      */
      return super.buildSetting(data);
    }

    getSettingsPanel() {
      const panel = this.buildSettingsPanel();
      const credentials = this.storage.load(INTERNAL_CONFIG.storage.credentialsKey, true);

      let settings;
      if (!credentials) {
        /* No OAuth Setting UI */
        settings = {
          description: `🔌 Hello! It looks like you haven't given access to your Google Drive. 
                      This plugin <i>requires</i> you to sign in with Google in order to function.`,
          controls: [
            {
              type: 'button',
              value: 'Connect Google Account',
              onClick: () => {
                this.oauther.launch();
                closeLastModal();
              },
            },
          ],
        };
      } else {
        /* Default Setting UI */
        settings = {
          controls: [
            {
              type: 'switch',
              id: 'automatic_file_upload',
              name: 'Automatic file uploading',
              note: 'Do not prompt me when uploading files that exceed the upload limit.',
              value: true,
              onChange: (val) => console.log('CHANGINGINSDGINGING'),
            },
            {
              type: 'switch',
              id: 'rich_embed',
              name: 'Google Drive embeds',
              note: 'Attempt to display an embedded preview of content from google drive links.',
              value: true,
              onChange: (val) => console.log('CHANGINGINSDGINGING'),
            },
            {
              type: 'switch',
              id: 'verbose',
              name: 'Verbose Logs',
              note: 'Display verbose console logs. Useful for debugging.',
              value: false,
              onChange: (val) => console.log('CHANGINGINSDGINGING'),
            },
            {
              type: 'textbox',
              id: 'access_token',
              name: 'Google Drive access token',
              note: 'This value is immutable.',
              value: credentials ? credentials.access_token : '',
            },
            {
              type: 'textbox',
              id: 'refresh_token',
              name: 'Google Drive refresh token',
              note: 'This value is immutable.',
              value: credentials ? credentials.refresh_token : '',
            },
            {
              type: 'button',
              value: 'Unlink Google Drive',
              onClick: () => {
                OAuther.postRevokeToken(credentials.refresh_token);
                this.storage.deleteCredentials();
                infoToast('Google Drive has been unlinked.', { timeout: 5500 });
                closeLastModal();
              },
            },
          ],
        };
      }

      settings.controls.forEach((control) => panel.append(this.buildSetting(control)));

      const panelHTML = panel.getElement();
      if (settings.description) {
        const description = document.createElement('p');
        description.style = `
                  color: rgb(185, 187, 190);
                  font-size: 16px;
                  line-height: 18px;
                  margin-top: 0;
                  margin-bottom: 0.85rem;
              `;
        description.innerHTML = settings.description;
        panelHTML.prepend(description);
      }

      return panelHTML;
    }
  };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
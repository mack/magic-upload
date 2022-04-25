/**
 * @name MagicUpload
 * @website https://github.com/mack/magic-upload
 * @source
 */

module.exports = (() => {
  /* ========== Required Dependencies ========== */
  const http = require('http');
  const https = require('https');
  const url = require('url');
  const crypto = require('crypto');
  const fs = require('fs');

  const moduleDispatcher = global.BdApi.findModuleByProps('dirtyDispatch');
  const moduleFileCheck = global.BdApi.findModuleByProps('anyFileTooLarge', 'maxFileSize');
  const moduleFileUpload = global.BdApi.findModuleByProps('instantBatchUpload', 'upload');
  const moduleMessageActions = global.BdApi.findModuleByProps('sendMessage');
  const moduleButtonElement = global.BdApi.findModuleByProps('BorderColors');
  const moduleModalActions = global.BdApi.findModuleByProps('useModalsStore', 'closeModal');
  const moduleAttachmentUpload = global.BdApi.findAllModules(
    (m) => m.AttachmentUpload,
  )[0].AttachmentUpload;
  const moduleMessageClasses = global.BdApi.findAllModules(
    (m) => m.avatar && m.messageContent && m.alt,
  )[0];
  const moduleMoreMessageClasses = global.BdApi.findModuleByProps('groupStart');
  const moduleMessageScrollerClasses = global.BdApi.findModuleByProps('scrollerSpacer');

  /* ========== Global Constants & Internal Config ========== */
  const config = {
    meta: {
      version: '0.0.1',
      name: 'MagicUpload',
      description: '🧙‍♀️ A BetterDiscord plugin to automagically upload files over 8MB.',
      authors: [{
        name: 'mack',
        discord_id: '365247132375973889',
        github_username: 'mack',
      }],
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
  const OAUTH_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${config.oauth.handler.host}:${config.oauth.handler.port}&response_type=code&client_id=${config.oauth.clientId}`;
  const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  const OAUTH_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
  const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
  const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
  const DRIVE_READ_ROLE = 'reader';
  const DRIVE_ANYONE_GRANTEE = 'anyone';
  const SUCCESS_HTML = () => '<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">✅ You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); </script> </body></html>';
  const ERROR_HTML = (props) => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${props.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); </script> </body></html>`;

  /* ========== Miscellaneous Helper Functions ========== */
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

  class Message {
    constructor(messageContent, channelId, timestamp, name, avatarUrl) {
      this.channelId = channelId;
      const messageContainer = document.createElement('li');
      const messageWrapper = document.createElement('div');

      const message = document.createElement('div');
      message.className = `${moduleMessageClasses.cozy} ${moduleMoreMessageClasses.groupStart} ${moduleMessageClasses.wrapper}`;

      const avatar = document.createElement('img');
      avatar.src = avatarUrl;
      avatar.className = moduleMessageClasses.avatar;
      message.appendChild(avatar);

      const header = document.createElement('h2');
      const username = document.createElement('span');
      username.innerHTML = name;
      username.className = `${moduleMessageClasses.headerText} ${moduleMessageClasses.username}`;
      header.appendChild(username);

      const time = document.createElement('span');
      time.className = `${moduleMessageClasses.timestamp} ${moduleMessageClasses.timestampInline}`;
      time.innerHTML = timestamp;
      header.appendChild(time);

      message.appendChild(header);

      if (messageContent instanceof HTMLElement) {
        message.appendChild(messageContent);
      } else {
        message.innerText += messageContent;
      }

      messageWrapper.appendChild(message);
      messageContainer.appendChild(messageWrapper);
      this.messageContainer = messageContainer;
    }

    element() {
      return this.messageContainer;
    }

    destination() {
      return this.channelId;
    }

    show() {
      const scrollerInner = document.querySelector(`.${moduleMessageScrollerClasses.scrollerInner}`);
      const scrollerSpacer = document.querySelector(`.${moduleMessageScrollerClasses.scrollerSpacer}`);

      console.log(scrollerInner);
      if (scrollerInner) scrollerInner.insertBefore(this.messageContainer, scrollerSpacer);
    }

    destroy() {
      if (this.messageContainer) {
        this.messageContainer.remove();
      }
    }
  }

  class UploadAttachment extends Message {
    constructor(destination, fileName, fileSize, initalProgress, onCancelUpload) {
      const container = document.createElement('div');
      const attachment = global.BdApi.React.createElement(moduleAttachmentUpload, {
        filename: fileName,
        size: fileSize,
        progress: initalProgress,
        onCancelUpload,
      });
      global.BdApi.ReactDOM.render(attachment, container);
      super(container, destination, 'Upload via MagicUpload', 'Mack', 'https://cdn.discordapp.com/avatars/365247132375973889/21de00407bd97f7077c32f83558a997c.webp?size=160');
      this.attachment = attachment;
      this.container = container;
    }

    setProgress(progress) {
      const newProgress = Math.min(Math.max(progress, 0), 100);
      this.attachment.props.progress = newProgress;
      const progressBarClass = this.container.innerHTML.match(/class="(progressBar-[^\s"]*)/)[1];
      const progressBar = this.container.querySelector(`.${progressBarClass}`);
      progressBar.style.transform = `translate3d(-${100 - this.attachment.props.progress}%, 0px, 0px)`;
    }

    progress() {
      return this.attachment.props.progress;
    }
  }

  class XUtil {
    static log(...message) {
      XUtil.console(message, 'log');
    }

    static info(message) {
      XUtil.console(message, 'info');
    }

    static warn(message) {
      XUtil.console(message, 'warn');
    }

    static err(message) {
      XUtil.console(message, 'err');
    }

    static console(message, type) {
      const consoleTypes = {
        log: 'log',
        info: 'info',
        dbg: 'debug',
        debug: 'debug',
        warn: 'warn',
        err: 'error',
        error: 'error',
      };
      const parsedType = Object.prototype.hasOwnProperty.call(consoleTypes, type) ? consoleTypes[type] : 'log';
      let parsedMessage = message;
      if (!Array.isArray(message)) parsedMessage = [parsedMessage];
      console[parsedType](`%c[${config.meta.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', ...parsedMessage);
    }

    static optionsWithAuth(options, storage) {
      const modifiedOptions = options;
      const accessToken = storage.getAccessToken();
      if (accessToken) {
        modifiedOptions.headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
      }
      return options;
    }

    static encrypt(plain) {
      const { algorithm, secretKey, iv } = config.storage;
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);

      return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
      };
    }

    static decrypt(hash) {
      const { algorithm, secretKey } = config.storage;
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
      if (Array.isArray(window.magicUploadOverrides)) {
        window.magicUploadOverrides.forEach((cancel) => cancel());
      }
    }
  }

  /* ========== File Uploader ========== */
  class FileUploader {
    static sendFileLinkMessage(file, link) {
      XUtil.log(`Sending file share link to channel: ${file.mu_destination}.`);
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
      this.uploadAttachments = {};
      this.handleChannelSelect = (e) => this.checkForAttachments(e.channelId);
      moduleDispatcher.subscribe('CHANNEL_SELECT', this.handleChannelSelect);
      this.continue();
    }

    cleanup() {
      moduleDispatcher.unsubscribe('CHANNEL_SELECT', this.handleChannelSelect);
    }

    checkForAttachments(channelId) {
      Object.keys(this.uploadAttachments).forEach((streamLocation) => {
        if (this.uploadAttachments[streamLocation].destination() === channelId) {
          // Add slight delay to account for DOM loading.
          setTimeout(() => {
            this.uploadAttachments[streamLocation].show();
          }, 200);
        }
      });
    }

    cancelFileHandler(streamLocation) {
      // maybe use this.cancelQueue = {} and check for any values while uploading.
      // cancel if we find our stream location there
      return () => {
        //
      };
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
                  (driveItem, file, err) => {
                    // Completed upload. Remove from registry and
                    // handle successful and unsuccessful completed uploads.
                    this.unregisterUpload(streamLocation);
                    if (err === null) {
                      // Upload was successful, add permissions and share!
                      XUtil.info(`${file.name} has been successfully uploaded to Google Drive.`);
                      this.share(driveItem.id, () => {
                        XUtil.info(`${file.name} permissions have been updated to "anyone with link.`);
                        FileUploader.sendFileLinkMessage(file, getDriveLink(driveItem.id));
                      });
                    } else {
                      XUtil.err('Upload has failed.');
                      errorToast(`Upload failed ${truncate(file.name, 35)}`);
                    }
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
      return this.storage.load(config.storage.uploadsKey) || {};
    }

    registerUpload(streamLocation, file) {
      XUtil.log('Registering new file into upload registry.');
      const fileCopy = JSON.parse(JSON.stringify(file));
      const registry = this.getRegisteredUploads();
      registry[streamLocation] = fileCopy;
      this.storage.store(config.storage.uploadsKey, registry);
    }

    unregisterUpload(streamLocation) {
      XUtil.log('Unregistering upload from upload registry.');
      const registry = this.getRegisteredUploads();
      delete registry[streamLocation];
      this.storage.store(config.storage.uploadsKey, registry);
    }

    getStreamStatus(streamLocation, callback) {
      const options = XUtil.optionsWithAuth({
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
      // Check to see if there is an existing message attachment.
      // If none, create a new one.
      if (!this.uploadAttachments[streamLocation]) {
        this.uploadAttachments[streamLocation] = new UploadAttachment(
          file.mu_destination,
          file.name,
          file.size,
          0,
          this.cancelFileHandler(file),
        );
        this.uploadAttachments[streamLocation].show();
      }

      const { uploadAttachments } = this;
      const accessToken = this.storage.getAccessToken();
      // const unregisterUpload = this.storage.unregisterUpload;
      const CHUNK_SIZE = config.upload.chunkMultiplier * 256 * 1024;

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
            uploadAttachments[streamLocation].setProgress((start / total) * 100);
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
                    uploadAttachments[streamLocation].destroy();
                    delete uploadAttachments[streamLocation];
                    successToast(`Successfully uploaded ${truncate(file.name, 35)}`);
                    callback(JSON.parse(responseData), file, null);
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
      const options = XUtil.optionsWithAuth({
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
      const options = XUtil.optionsWithAuth({
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
          this.streamChunks(streamLocation, file, 0, (driveItem, file, err) => {
            // Completed upload. Remove from registry and
            // handle successful and unsuccessful completed uploads.
            this.unregisterUpload(streamLocation);
            if (err === null) {
              // Upload was successful, add permissions and share!
              XUtil.info(`${file.name} has been successfully uploaded to Google Drive.`);
              this.share(driveItem.id, () => {
                XUtil.info(`${file.name} permissions have been updated to "anyone with link.`);
                FileUploader.sendFileLinkMessage(file, getDriveLink(driveItem.id));
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
      const { credentialsKey } = config.storage;
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
        client_id: config.oauth.clientId,
        client_secret: config.oauth.clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: `http://${config.oauth.handler.host}:${config.oauth.handler.port}`,
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
        client_id: config.oauth.clientId,
        client_secret: config.oauth.clientSecret,
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

    constructor(storage, flowCompleted) {
      this.storage = storage;
      this.server = http.createServer((req, res) => {
        const { query } = url.parse(req.url, true);
        if (query.code) {
          XUtil.log('Recieved authorization code.');
          OAuther.postAccessToken(query.code, (credentials) => {
            if (credentials.access_token && credentials.refresh_token) {
              XUtil.log('Exchanged authorization code for access and refresh tokens.');
              this.storage.store(config.storage.credentialsKey, credentials, true);
              res.writeHeader(HTTP_CODE_OK, { 'Content-Type': 'text/html' });
              res.write(SUCCESS_HTML());
              successToast('Google Drive connected!', { timeout: 5500 });
              if (flowCompleted) flowCompleted();
            } else {
              XUtil.err('Failed to retrieve access and refresh tokens.');
              res.writeHeader(HTTP_CODE_INTERNAL_ERR, { 'Content-Type': 'text/html' });
              res.write(ERROR_HTML({ error_message: JSON.stringify(credentials) }));
              errorToast('An error occured connecting Google Drive', { timeout: 5500 });
            }
            res.end();
            this.cleanup();
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
      const { port, host } = config.oauth.handler;
      this.server.listen(port, host, () => {
        XUtil.log(`Listening for OAuth redirects on http://${host}:${port}...`);
        if (callback) callback();
      });
    }

    cleanup(callback) {
      if (this.server.listening) {
        this.server.close(callback);
      }
    }

    refresh(callback) {
      const credentials = this.storage.load(config.storage.credentialsKey, true);
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
  return class MagicUpload {
    getName() { return config.meta.name; }

    getAuthor() { return config.meta.authors.map((a) => a.name).join(', '); }

    getDescription() { return config.meta.description; }

    getVersion() { return config.meta.version; }

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
    load() {
      this.storage = new StorageHandler(this.getName());
      this.oauther = new OAuther(this.storage, this.overrideDiscordUpload);
      this.uploader = new FileUploader(this.storage, this.oauther);
    }

    overrideDiscordUpload() {
      /* Patch upload methods */
      XUtil.log('Overriding default file upload functionality.');
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
          const realUploadLimit = moduleFileCheck.maxFileSize('', true);
          if (upload.item.file.size < realUploadLimit) {
            // File is within discord upload limit, upload as normal
            XUtil.info(`File "${upload.item.file.name}" is within discords upload limit, using default file uploader.`);
            const argsCopy = { ...originalArguments };
            argsCopy.uploads = [upload];
            originalMethod.apply(thisObject, [argsCopy]);
          } else {
            XUtil.info(`File "${upload.item.file.name}" exceeds upload limit, using ${config.meta.name} uploader.`);
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

    start() {
      XUtil.log('MagicUpload has started.');
      if (!this.storage.getAccessToken()) {
        // No token found. Prompt user to connect Google Drive.
        this.openOAuthPrompt();
      } else {
        this.overrideDiscordUpload();
      }
    }

    stop() {
      XUtil.log('MagicUpload has stopped.');
      XUtil.clearOverrides();
      this.oauther.cleanup();
      this.uploader.cleanup();
    }

    getSettingsPanel() {
      const credentials = this.storage.load(config.storage.credentialsKey, true);
      const ua = new UploadAttachment('someFileName', 23, 0, () => { ua.setProgress(ua.progress() + 5); });
      const settings = document.createElement('div');
      if (credentials) {
        // console.log("SETINGINSINGG")
        /* No OAuth Setting UI */
        // const header = document.createElement('h1');
        // const onClick = () => {console.log("CLICKED")};
        // const reactButton = global.BdApi.React.createElement(attach, {
        //   children: 'this.name',
        //   note: 'this.note',
        //   value: 'this.value',
        // });
        // global.BdApi.ReactDOM.render(reactButton, test);
        // header.innerHTML = "This is a header";
        // settings.appendChild(header);
      } else {
        /* Default Setting UI */
        const header = document.createElement('h1');
        header.innerHTML = 'This is a header';
        settings.appendChild(header);
      }

      return ua.element();
    }
  };
})();

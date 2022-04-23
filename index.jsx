/*
    TODOS:
        - Change this.accessToken to just use getCredentials
        - Have an OAuth class to handle all the oauth logic
        - Have a file uploader class to handle upload logic
*/
module.exports = (Plugin, Library) => {
    "use strict";

    /*========== Required Dependencies ==========*/
    const http = require("http");
    const https = require("https");
    const url = require("url");
    const crypto = require("crypto");
    const fs = require("fs");

    const { Logger, Patcher, WebpackModules } = Library;
    const _fileCheckMod = WebpackModules.getByProps("anyFileTooLarge", "maxFileSize");
    const _fileUploadMod = WebpackModules.getByProps("instantBatchUpload", "upload");
    const _button = BdApi.findModuleByProps("BorderColors");
    const _modalsApi = BdApi.findModuleByProps("useModalsStore", "closeModal");

    /*========== Global Constants & Plugin Config ==========*/
    const INTERNAL_CONFIG = {
        oauth: {
            handler: {
                port: 29842,
                host: "localhost",
            },
            storage: {
                algorithm: 'aes-256-ctr',
                secretKey: 'jXn2r5u8x/A?D*G-KaPdSgVkYp3s6v9y',
                iv: crypto.randomBytes(16),
                credentialsKey: "_magicupload_oa_gd"
            },
            clientId: "911268808772-r7sa3s88f2o36hdcu9g4tmih6dbo4n77.apps.googleusercontent.com",
            clientSecret: "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"
        }
    }
    const OAUTH_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${INTERNAL_CONFIG.oauth.handler.host}:${INTERNAL_CONFIG.oauth.handler.port}&response_type=code&client_id=${INTERNAL_CONFIG.oauth.clientId}`
    const OAUTH_TOKEN_URL = `https://oauth2.googleapis.com/token`
    const OAUTH_REVOKE_URL = `https://oauth2.googleapis.com/revoke`
    const GOOGLE_DRIVE_URL = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`
    const SUCCESS_HTML = () => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">✅ You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); </script> </body></html>`;
    const ERROR_HTML = (props) => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${props.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); </script> </body></html>`;

    /*========== Miscellaneous Helper Functions ==========*/
    const closeLastModal = () => {
        const lastModal = _modalsApi.useModalsStore.getState().default[0];
        if (lastModal) {
            _modalsApi.closeModal(lastModal.key);
        }
    }
    const successToast = (content, overrides) => BdApi.showToast(content, { type: "success", ...overrides });
    const infoToast = (content, overrides) => BdApi.showToast(content, { type: "info", ...overrides });
    const warnToast = (content, overrides) => BdApi.showToast(content, { type: "warning", ...overrides });
    const errorToast = (content, overrides) => BdApi.showToast(content, { type: "error", ...overrides });

    /*========== File Uploader ==========*/
    class FileUploader {
        constructor(storage) {
            this.storage = storage;
            this.backlog = [];
            this.intransit = [];
        }

        upload(file) {

        }

        startStream(file) {
            const body = {
                name: file.name,
                mimeType: file.type
            }
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Content-Length': file.size
                },
                body: JSON.stringify(body)
            }
            console.log("using access token "+this.accessToken);
            
            fetch(GOOGLE_DRIVE_URL, options).then(response => {
                if (response.status == 200) {
                    const loc = response.headers.get('Location');
                    this.chunkUpload(file, loc);
                } else if (response.status == 401 && !retry) {
                    // Attempt to refresh access token and retry request
                    const { refresh_token } = this.getCredentials();
                    if (refresh_token) {
                        Logger.warn('Access token failed. Attempting to refresh token.');
                        refreshAccessToken(refresh_token, ({ access_token }) => {
                            if (access_token) {
                                Logger.log('Successfully refreshed access token.');
                                console.log('new access token'+access_token);
                                this.updateAccessToken(access_token);
                                this.uploadFile(file, true);
                            } else {
                                Logger.err('Something went wrong. Clearing OAuth credentials.');
                                this.deleteCredentials();
                            }
                        })    
                    } else {
                        Logger.err('Something went wrong. Clearing OAuth credentials.');
                        this.deleteCredentials();
                    }
                }
            })
        }
    }

    /*========== Persistant Storage ==========*/
    class StorageHandler {
        constructor(pluginName) {
            this.pluginName = pluginName;
        }
        encrypt(plain) {
            const { algorithm, secretKey, iv } = INTERNAL_CONFIG.oauth.storage;
            const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
            const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    
            return {
                iv: iv.toString("hex"),
                content: encrypted.toString("hex")
            };
        };
        decrypt(hash) {
            const { algorithm, secretKey } = INTERNAL_CONFIG.oauth.storage;
            const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, "hex"));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, "hex")), decipher.final()]);
            return decrpyted.toString();
        };
        load(key, decrypt) {
            var data = BdApi.loadData(this.pluginName, key);
            if (data) {
                data = JSON.parse(data);
                data = decrypt ? JSON.parse(this.decrypt(data)) : data;
                return data;
            }
        }
        store(obj, key, encrypt) {
            var data = JSON.stringify(obj);
            if (encrypt) data = JSON.stringify(this.encrypt(data))
            BdApi.saveData(this.pluginName, key, data);
            return obj;
        }
        delete(key) {
            BdApi.deleteData(this.pluginName, key);
        }
    }

    /*========== OAuth Logic ==========*/
    class OAuther {
        constructor(storage) {
            this.storage = storage;
            this.server = http.createServer((req, res) => {
                const { query } = url.parse(req.url, true)
                console.log("can handle a request");
                if (query.code) {
                    Logger.log(`Recieved authorization code.`);
                    this.requestAccessToken(query.code, credentials => {
                        const { access_token, refresh_token } = credentials;
                        if (access_token && refresh_token) {
                            Logger.log(`Exchanged authorization code for access and refresh tokens.`);
                            this.storage.store(credentials, INTERNAL_CONFIG.oauth.storage.credentialsKey, true);
                            res.writeHeader(200, {"Content-Type": "text/html"});
                            res.write(SUCCESS_HTML());
                            successToast("Google Drive connected!", { timeout: 5500 });
                        } else {
                            Logger.err(`Failed to retrieve access and refresh tokens.`);
                            res.writeHeader(500, {"Content-Type": "text/html"});
                            res.write(ERROR_HTML({ error_message: JSON.stringify(credentials) }));
                            errorToast("An error occured connecting Google Drive", { timeout: 5500 });
                        }
                        res.end();
                        this.shutdownHandler();
                    });
                }
            });
        }
        activateHandler(callback) {
            if (this.server.listening) {
                callback();
                return;
            }
            const { port, host } = INTERNAL_CONFIG.oauth.handler;
            this.server.listen(port, host, () => {
                Logger.log(`Listening for OAuth redirects on http://${host}:${port}...`);
                if (callback) callback();
            });
        }
        shutdownHandler(callback) {
            this.server.close(callback);
        }
        requestAccessToken(authorizationCode, callback) {
            const body = new URLSearchParams({
                client_id: INTERNAL_CONFIG.oauth.clientId,
                client_secret: INTERNAL_CONFIG.oauth.clientSecret,
                code: authorizationCode,
                grant_type: "authorization_code",
                redirect_uri: `http://${INTERNAL_CONFIG.oauth.handler.host}:${INTERNAL_CONFIG.oauth.handler.port}`
            }).toString()
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: body
            }
            fetch(OAUTH_TOKEN_URL, options).then(response => response.json()).then(data => {
                if (callback) callback(data);
            });
        }
        refreshAccessToken(refreshToken, callback) {
            const body = new URLSearchParams({
                client_id: INTERNAL_CONFIG.oauth.clientId,
                client_secret: INTERNAL_CONFIG.oauth.clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }).toString()
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: body
            }
            fetch(OAUTH_TOKEN_URL, options).then(response => response.json()).then(data => {
                if (callback) callback(data);
            });
        }
        revokeToken(token) {
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            fetch(OAUTH_REVOKE_URL+`?token=${token}`, options).then(response => {
                if (response.status == 200) {
                    Logger.log('Token has successfully been revoked.');
                } else {
                    Logger.warn("Unable to revoke OAuth token.")
                }
            })
        }
    }

    /*==========  Magic Upload Plugin ==========*/
    return class MagicUpload extends Plugin {
        optionsWithAuth(options) {
            options.headers = {
                ...options.headers,
                'Authorization': 'Bearer ' + this.getAccessToken(),
            }
            return options;
        }
    
        /*========== OAuth Handlers ==========*/
        startOAuthConsentFlow() {
            this.oauther.activateHandler(() => {
                Logger.log('Sending user to OAuth consent flow.');
                window.open(OAUTH_AUTH_URL);
            })
        }
        /**
         * Open a BetterDiscord prompt asking the user
         * to start an OAuth flow.
         */
        openOAuthPrompt() {
            BdApi.showConfirmationModal("🔌 Connect your Google Drive", `Magic Upload requires Google Drive. To use this plugin you must connect your Google account.`, {
                confirmText: "Connect Google Account",
                cancelText: "Disable Plugin",
                onConfirm: () => {
                    this.startOAuthConsentFlow();
                },
                onCancel: () => {
                    BdApi.Plugins.disable(this.getName());
                }
            });
        }

        /*========== File Upload Methods ==========*/
        chunkUpload(file, location) {
            const accessToken = this.getAccessToken();

            var CHUNK_SIZE = 10 * 256 * 1024,
                buffer = Buffer.alloc(CHUNK_SIZE),
                filePath = file.path;

            var n_chunk = 0;

            fs.open(filePath, 'r', function(err, fd) {
            if (err) throw err;
            const readNextChunk = () => {
                fs.read(fd, buffer, 0, CHUNK_SIZE, null, (err, nread) => {
                    n_chunk++;
                    if (err) throw err;

                    if (nread === 0) {
                        console.log('out of bytes to read...')
                        fs.close(fd, function(err) {
                        if (err) throw err;
                        });
                        return;
                    }

                    var data;
                    if (nread < CHUNK_SIZE){
                        console.log('at the end...');
                        data = buffer.slice(0, nread);
                    } else {
                        data = buffer;
                    }

                    const urlParse = new URL(location);
                    const startChunk = (CHUNK_SIZE * (n_chunk - 1));
                    const endChunk = (Math.min(CHUNK_SIZE * n_chunk, file.size))-1
                    const options = {
                        host: urlParse.host,
                        path: urlParse.pathname+urlParse.search,
                        search: urlParse.search,
                        href: urlParse.href,
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Length': Math.min(data.length, file.size),
                            'Content-Range': `bytes ${startChunk}-${endChunk}/${file.size}`
                        },
                    }

                    console.log("Uploading chunk... #" + n_chunk + " range: " +startChunk + "-" + endChunk + " out of "  + file.size);
                    var req = https.request(options, function(res) {
                        console.log("statusCode: ", res.statusCode); // <======= Here's the status code
                        console.log("headers: ", res.headers);
                        res.on('data', function (chunk) {
                            console.log(res);
                            console.log('BODY: ' + chunk);
                        });
                        readNextChunk();
                    });
                    
                    req.write(data);
                    req.end();
                });
            }
            readNextChunk();
            });
        }
        /**
         * Uploads a specified file to Google Drive.
         * @param {File} file - The file to upload
         */
        uploadFile(file, retry) {
            const body = {
                name: file.name,
                mimeType: file.type
            }
            const options = this.optionsWithAuth({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Content-Length': file.size
                },
                body: JSON.stringify(body)
            })
            console.log("using access token "+this.getAccessToken());
            
            fetch(GOOGLE_DRIVE_URL, options).then(response => {
                if (response.status == 200) {
                    const loc = response.headers.get('Location');
                    this.chunkUpload(file, loc);
                } else if (response.status == 401 && !retry) {
                    // Attempt to refresh access token and retry request
                    const { refresh_token } = this.storage.load(INTERNAL_CONFIG.oauth.storage.credentialsKey, true);
                    if (refresh_token) {
                        Logger.warn('Access token failed. Attempting to refresh token.');
                        refreshAccessToken(refresh_token, ({ access_token }) => {
                            if (access_token) {
                                Logger.log('Successfully refreshed access token.');
                                console.log('new access token'+access_token);
                                this.updateAccessToken(access_token);
                                this.uploadFile(file, true);
                            } else {
                                Logger.err('Something went wrong. Clearing OAuth credentials.');
                                this.deleteCredentials();
                            }
                        })    
                    } else {
                        Logger.err('Something went wrong. Clearing OAuth credentials.');
                        this.deleteCredentials();
                    }
                }
            })
        }

        patchDiscordFileUpload() {
            Logger.log('Patching Discord file modules.');
            // fileCheckMod.maxFileSize(_, true)
            /*========== Disable upload limit file checks ==========*/
            Patcher.instead(_fileCheckMod, "maxFileSize", (_, args, original) => {
                const [arg, useOriginal] = args;
                if (useOriginal == true) {
                    return original(arg);
                }
                return Number.MAX_VALUE;
            });
            Patcher.instead(_fileCheckMod, "anyFileTooLarge", () => {
                return false;
            });
            Patcher.instead(_fileCheckMod, "uploadSumTooLarge", () => {
                return false;
            })
            Patcher.instead(_fileCheckMod, "getUploadFileSizeSum", () => {
                return 0;
            })

            /*========== Handle file uploads ==========*/
            Patcher.instead(_fileUploadMod, "uploadFiles", (_, [ args ], original) => {
                const { uploads } = args;
                uploads.forEach(upload => {
                    if (upload.item.file.size < this.uploadLimit && false) {
                        // File is within discord upload limit, upload as normal
                        const argsCopy = Object.assign({}, args);
                        argsCopy.uploads = [upload];
                        original(argsCopy);
                    } else {
                        // File exceeds upload limit
                        // this.uploadFile(file)
                        // this.sendFileLink() 
                        this.uploadFile(upload.item.file);
                        // original(args);
                    }
                })
            })
        }

        /*========== Plugin Lifecycle Methods ==========*/
        init() {
            this.storage = new StorageHandler(this.getName());
            this.oauther = new OAuther(this.storage);
            this.uploader = new FileUploader(this.storage);

            /* Plugin helper functions */
            this.getAccessToken = () => {
                const credentials = this.storage.load(INTERNAL_CONFIG.oauth.storage.credentialsKey, true);
                return credentials && credentials.access_token;
            }
            this.deleteCredentials = () => this.storage.delete(INTERNAL_CONFIG.oauth.storage.credentialsKey);
            // Get the "real" upload limit
            this.uploadLimit = () => _fileCheckMod.maxFileSize(_, true);
        }
        onStart() {
            this.init();
            if (!this.getAccessToken()) {
                // No token found. Prompt user to connect Google Drive.
                // this.openOAuthPrompt()
            } else {
                // OAuth has been enabled. Override upload methods.
                // this.patchDiscordFileUpload();
            }
            this.oauther.activateHandler(() => {console.log("can start handler")})
        }
        onStop() {
            Logger.log("MagicUpload has stopped...");
            this.oauther.shutdownHandler();
            Patcher.unpatchAll();
        }
        buildSetting(data) {
            class Button extends ZLibrary.Settings.SettingField {
                constructor(name, note, value, onClick) {
                    const style = {
                        display: 'flex',
                        // justifyContent: 'flex-end'
                    }
                    const _reactButton = BdApi.React.createElement(_button, { onClick }, value);

                    super(name, note, _, props => BdApi.React.createElement("div", {...props, style}, _reactButton), {});
                }
            }
            const { name, note, type, value, onClick } = data;
            if (type == "button") {
                return new Button(name, note, value, onClick)
            }
            return super.buildSetting(data);
        }
        getSettingsPanel() {
            const panel = this.buildSettingsPanel();
            const credentials = this.storage.load(INTERNAL_CONFIG.oauth.storage.credentialsKey, true);

            var settings;
            if (!credentials) {
                /* No OAuth Setting UI */
                settings = {
                    description: `🔌 Hello! It looks like you haven't given access to your Google Drive. 
                        This plugin <i>requires</i> you to sign in with Google in order to function.`,
                    controls: [
                        {
                            type: "button",
                            value: "Connect Google Account",
                            onClick: () => { 
                                this.startOAuthConsentFlow();
                                closeLastModal();
                            }
                        },
                    ]
                }
            } else {
                /* Default Setting UI */
                settings = {
                    controls: [
                        {
                            type: "switch",
                            id: "automatic_file_upload",
                            name: "Automatic file uploading",
                            note: "Do not prompt me when uploading files that exceed the upload limit.",
                            value: true,
                            onChange: (val) => console.log("CHANGINGINSDGINGING")
                        },
                        {
                            type: "switch",
                            id: "rich_embed",
                            name: "Google Drive embeds",
                            note: "Attempt to display an embedded preview of content from google drive links.",
                            value: true,
                            onChange: (val) => console.log("CHANGINGINSDGINGING")
                        },
                        {
                            type: "textbox",
                            id: "access_token",
                            name: "Google Drive access token",
                            note: "This value is immutable.",
                            value: credentials ? credentials.access_token : ""
                        },
                        {
                            type: "textbox",
                            id: "refresh_token",
                            name: "Google Drive refresh token",
                            note: "This value is immutable.",
                            value: credentials ? credentials.refresh_token : ""
                        },
                        {
                            type: "button",
                            value: "Unlink Google Drive",
                            onClick: () => {
                                this.oauther.revokeToken(credentials.refresh_token);
                                this.deleteCredentials();
                                infoToast("Google Drive has been unlinked.", { timeout: 5500 });
                                closeLastModal();
                            }
                        },
                    ]
                }
            }

            settings.controls.forEach(control => panel.append(this.buildSetting(control)));

            const panelHTML = panel.getElement();
            if (settings.description) {
                const description = document.createElement("p");
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
}
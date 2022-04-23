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

    const fileCheckMod = WebpackModules.getByProps("anyFileTooLarge", "maxFileSize");
    const fileUploadMod = WebpackModules.getByProps("instantBatchUpload", "upload");

    const _button = BdApi.findModuleByProps("BorderColors");
    const _modalsApi = BdApi.findModuleByProps("useModalsStore", "closeModal");

    /*========== Constants & Global App Config ==========*/
    const config = {
        oauth: {
            handler: {
                port: 29842,
                host: "localhost",
            },
            storage: {
                algorithm: 'aes-256-ctr',
                secretKey: 'jXn2r5u8x/A?D*G-KaPdSgVkYp3s6v9y',
                iv: crypto.randomBytes(16),
            },
            clientId: "911268808772-r7sa3s88f2o36hdcu9g4tmih6dbo4n77.apps.googleusercontent.com",
            clientSecret: "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"
        }
    }

    const CREDENTIALS_KEY = "_magicupload_oa_gd"
    const OAUTH_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${config.oauth.handler.host}:${config.oauth.handler.port}&response_type=code&client_id=${config.oauth.clientId}`
    const OAUTH_TOKEN_URL = `https://oauth2.googleapis.com/token`
    const OAUTH_REVOKE_URL = `https://oauth2.googleapis.com/revoke`
    const GOOGLE_DRIVE_URL = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`

    const SUCCESS_HTML = () => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">✅ You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); </script> </body></html>`;
    const ERROR_HTML = (props) => `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${props.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); </script> </body></html>`;

    class FileUploader {
        constructor(accessToken) {
            this.accessToken = accessToken;
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

    /*========== Helpers ==========*/
    function closeLastModal() {
        const lastModal = _modalsApi.useModalsStore.getState().default[0];
        if (lastModal) {
            _modalsApi.closeModal(lastModal.key);
        }
    }

    /*========== OAuth 2.0 Helpers ==========*/
    function revokeToken(token) {
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
        fetch(OAUTH_REVOKE_URL+`?token=${token}`, options).then(response => {
            if (response.status == 200) {
                Logger.log('Token has successfully been revoked.');
            }
        })
    }
    
    function refreshAccessToken(refreshToken, callback) {
        const body = new URLSearchParams({
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
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
    function requestAccessToken(authorizationCode, callback) {
        const body = new URLSearchParams({
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
            code: authorizationCode,
            grant_type: "authorization_code",
            redirect_uri: `http://${config.oauth.handler.host}:${config.oauth.handler.port}`
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

    /*========== Encryption Helpers ==========*/
    function encrypt(plain) {
        const { algorithm, secretKey, iv } = config.oauth.storage;
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);

        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex')
        };
    };
    function decrypt(hash) {
        const { algorithm, secretKey } = config.oauth.storage;
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

        return decrpyted.toString();
    };

    /*========== Magic Upload Plugin ==========*/
    return class MagicUpload extends Plugin {
        /*========== OAuth Credential Storage Logic ==========*/
        /**
         * Store the OAuth credentials in persistant storage. Encrypt to
         * prevent other plugins from accessing.
         * @param {object} credentials - access_token, refresh_token, etc.
         */
        storeCredentials(credentials) {
            this.accessToken = credentials.access_token;
            const jsonCredentials = JSON.stringify(credentials);
            const hash = JSON.stringify(encrypt(jsonCredentials));
            BdApi.saveData(this.getName(), CREDENTIALS_KEY, hash);
        }
        /**
         * Retrieve the stored credentials and decrypt them.
         */
        getCredentials() {
            const hash = BdApi.loadData(this.getName(), CREDENTIALS_KEY);
            if (hash) {
                const hashObj = JSON.parse(hash);
                return JSON.parse(decrypt(hashObj));
            }
        }
        /**
         * Delete the existing credentials from persistent storage
         * forcing the user to perform another OAuth flow.
         */
        deleteCredentials() {
            BdApi.deleteData(this.getName(), CREDENTIALS_KEY);
        }
        /**
         * Update the existing credentials with a new access token.
         * @param {string} accessToken - The new access token
         */
        updateAccessToken(accessToken) {
            this.accessToken = accessToken;
            const credentials = this.getCredentials();
            credentials.access_token = accessToken;
            this.storeCredentials(credentials);
        }
    
        /*========== OAuth Handlers ==========*/
        /**
         * Start the OAuth handler webserver.
         */
        startOAuthListener(callback) {
            if (this.server.listening) {
                callback();
                return;
            }

            const { port, host } = config.oauth.handler;
            this.server.listen(port, host, () => {
                Logger.log(`Listening for OAuth callback on http://${host}:${port}...`);
                if (callback) callback()
            });
        }
        /**
         * Stop the OAuth handler webserver.
         */
        stopOAuthListener(callback) {
            this.server.close(callback);
        }
        /**
         * Turn on the OAuth handler webserver
         * and open the OAuth flolw.
         */
        startOAuthFlow() {
            this.startOAuthListener(() => {
                Logger.log(`Sending user to OAuth consent flow.`);
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
                    this.startOAuthFlow();
                },
                onCancel: () => {
                    BdApi.Plugins.disable(this.getName());
                }
            });
        }

        /*========== File Upload Methods ==========*/
        chunkUpload(file, location) {
            const accessToken = this.accessToken;

            var CHUNK_SIZE = 10 * 256 * 1024;
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
        /**
         * Patches discord's file checks allowing
         * us to add our own logic when uploading large
         * files.
         */
        patchDiscordFileUpload() {
            Logger.log('Patching Discord file modules.');
            // fileCheckMod.maxFileSize(_, true)
            /*========== Disable upload limit file checks ==========*/
            Patcher.instead(fileCheckMod, "maxFileSize", (_, args, original) => {
                const [arg, useOriginal] = args;
                if (useOriginal == true) {
                    return original(arg);
                }
                return Number.MAX_VALUE;
            });
            Patcher.instead(fileCheckMod, "anyFileTooLarge", () => {
                return false;
            });
            Patcher.instead(fileCheckMod, "uploadSumTooLarge", () => {
                return false;
            })
            Patcher.instead(fileCheckMod, "getUploadFileSizeSum", () => {
                return 0;
            })
            // Patcher.instead(fileUploadMod, "upload", (_, props, original) => {
            //     console.log("Upload");
            // })
            // Patcher.instead(fileUploadMod, "instantBatchUpload", (_, props, original) => {
            //     console.log("instantBatchUpload");
            // })

            // https://github.com/BetterDiscord/BetterDiscord/wiki/Creating-Plugins#loaddatapluginname-key
            // Probably want to create an array of inprogressUploads
            // Incase download gets cancelled we can resume

            /*========== Handle file uploads ==========*/
            Patcher.instead(fileUploadMod, "uploadFiles", (_, [ args ], original) => {
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
        /**
         * Helper function to perform any additional variable
         * or plugin initialization on startup.
         */
        init() {
            // Store access token to be easily accessible within plugin
            const credentials = this.getCredentials();
            if (credentials && credentials.access_token) {
                this.accessToken = credentials.access_token;
            }

            // HTTP Server used to listen for OAuth callbacks
            this.server = http.createServer((req, res) => {
                const { pathname, query } = url.parse(req.url, true)
                if (query.code) {
                    Logger.log(`Recieved authorization code.`);
                    requestAccessToken(query.code, (credentials) => {
                        const { access_token, refresh_token } = credentials;
                        if (access_token && refresh_token) {
                            Logger.log(`Recieved access and refresh tokens.`);
                            this.storeCredentials(credentials);
                            res.writeHeader(200, {"Content-Type": "text/html"});
                            res.write(SUCCESS_HTML());
                        } else {
                            Logger.err(`Failed to retrieve access and refresh tokens.`);
                            res.writeHeader(500, {"Content-Type": "text/html"});
                            res.write(ERROR_HTML({ error_message: JSON.stringify(credentials) }));
                        }
                        res.end();
                        this.stopOAuthListener();
                    });
                }
            });

            // Get the real upload limit
            this.uploadLimit = fileCheckMod.maxFileSize(_, true);
        }
        /**
         * Called by BetterDiscord when our plugin is enabled. This is
         * the entry point of our plugin.
         */
        onStart() {
            this.init();
            if (!this.accessToken) {
                // No token found. Prompt user to connect Google Drive.
                this.openOAuthPrompt()
            } else {
                // OAuth has been enabled. Override upload methods.
                this.patchDiscordFileUpload();
            }
        }
        /**
         * Called by BetterDiscord when our plugin is disabled.
         */
        onStop() {
            Logger.log("MagicUpload has stopped...");
            Patcher.unpatchAll();
        }
        /**
         * Override the buildSetting function from BDPluginLibrary
         * @param {object} data - Element meta data
         */
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
        /**
         * Called by BetterDiscord when the settings panel is open
         */
        getSettingsPanel() {
            const panel = this.buildSettingsPanel();
            const credentials = this.getCredentials();

            var settings;
            if (!credentials) {
                // No OAuth Setting UI
                settings = {
                    description: `🔌 Hello! It looks like you haven't given access to your Google Drive. 
                        This plugin <i>requires</i> you to sign in with Google in order to function.`,
                    controls: [
                        {
                            type: "button",
                            value: "Connect Google Account",
                            onClick: () => { 
                                this.startOAuthFlow();
                                closeLastModal();
                            }
                        },
                    ]
                }
            } else {
                // Default Setting UI
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
                                revokeToken(credentials.refresh_token);
                                this.deleteCredentials();
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
module.exports = (Plugin, Library) => {
    "use strict";

    /*========== Required Dependencies ==========*/
    const http = require("http");
    const url = require("url");
    const crypto = require("crypto");

    const { Logger, Patcher, WebpackModules, DiscordModules, DOMTools, PluginUtilities, ContextMenu, Settings } = Library;
    const { SettingPanel, Slider } = Settings;
    const { Dispatcher, React, SelectedChannelStore, SelectedGuildStore, ElectronModule } = DiscordModules;

    const fileCheckMod = WebpackModules.getByProps("anyFileTooLarge", "maxFileSize");
    const fileUploadMod = WebpackModules.getByProps("instantBatchUpload", "upload");

    /*========== Constants & Config ==========*/
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

    const SUCCESS_HTML = `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"></script> </head> <body> <style> .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { max-width: 670px; padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.8); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> & <i class="fa-brands fa-google-drive"></i></h1> <hr> <p class="about">✅ You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"></script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"></script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }) sr.reveal(".header", {delay: 700}) sr.reveal("hr", {delay: 500}) sr.reveal(".about", {delay: 900, origin: "bottom"}) sr.reveal(".help", {delay: 1000, origin: "bottom"}) sr.reveal(".footer", {delay: 800, origin: "bottom"}) const jsConfetti = new JSConfetti() setTimeout(() => { jsConfetti.addConfetti() }, 2000); </script> </body></html>`;

    /*========== OAuth 2.0 Helpers ==========*/
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

        fetch(OAUTH_TOKEN_URL, options).then(response => response.json).then(data => {
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
        constructor(...props) {
            super(...props)

            // HTTP Server is used to listen for OAuth callbacks.
            this.server = http.createServer((req, res) => {
                const { pathname, query } = url.parse(req.url, true)
                if (query.code) {
                    Logger.log(`Recieved authorization code.`);
                    requestAccessToken(query.code, (credentials) => {
                        Logger.log(`Recieved access and refresh tokens.`);
                        this.storeCredentials(credentials);
                        res.writeHeader(200, {"Content-Type": "text/html"});
                        res.write(SUCCESS_HTML);
                        res.end();
                    });
                }
            });
        }
        
        /*========== OAuth Credential Storage Logic ==========*/
        storeCredentials(credentials) {
            const jsonCredentials = JSON.stringify(credentials);
            const hash = JSON.stringify(encrypt(jsonCredentials));
            BdApi.saveData(this.getName(), CREDENTIALS_KEY, hash);
        }
        getCredentials() {
            const hash = BdApi.loadData(this.getName(), CREDENTIALS_KEY);
            if (hash) {
                const hashObj = JSON.parse(hash);
                return JSON.parse(decrypt(hashObj));
            }
        }
        updateAccessToken(accessToken) {
            const credentials = this.getCredentials();
            credentials.access_token = accessToken;
            this.storeCredentials(credentials);
        }
    
        /*========== OAuth Handlers ==========*/
        startOAuthListener(callback) {
            const { port, host } = config.oauth.handler;
            this.server.listen(port, host, () => {
                Logger.log(`Listening for OAuth callback on http://${host}:${port}...`);
                if (callback) callback()
            });
        }

        openOAuthPrompt() {
            BdApi.showConfirmationModal("🔌 Connect your Google Drive", `To use this plugin you must connect your Google account. This plugin uses Google Drive to store files in the background.`, {
                confirmText: "Connect Google Account",
                cancelText: "Disable Plugin",
                onConfirm: () => {
                    this.startOAuthListener(() => {
                        window.open(OAUTH_AUTH_URL);
                    })
                },
                onCancel: () => {
                    console.log("Canceled");
                    // BdApi.Plugins.disable(this.getName())
                }
            });
        }

        onStart() {

            if (!this.getCredentials()) {
                this.openOAuthPrompt()
            }

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

            /* 
            refreshAccessToken(accessToken, ({ access_token }) => {
                if (!access_token) {
                    // If response doesn't have access token, assume
                    // refresh token has expired. Clear credentials and
                    // force user to enter another oauth flow.
                    BdApi.deleteData(this.getName(), CREDENTIALS_KEY);
                } else {
                    // Otherwise, update the access token
                    this.updateAccessToken(access_token);
                }
            })
            */

            // https://github.com/BetterDiscord/BetterDiscord/wiki/Creating-Plugins#loaddatapluginname-key
            // Probably want to create an array of inprogressUploads
            // Incase download gets cancelled we can resume

            /*========== Handle file uploads ==========*/
            Patcher.instead(fileUploadMod, "uploadFiles", (_, props, original) => {
                const file = props[0].uploads[0].item.file
                console.log(file)
                // const reader = new FileReader()
                // reader.onload = function() {


                //     console.log("FILE HAS BEEN READ!")
                // }
                // reader.readAsArrayBuffer(file)
                //                   'Authorization': 'Bearer ya29.A0ARrdaM9RSDZhjyGMxR06A2RgrEMDPxWpYYZz1vCUWAEF3-c8WhPbWKsmIXcF5l_u806a7WJYLli1OlZN-SsBFcOdHDhY9b3gDBq9hk_D2rEaPJwEcmhQ5zJBzaFM1ekLk_2jMMVdnJ_Tj8NDEeiG_3jGspcO',

                const options = {
                    method: 'POST',
                    headers: {
                    'Content-Type': file.type,
                    'Content-Length': file.size,
                    },
                    body: file
                }
                fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media&key=AIzaSyBxIouJvVlo2hhEGa9hUnJigEeHkCzbIuQ", options)
                .then(response => response.json())
                .then(data => console.log(data));

            })

            

            // Patcher.instead(fileUploadMod, "upload", (_, props, original) => {
            //     console.log("Upload");
            // })
            // Patcher.instead(fileUploadMod, "instantBatchUpload", (_, props, original) => {
            //     console.log("instantBatchUpload");
            // })
        }
        
        onStop() {
            Logger.log("MagicUpload has stopped...");
            Patcher.unpatchAll();
            this.server.close();
        }

        getSettingsPanel() {
            const panel = this.buildSettingsPanel();
            // panel.append(this.buildSetting({
            //     type: "switch",
            //     id: "otherOverride",
            //     name: "A second override?!",
            //     note: "wtf is happening here",
            //     value: true,
            //     onChange: value => this.settings["otherOverride"] = value
            // }));

            const { button }  = WebpackModules.getByProps("button")
            const rb = React.createElement(button, {
                value: "test"
            });
            console.log(panel.getElement())
            const element = panel.getElement()

            const textnode = document.createElement("a");
            textnode.innerHTML = "hi there";
            element.prepend(textnode)
            return element;
        }  
    };
}
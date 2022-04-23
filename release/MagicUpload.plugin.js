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
        const plugin = (E,H)=>{"use strict";let I=require("http"),j=require("https"),K=require("url"),w=require("crypto"),k=require("fs"),{Logger:n,Patcher:h,WebpackModules:C}=H,g=C.getByProps("anyFileTooLarge","maxFileSize"),F=C.getByProps("instantBatchUpload","upload"),q=BdApi.findModuleByProps("BorderColors"),A=BdApi.findModuleByProps("useModalsStore","closeModal"),a={oauth:{handler:{port:29842,host:"localhost"},clientId:"911268808772-r7sa3s88f2o36hdcu9g4tmih6dbo4n77.apps.googleusercontent.com",clientSecret:"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"},storage:{algorithm:"aes-256-ctr",secretKey:"jXn2r5u8x/A?D*G-KaPdSgVkYp3s6v9y",iv:w.randomBytes(16),credentialsKey:"_magicupload_oa_creds_gd",uploadsKey:"_magicupload_files_inprogress"}},u=200,U=308,$=401,J=404,Y=500,Z=`https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${a.oauth.handler.host}:${a.oauth.handler.port}&response_type=code&client_id=${a.oauth.clientId}`,O="https://oauth2.googleapis.com/token",V="https://oauth2.googleapis.com/revoke",W="https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",X=()=>'<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"><\/script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">\u2705 You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"><\/script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"><\/script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); <\/script> </body></html>',Q=r=>`<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"><\/script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${r.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"><\/script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"><\/script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); <\/script> </body></html>`,R=(r,e)=>{let t=e.getAccessToken();return t&&(r.headers={...r.headers,Authorization:"Bearer "+t}),r},ee=r=>({lastModified:r.lastModified,lastModifiedDate:r.lastModifiedDate,name:r.name,path:r.path,size:r.size,type:r.type,webkitRelativePath:r.webkitRelativePath}),N=r=>{let e=r.split("-");if(e.length===2)return parseInt(e[1],10)},D=()=>{let r=A.useModalsStore.getState().default[0];r&&A.closeModal(r.key)},te=(r,e)=>BdApi.showToast(r,{type:"success",...e}),oe=(r,e)=>BdApi.showToast(r,{type:"info",...e}),ne=(r,e)=>BdApi.showToast(r,{type:"warning",...e}),se=(r,e)=>BdApi.showToast(r,{type:"error",...e});class ie{constructor(e,t){this.storage=e,this.oauther=t,this.continue()}continue(){let e=this.getRegisteredUploads();for(let t in e)e.hasOwnProperty(t)&&this.getStreamStatus(t,o=>{switch(o.status){case u:this.unregisterUpload(t);break;case U:n.log("Resuming inprogress upload.");let i=N(o.headers.get("Range"));this.streamChunks(t,e[t],i,s=>{console.log(s),this.unregisterUpload(t)});break;case J:this.unregisterUpload(t),this.upload(file);break;default:}})}getRegisteredUploads(){return this.storage.load(a.storage.uploadsKey)||{}}registerUpload(e,t){n.log("Registering new file into upload registry.");let o=JSON.parse(JSON.stringify(t)),i=this.getRegisteredUploads();i[e]=o,this.storage.store(a.storage.uploadsKey,i)}unregisterUpload(e){n.log("Unregistering upload from upload registry.");let t=this.getRegisteredUploads();delete t[e],this.storage.store(a.storage.uploadsKey,t)}getStreamStatus(e,t){let o=R({method:"PUT",headers:{"Content-Length":0,"Content-Range":"bytes 0-*/*"}},this.storage);fetch(e,o).then(i=>{t&&t(i)})}streamChunks(e,t,o,i){let s=this.storage.getAccessToken(),l=10*256*1024,c=Buffer.alloc(l);k.open(t.path,"r",function(m,y){if(m){n.err("Unable to open file.");return}let b=d=>{k.read(y,c,0,l,d,(T,v)=>{if(T){n.err("Unable to read file.");return}var p;v<l?p=c.slice(0,v):p=c;let x=d,G=d+(p.length-1),P=t.size,S=new URL(e),M={host:S.host,path:S.pathname+S.search,method:"PUT",headers:{Authorization:"Bearer "+s,"Content-Length":p.length,"Content-Range":`bytes ${x}-${G}/${P}`}};console.log(M),console.log(e),console.log("Uploading chunk... range: "+x+"-"+G+" out of "+P);let B=j.request(M,function(f){if(f.statusCode===U&&(d=N(f.headers.range),b(d)),f.statusCode===u){var z="";f.on("data",L=>{z+=L}),f.on("close",()=>{k.close(y,L=>{i(JSON.parse(z))})})}});B.write(p),B.end()})};b(o)})}upload(e,t){let o={name:e.name,mimeType:e.type},i=R({method:"POST",headers:{"Content-Type":"application/json; charset=UTF-8","Content-Length":e.size},body:JSON.stringify(o)},this.storage);fetch(W,i).then(s=>{if(console.log(s),s.status===u){let l=s.headers.get("Location"),c=ee(e);this.registerUpload(l,c),this.streamChunks(l,c,0,m=>{this.unregisterUpload(l),console.log(m)})}else if(s.status===$&&!t){n.warn("Access token failed. Attempting to refresh token.");let{refresh_token:l}=this.storage.load(a.storage.credentialsKey,!0);l?this.oauther.refreshAccessToken(l,({access_token:c})=>{c?(n.log("Successfully refreshed access token."),this.storage.patchAccessToken(c),this.upload(e,!0)):(n.warn("Refresh token may have expired. Please reconnect your Google account."),this.storage.deleteCredentials(),this.oauther.launch())}):(n.err("Something went wrong. Clearing OAuth credentials."),this.storage.deleteCredentials())}})}}class re{constructor(e){this.pluginName=e;let{credentialsKey:t}=a.storage;this.deleteCredentials=()=>this.delete(t),this.getAccessToken=()=>{let o=this.load(t,!0);return o&&o.access_token},this.patchAccessToken=o=>{let i=this.load(t,!0);return i.access_token=o,this.store(t,i,!0),o}}encrypt(e){let{algorithm:t,secretKey:o,iv:i}=a.storage,s=w.createCipheriv(t,o,i),l=Buffer.concat([s.update(e),s.final()]);return{iv:i.toString("hex"),content:l.toString("hex")}}decrypt(e){let{algorithm:t,secretKey:o}=a.storage,i=w.createDecipheriv(t,o,Buffer.from(e.iv,"hex"));return Buffer.concat([i.update(Buffer.from(e.content,"hex")),i.final()]).toString()}load(e,t){var o=BdApi.loadData(this.pluginName,e);if(o&&t){let i=Buffer.from(o,"base64").toString("ascii");o=JSON.parse(this.decrypt(JSON.parse(i)))}return o}store(e,t,o){var i;if(o){let s=this.encrypt(JSON.stringify(t));i=Buffer.from(JSON.stringify(s)).toString("base64")}else i=t;BdApi.saveData(this.pluginName,e,i)}delete(e){BdApi.deleteData(this.pluginName,e)}}class ae{constructor(e){this.storage=e,this.server=I.createServer((t,o)=>{let{query:i}=K.parse(t.url,!0);console.log("can handle a request"),i.code&&(n.log("Recieved authorization code."),this.requestAccessToken(i.code,s=>{let{access_token:l,refresh_token:c}=s;l&&c?(n.log("Exchanged authorization code for access and refresh tokens."),this.storage.store(a.storage.credentialsKey,s,!0),o.writeHeader(u,{"Content-Type":"text/html"}),o.write(X()),te("Google Drive connected!",{timeout:5500})):(n.err("Failed to retrieve access and refresh tokens."),o.writeHeader(Y,{"Content-Type":"text/html"}),o.write(Q({error_message:JSON.stringify(s)})),se("An error occured connecting Google Drive",{timeout:5500})),o.end(),this.shutdownHandler()}))})}launch(){this.activateHandler(()=>{n.log("Sending user to OAuth consent flow."),window.open(Z)})}activateHandler(e){if(this.server.listening){e();return}let{port:t,host:o}=a.oauth.handler;this.server.listen(t,o,()=>{n.log(`Listening for OAuth redirects on http://${o}:${t}...`),e&&e()})}shutdownHandler(e){this.server.close(e)}requestAccessToken(e,t){let o=new URLSearchParams({client_id:a.oauth.clientId,client_secret:a.oauth.clientSecret,code:e,grant_type:"authorization_code",redirect_uri:`http://${a.oauth.handler.host}:${a.oauth.handler.port}`}).toString();fetch(O,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:o}).then(s=>s.json()).then(s=>{t&&t(s)})}refreshAccessToken(e,t){let o=new URLSearchParams({client_id:a.oauth.clientId,client_secret:a.oauth.clientSecret,refresh_token:e,grant_type:"refresh_token"}).toString();fetch(O,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:o}).then(s=>s.json()).then(s=>{t&&t(s)})}revokeToken(e){let t={method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}};fetch(V+`?token=${e}`,t).then(o=>{o.status===u?n.log("Token has successfully been revoked."):n.warn("Unable to revoke OAuth token.")})}}return class extends E{openOAuthPrompt(){BdApi.showConfirmationModal("\u{1F50C} Connect your Google Drive","Magic Upload requires Google Drive. To use this plugin you must connect your Google account.",{confirmText:"Connect Google Account",cancelText:"Disable Plugin",onConfirm:()=>{this.oauther.launch()},onCancel:()=>{BdApi.Plugins.disable(this.getName())}})}patchModules(){n.log("Patching Discord file modules."),h.instead(g,"maxFileSize",(e,t,o)=>{let[i,s]=t;return s===!0?o(i):Number.MAX_VALUE}),h.instead(g,"anyFileTooLarge",()=>!1),h.instead(g,"uploadSumTooLarge",()=>!1),h.instead(g,"getUploadFileSizeSum",()=>0),h.instead(F,"uploadFiles",(e,[t],o)=>{let{uploads:i}=t;i.forEach(s=>{s.item.file.size<this.uploadLimit,console.log("uploading"),this.uploader.upload(s.item.file)})})}init(){this.storage=new re(this.getName()),this.oauther=new ae(this.storage),this.uploader=new ie(this.storage,this.oauther),this.uploadLimit=()=>g.maxFileSize(_,!0)}onStart(){this.init(),this.storage.getAccessToken()?this.patchModules():this.openOAuthPrompt()}onStop(){n.log("MagicUpload has stopped..."),this.oauther.shutdownHandler(),h.unpatchAll()}buildSetting(e){class t extends ZLibrary.Settings.SettingField{constructor(y,b,d,T){let v={display:"flex"},p=BdApi.React.createElement(q,{onClick:T},d);super(y,b,_,x=>BdApi.React.createElement("div",{...x,style:v},p),{})}}let{name:o,note:i,type:s,value:l,onClick:c}=e;return s==="button"?new t(o,i,l,c):super.buildSetting(e)}getSettingsPanel(){let e=this.buildSettingsPanel(),t=this.storage.load(a.storage.credentialsKey,!0);var o;t?o={controls:[{type:"switch",id:"automatic_file_upload",name:"Automatic file uploading",note:"Do not prompt me when uploading files that exceed the upload limit.",value:!0,onChange:s=>console.log("CHANGINGINSDGINGING")},{type:"switch",id:"rich_embed",name:"Google Drive embeds",note:"Attempt to display an embedded preview of content from google drive links.",value:!0,onChange:s=>console.log("CHANGINGINSDGINGING")},{type:"textbox",id:"access_token",name:"Google Drive access token",note:"This value is immutable.",value:t?t.access_token:""},{type:"textbox",id:"refresh_token",name:"Google Drive refresh token",note:"This value is immutable.",value:t?t.refresh_token:""},{type:"button",value:"Unlink Google Drive",onClick:()=>{this.oauther.revokeToken(t.refresh_token),this.storage.deleteCredentials(),oe("Google Drive has been unlinked.",{timeout:5500}),D()}}]}:o={description:`\u{1F50C} Hello! It looks like you haven't given access to your Google Drive. 
                        This plugin <i>requires</i> you to sign in with Google in order to function.`,controls:[{type:"button",value:"Connect Google Account",onClick:()=>{this.oauther.launch(),D()}}]},o.controls.forEach(s=>e.append(this.buildSetting(s)));let i=e.getElement();if(o.description){let s=document.createElement("p");s.style=`
                    color: rgb(185, 187, 190);
                    font-size: 16px;
                    line-height: 18px;
                    margin-top: 0;
                    margin-bottom: 0.85rem;
                `,s.innerHTML=o.description,i.prepend(s)}return i}}};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
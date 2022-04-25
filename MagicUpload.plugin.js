/**
 * @name MagicUpload
 * @website https://github.com/mack/magic-upload
 * @source
 */
 module.exports=(()=>{let G=require("http"),F=require("https"),j=require("url"),S=require("crypto"),A=require("fs"),E=global.BdApi.findModuleByProps("dirtyDispatch"),K=global.BdApi.findModuleByProps("getCurrentUser"),f=global.BdApi.findModuleByProps("anyFileTooLarge","maxFileSize"),I=global.BdApi.findModuleByProps("instantBatchUpload","upload"),q=global.BdApi.findModuleByProps("sendMessage"),J=global.BdApi.findModuleByProps("BorderColors"),W=global.BdApi.findModuleByDisplayName("SwitchItem"),V=global.BdApi.findModule(i=>i.defaultProps&&i.defaultProps.type==="text"),D=global.BdApi.findModuleByProps("useModalsStore","closeModal"),Y=global.BdApi.findModule(i=>i.AttachmentUpload).AttachmentUpload,m={...global.BdApi.findModule(i=>i.avatar&&i.messageContent&&i.alt),...global.BdApi.findModuleByProps("groupStart")},O=global.BdApi.findModuleByProps("scrollerSpacer"),k={...global.BdApi.findModuleByProps("divider"),...global.BdApi.findModuleByProps("dividerDefault")},d={meta:{version:"1.0.0",name:"MagicUpload",description:"\u{1F9D9}\u200D\u2640\uFE0F A BetterDiscord plugin to automagically upload files over 8MB.",authors:[{name:"mack",discord_id:"365247132375973889",github_username:"mack"}]},oauth:{handler:{port:29842,host:"localhost"},clientId:"911268808772-r7sa3s88f2o36hdcu9g4tmih6dbo4n77.apps.googleusercontent.com",clientSecret:"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"},storage:{algorithm:"aes-256-ctr",secretKey:"jXn2r5u8x/A?D*G-KaPdSgVkYp3s6v9y",iv:S.randomBytes(16),credentialsKey:"_magicupload_oa_creds_gd",uploadsKey:"_magicupload_files_inprogress",uploadHistoryKey:"_magicupload_files_completed",settingsKey:"_magicupload_settings",defaultSettings:{autoUpload:!0,uploadEverything:!1,embed:!0,directLink:!0,verbose:!1}},upload:{chunkMultiplier:10}},y=200,R=308,$=401,Q=404,X=500,Z=`https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive&redirect_uri=http://${d.oauth.handler.host}:${d.oauth.handler.port}&response_type=code&client_id=${d.oauth.clientId}`,H="https://oauth2.googleapis.com/token",ee="https://oauth2.googleapis.com/revoke",te="https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",oe="https://www.googleapis.com/drive/v3/files",se="reader",ae="anyone",U="upload_cancelled",ie=()=>'<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Google Drive Connected</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"><\/script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } .header img { width: 80px; } .header { display: flex; align-items: center; font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } .header i { font-size: 18px; margin: 0 0.5rem; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .magic { color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } </style> <div class="container"> <h1 class="header"><span class="magic">MagicUpload</span> <i class="fa-solid fa-link"></i> <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" /></h1> <hr> <p class="about">\u2705 You"ve successfully linked your Google Drive account! You can now upload files that exceed your discord limit and they"ll automatically uploaded to your drive.</p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"><\/script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"><\/script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); const jsConfetti = new JSConfetti(); setTimeout(() => { jsConfetti.addConfetti() }, 2000); <\/script> </body></html>',ne=i=>`<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&family=Staatliches&display=swap" rel="stylesheet"> <title>Magic Upload - Error</title> <script src="https://kit.fontawesome.com/9fd6d0c095.js" crossorigin="anonymous"><\/script> </head> <body> <style> * { box-sizing: border-box; } body { max-width: 870px; margin: 0 auto; } .container { text-align: center; font-family: "Roboto", sans-serif; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 90vh; position: relative; color: #363636; padding-left: 5rem; padding-right: 5rem; } h1 { font-family: "Staatliches", cursive; font-size: 48px; margin-bottom: 0; } p { padding: 0 2rem; margin-top: 0; font-size: 18px; line-height: 24px; } .footer { position: absolute; bottom: 1rem; font-size: 14px; opacity: 0.4; } .error, .header > i { color: rgb(229, 45, 45); text-shadow: 0 8px 24px rgb(229 45 45 / 25%); } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { font-size: 16px; line-height: 20px; visibility: hidden; width: 120px; bottom: 130%; left: 50%; margin-left: -60px; background-color: rgba(0,0,0,0.9); color: #fff; text-align: center; padding: 5px 0; border-radius: 6px; opacity: 0; transition: .3s; position: absolute; z-index: 1; } .tooltip .tooltiptext::after { content: " "; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #363636 transparent transparent transparent; } .tooltip:hover .tooltiptext { visibility: visible; opacity: 1; } a { color: #363636; transition: .3s; } a:hover{ color: #5e2de5; text-shadow: 0 8px 24px rgb(94 45 229 / 25%); } hr { width: 50px; opacity: 0.5; } .error_container { max-width: 100%; position: relative; } .error_container:hover .error_label { opacity: 0.3; } .error_code { font-size: 14px; background-color: rgba(0,0,0,0.92); border-radius: 6px; padding-top: 2rem; padding-bottom: 2rem; padding-right: 2rem; padding-left: 2rem; color: white; text-align: left; word-wrap: break-word; font-family: 'Roboto Mono', monospace; } .error_label { transition: .3s; cursor: default; font-size: 12px; text-transform: uppercase; opacity: 0; color: white; position: absolute; right: 2rem; top: 1rem; } </style> <div class="container"> <h1 class="header"><i class="fa-solid fa-triangle-exclamation"></i> Uh oh, something went <span class="error">wrong</span> <i class="fa-solid fa-triangle-exclamation"></i></h1> <hr> <p class="about">We weren&#39;t able to connect your Google Drive account with MagicUpload. Please try again or reach out to help in our community discord. </p> <p class="help">Need any help? Checkout our <a href="https://github.com/mack/magic-upload" class="tooltip"> <i class="fa-brands fa-github"></i> <span class="tooltiptext">GitHub</span> </a> or <a href="" class="tooltip"> <i class="fa-brands fa-discord"></i> <span class="tooltiptext">Community Discord</span> </a> . </p> <div class="error_container"> <span class="error_label">OAuth Response // JSON</span> <div class="error_code"> ${i.error_message} </div> </div> <span class="footer">&#169; Mackenzie Boudreau</span> </div> <script src="https://unpkg.com/scrollreveal@4.0.0/dist/scrollreveal.min.js"><\/script> <script src="https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js"><\/script> <script> const sr = ScrollReveal({ origin: "top", distance: "60px", duration: 2500, delay: 400, }); sr.reveal(".header", {delay: 700}); sr.reveal("hr", {delay: 500}); sr.reveal(".about", {delay: 900, origin: "bottom"}); sr.reveal(".help", {delay: 1000, origin: "bottom"}); sr.reveal(".error_code", {delay: 1000, origin: "bottom"}); sr.reveal(".footer", {delay: 800, origin: "bottom"}); <\/script> </body></html>`,a={log(...i){(global.BdApi.loadData(d.meta.name,d.storage.settingsKey)||{}).verbose&&a.console(i,"log")},info(i){a.console(i,"info")},warn(i){a.console(i,"warn")},err(i){a.console(i,"err")},console(i,e){let t={log:"log",info:"info",dbg:"debug",debug:"debug",warn:"warn",err:"error",error:"error"},s=Object.prototype.hasOwnProperty.call(t,e)?t[e]:"log",o=i;Array.isArray(i)||(o=[o]),console[s](`%c[${d.meta.name}]%c`,"color: #3a71c1; font-weight: 700;","",...o)},successToast(i,e){global.BdApi.showToast(i,{type:"success",...e})},infoToast(i,e){global.BdApi.showToast(i,{type:"info",...e})},warnToast(i,e){global.BdApi.showToast(i,{type:"warning",...e})},errorToast(i,e){global.BdApi.showToast(i,{type:"error",...e})},optionsWithAuth(i,e){let t=i,s=e.getAccessToken();return s&&(t.headers={...i.headers,Authorization:`Bearer ${s}`}),i},encrypt(i){let{algorithm:e,secretKey:t,iv:s}=d.storage,o=S.createCipheriv(e,t,s),r=Buffer.concat([o.update(i),o.final()]);return{iv:s.toString("hex"),content:r.toString("hex")}},decrypt(i){let{algorithm:e,secretKey:t}=d.storage,s=S.createDecipheriv(e,t,Buffer.from(i.iv,"hex"));return Buffer.concat([s.update(Buffer.from(i.content,"hex")),s.final()]).toString()},override(i,e,t,s){let o=global.BdApi.monkeyPatch(i,e,{...s,instead:t});window.magicUploadOverrides?window.magicUploadOverrides.push(o):window.magicUploadOverrides=[o]},clearOverrides(){Array.isArray(window.magicUploadOverrides)&&window.magicUploadOverrides.forEach(i=>i())},prettifySize(i){let e=["Bytes","KB","MB","GB","TB"];if(i===0)return"0 Byte";let t=parseInt(Math.floor(Math.log(i)/Math.log(1024)),10);return`${Math.round(i/1024**t,2)} ${e[t]}`},prettifyType(i){let e=i.split("/");if(e.length==2)return e[0]},truncate(i,e=35){return i.length>e?`${i.substr(0,e-1)}...`:i},driveLink(i){return`https://drive.google.com/file/d/${i}`},directDriveLink(i){return`https://drive.google.com/uc?export=download&id=${i}`},discordAvatarLink(i,e){return`https://cdn.discordapp.com/avatars/${i}/${e}.webp?size=160`},convertFileToMagicFile(i,e,t){return{lastModified:i.lastModified,lastModifiedDate:i.lastModifiedDate,name:i.name,path:i.path,size:i.size,type:i.type,webkitRelativePath:i.webkitRelativePath,mu_destination:e,mu_content:t}},parseRecievedRange(i){let e=i.split("-");if(e.length===2)return parseInt(e[1],10)},closeLastModal(){let i=D.useModalsStore.getState().default[0];i&&D.closeModal(i.key)}};class re{constructor(e,t,s,o,r){this.channelId=t;let n=document.createElement("li"),l=document.createElement("div"),c=document.createElement("div");c.className=`${m.cozy} ${m.groupStart} ${m.wrapper}`;let p=document.createElement("img");p.src=r,p.className=m.avatar,c.appendChild(p);let g=document.createElement("h2"),h=document.createElement("span");h.innerHTML=o,h.className=`${m.headerText} ${m.username}`,g.appendChild(h);let u=document.createElement("span");u.className=`${m.timestamp} ${m.timestampInline}`,u.innerHTML=s,g.appendChild(u),c.appendChild(g),e instanceof HTMLElement?c.appendChild(e):c.innerText+=e,l.appendChild(c),n.appendChild(l),this.messageContainer=n}element(){return this.messageContainer}destination(){return this.channelId}show(){let e=document.querySelector(`.${O.scrollerInner}`),t=document.querySelector(`.${O.scrollerSpacer}`);e&&e.insertBefore(this.messageContainer,t)}destroy(){this.messageContainer&&this.messageContainer.remove()}}class le extends re{constructor(e,t,s,o,r){let n=document.createElement("div"),l=global.BdApi.React.createElement(Y,{filename:t,size:s,progress:o,onCancelUpload:r});global.BdApi.ReactDOM.render(l,n);let c=K.getCurrentUser();super(n,e,"Powered by MagicUpload",c.username,a.discordAvatarLink(c.id,c.avatar)),this.attachment=l,this.container=n}setProgress(e){let t=Math.min(Math.max(e,0),100);this.attachment.props.progress=t;let s=this.container.innerHTML.match(/class="(progressBar-[^\s"]*)/)[1],o=this.container.querySelector(`.${s}`);o.style.transform=`translate3d(-${100-this.attachment.props.progress}%, 0px, 0px)`}progress(){return this.attachment.props.progress}}class C{static sendFileLinkMessage(e,t){a.log(`Sending file share link to channel: ${e.mu_destination}.`);let s=e.mu_content!==""?`${e.mu_content}
 ${t}`:t;q.sendMessage(e.mu_destination,{content:s,validNonShortcutEmojis:[]})}constructor(e,t){this.storage=e,this.oauther=t,this.uploadAttachments={},this.cancelationQueue={},this.handleChannelSelect=s=>this.checkForAttachments(s.channelId),E.subscribe("CHANNEL_SELECT",this.handleChannelSelect),this.continue()}cleanup(){E.unsubscribe("CHANNEL_SELECT",this.handleChannelSelect)}checkForAttachments(e){Object.keys(this.uploadAttachments).forEach(t=>{this.uploadAttachments[t].destination()===e&&setTimeout(()=>{this.uploadAttachments[t].show()},200)})}cancelFileHandler(e){return()=>{this.cancelationQueue[e]=!0}}continue(){let e=this.getRegisteredUploads();Object.keys(e).forEach(t=>{Object.prototype.hasOwnProperty.call(e,t)&&this.getStreamStatus(t,s=>{switch(s.status){case y:{this.unregisterUpload(t);break}case R:{a.log("Resuming inprogress upload.");let o=a.parseRecievedRange(s.headers.get("Range"));this.streamChunks(t,e[t],o,(r,n,l)=>{this.uploadAttachments[t].destroy(),delete this.uploadAttachments[t],this.unregisterUpload(t),l===null?(this.storage.patchUploadHistory({uploadedAt:new Date().toUTCString(),driveItem:r,file:n}),a.info(`${n.name} has been successfully uploaded to Google Drive.`),this.share(r.id,()=>{a.info(`${n.name} permissions have been updated to "anyone with link".`);let c=this.storage.getSettings().directLink?a.directDriveLink(r.id):a.driveLink(r.id);C.sendFileLinkMessage(n,c)})):l.message&&l.message===U?(a.warn("Upload has been cancelled."),a.infoToast(`Upload ${a.truncate(n.name,35)} has been cancelled`)):(a.err("Upload has failed."),a.errorToast(`Upload failed ${a.truncate(n.name,35)}`))});break}case Q:{let o=e[t];this.unregisterUpload(t),this.upload(o);break}default:}})})}getRegisteredUploads(){return this.storage.load(d.storage.uploadsKey)||{}}registerUpload(e,t){a.log("Registering new file into upload registry.");let s=JSON.parse(JSON.stringify(t)),o=this.getRegisteredUploads();o[e]=s,this.storage.store(d.storage.uploadsKey,o)}unregisterUpload(e){a.log("Unregistering file from upload registry.");let t=this.getRegisteredUploads();delete t[e],this.storage.store(d.storage.uploadsKey,t)}getStreamStatus(e,t){let s=a.optionsWithAuth({method:"PUT",headers:{"Content-Length":0,"Content-Range":"bytes 0-*/*"}},this.storage);fetch(e,s).then(o=>{t&&t(o)})}streamChunks(e,t,s,o){this.uploadAttachments[e]||(this.uploadAttachments[e]=new le(t.mu_destination,t.name,t.size,0,this.cancelFileHandler(e)),this.uploadAttachments[e].show());let{uploadAttachments:r,cancelationQueue:n}=this,l=this.storage.getAccessToken(),c=d.upload.chunkMultiplier*256*1024,p=Buffer.alloc(c);A.open(t.path,"r",(g,h)=>{(g||!h)&&o(null,t,g);let u=B=>{if(n[e]){o(null,t,new Error(U));return}A.read(h,p,0,c,B,(P,L)=>{P&&o(null,t,P);let v;L<c?v=p.slice(0,L):v=p;let w=B,de=B+(v.length-1),T=t.size,M=new URL(e),pe={host:M.host,path:M.pathname+M.search,method:"PUT",headers:{Authorization:`Bearer ${l}`,"Content-Length":v.length,"Content-Range":`bytes ${w}-${de}/${T}`}};a.log(`[${(w/T*100).toFixed(2)}%] Uploading ${t.name} (${w}/${T})`),r[e].setProgress(w/T*100);let z=F.request(pe,x=>{if(x.statusCode===R&&u(a.parseRecievedRange(x.headers.range)),x.statusCode===y){let N="";x.on("data",he=>{N+=he}),x.on("close",()=>{A.close(h,()=>{a.successToast(`Successfully uploaded ${a.truncate(t.name,35)}`),o(JSON.parse(N),t,null)})})}});z.write(v),z.end()})};u(s)})}share(e,t,s){let o={role:se,type:ae},r=a.optionsWithAuth({method:"POST",headers:{"Content-Type":"application/json; charset=UTF-8"},body:JSON.stringify(o)},this.storage);fetch(`${oe}/${e}/permissions`,r).then(n=>n.json()).then(n=>{n.error?n.error.code===$&&!s&&this.oauther.refresh(()=>{this.share(e,t,!0)}):t&&t()})}upload(e,t){a.info(`Beginning upload for: ${e.name}`);let s={name:e.name,mimeType:e.type},o=a.optionsWithAuth({method:"POST",headers:{"Content-Type":"application/json; charset=UTF-8","Content-Length":e.size},body:JSON.stringify(s)},this.storage);fetch(te,o).then(r=>{if(r.status===y){let n=r.headers.get("Location");this.registerUpload(n,e),this.streamChunks(n,e,0,(l,c,p)=>{this.uploadAttachments[n].destroy(),delete this.uploadAttachments[n],this.unregisterUpload(n),p===null?(this.storage.patchUploadHistory({uploadedAt:new Date().toUTCString(),driveItem:l,file:c}),a.info(`${c.name} has been successfully uploaded to Google Drive.`),this.share(l.id,()=>{a.info(`${c.name} permissions have been updated to "anyone with link.`);let g=this.storage.getSettings().directLink?a.directDriveLink(l.id):a.driveLink(l.id);C.sendFileLinkMessage(c,g)})):p.message&&p.message===U?(a.warn("Upload has been cancelled."),a.infoToast(`Upload ${a.truncate(c.name,35)} has been cancelled`)):(a.err("Upload has failed."),a.errorToast(`Upload failed ${a.truncate(c.name,35)}`))})}else r.status===$&&!t&&this.oauther.refresh(()=>{a.log("OAuth tokens potentially expired. Retry upload"),this.upload(e,!0)})})}}class ce{constructor(e){this.pluginName=e;let{credentialsKey:t,uploadHistoryKey:s,settingsKey:o,defaultSettings:r}=d.storage;this.deleteCredentials=()=>this.delete(t),this.getAccessToken=()=>{let n=this.load(t,!0);return n&&n.access_token},this.patchAccessToken=n=>{let l=this.load(t,!0);return l.access_token=n,this.store(t,l,!0),n},this.getUploadHistory=()=>this.load(s,!1)||[],this.patchUploadHistory=n=>{let l=this.getUploadHistory();l.push(n),this.store(s,l,!1)},this.clearUploadHistory=()=>{a.log("Clearing upload history..."),this.store(s,[],!1)},this.getSettings=()=>this.load(o,!1)||r,this.saveSettings=n=>this.store(o,n,!1),this.patchSettings=n=>{let l=_.merge(this.getSettings(),n);this.saveSettings(l)}}load(e,t){let s=global.BdApi.loadData(this.pluginName,e);if(s&&t){let o=Buffer.from(s,"base64").toString("ascii");s=JSON.parse(a.decrypt(JSON.parse(o)))}return s}store(e,t,s){let o;if(s){let r=a.encrypt(JSON.stringify(t));o=Buffer.from(JSON.stringify(r)).toString("base64")}else o=t;global.BdApi.saveData(this.pluginName,e,o)}delete(e){global.BdApi.deleteData(this.pluginName,e)}}class b{static postAccessToken(e,t){let s=new URLSearchParams({client_id:d.oauth.clientId,client_secret:d.oauth.clientSecret,code:e,grant_type:"authorization_code",redirect_uri:`http://${d.oauth.handler.host}:${d.oauth.handler.port}`}).toString();fetch(H,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s}).then(r=>r.json()).then(r=>{t&&t(r)})}static postRefreshAccessToken(e,t){let s=new URLSearchParams({client_id:d.oauth.clientId,client_secret:d.oauth.clientSecret,refresh_token:e,grant_type:"refresh_token"}).toString();fetch(H,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s}).then(r=>r.json()).then(r=>{t&&t(r)})}static postRevokeToken(e){let t={method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}};fetch(`${ee}?token=${e}`,t).then(s=>{s.status===y?a.info("OAuth Token has successfully been revoked."):a.warn("Unable to revoke OAuth token.")})}constructor(e,t){this.storage=e,this.server=G.createServer((s,o)=>{let{query:r}=j.parse(s.url,!0);r.code&&(a.log("Recieved authorization code."),b.postAccessToken(r.code,n=>{n.access_token&&n.refresh_token?(a.log("Exchanged authorization code for access and refresh tokens."),this.storage.store(d.storage.credentialsKey,n,!0),o.writeHeader(y,{"Content-Type":"text/html"}),o.write(ie()),a.successToast("Google Drive connected!",{timeout:5500}),a.info("Google Drive successfully linked."),t&&t()):(a.err("Failed to retrieve access and refresh tokens."),o.writeHeader(X,{"Content-Type":"text/html"}),o.write(ne({error_message:JSON.stringify(n)})),a.errorToast("An error occured connecting Google Drive",{timeout:5500})),o.end(),this.cleanup()}))})}launch(){this.activateHandler(()=>{a.log("Sending user to OAuth consent flow."),window.open(Z)})}activateHandler(e){if(this.server.listening){e();return}let{port:t,host:s}=d.oauth.handler;this.server.listen(t,s,()=>{a.log(`Listening for OAuth redirects on http://${s}:${t}...`),e&&e()})}cleanup(e){this.server.listening&&this.server.close(e)}refresh(e){let s=this.storage.load(d.storage.credentialsKey,!0).refresh_token;s?b.postRefreshAccessToken(s,o=>{let r=o.access_token;r?(a.log("Successfully refreshed access token."),this.storage.patchAccessToken(r),e&&e(r)):(a.warn("Refresh token may have expired. Please reconnect your Google account."),this.storage.deleteCredentials(),this.launch())}):(a.err("Something went wrong. Clearing OAuth credentials."),this.storage.deleteCredentials())}}return class{getName(){return d.meta.name}getAuthor(){return d.meta.authors.map(e=>e.name).join(", ")}getDescription(){return d.meta.description}getVersion(){return d.meta.version}openOAuthPrompt(){global.BdApi.showConfirmationModal("\u{1F50C} Connect your Google Drive","Magic Upload requires Google Drive. To use this plugin you must connect your Google account.",{confirmText:"Connect Google Account",cancelText:"Disable Plugin",onConfirm:()=>{this.oauther.launch()},onCancel:()=>{global.BdApi.Plugins.disable(this.getName())}})}openUploadPrompt(e,t){let s=a.truncate(e.name),o=a.prettifyType(e.type),r=a.prettifySize(e.size);global.BdApi.showConfirmationModal(s,[`Are you sure you want to upload this ${o||"file"} (${r}) to Google Drive and share it?`],{confirmText:"Upload to Drive",cancelText:"Cancel",onConfirm:()=>{t()}})}load(){this.storage=new ce(this.getName()),this.oauther=new b(this.storage,this.overrideDiscordUpload),this.uploader=new C(this.storage,this.oauther),this.realUploadLimit=f.maxFileSize("",!0)}overrideDiscordUpload(){let{realUploadLimit:e,storage:t,uploader:s}=this;a.log("Overriding default file upload functionality."),a.override(f,"maxFileSize",({methodArguments:o,callOriginalMethod:r})=>o[1]===!0?r():Number.MAX_VALUE),a.override(f,"anyFileTooLarge",()=>!1),a.override(f,"uploadSumTooLarge",()=>!1),a.override(f,"getUploadFileSizeSum",()=>0),a.override(I,"uploadFiles",({methodArguments:o,thisObject:r,originalMethod:n})=>{let[l]=o,{channelId:c,uploads:p,parsedMessage:g}=l;p.forEach(h=>{if(!t.getSettings().uploadEverything&&h.item.file.size<e){a.info(`File "${h.item.file.name}" is within discords upload limit, using default file uploader.`);let u={...l};u.uploads=[h],n.apply(r,[u])}else{a.info(`File "${h.item.file.name}" exceeds upload limit, using ${d.meta.name} uploader.`);let u=a.convertFileToMagicFile(h.item.file,c,g.content);t.getSettings().autoUpload?s.upload(u):this.openUploadPrompt(u,()=>this.uploader.upload(u))}})})}start(){a.info("MagicUpload has started."),this.storage.getAccessToken()?this.overrideDiscordUpload():this.openOAuthPrompt()}stop(){a.info("MagicUpload has stopped."),a.clearOverrides(),this.oauther.cleanup(),this.uploader.cleanup()}createSettingsCategory(e){let t=document.createElement("div");t.className=k.container,t.appendChild(e);let s=document.createElement("div");return s.className=`${k.divider} ${k.dividerDefault}`,s.style.borderTop="thin solid #4f545c7a",s.style.height="1px",t.appendChild(s),t}createSwitchControl(e){class t extends global.BdApi.React.Component{constructor(n){super(n),this.state={enabled:this.props.value}}render(){return global.BdApi.React.createElement(W,{...this.props,value:this.state.enabled,onChange:n=>{this.props.onChange(n),this.setState({enabled:n})}})}}let s=document.createElement("div"),o=global.BdApi.React.createElement(t,{value:e.value,children:e.name,note:e.note,disabled:e.disabled,onChange:e.onChange});return global.BdApi.ReactDOM.render(o,s),s}createButtonControl(e){let t=document.createElement("div");t.style.marginTop="8px";let s=global.BdApi.React.createElement(J,{children:e.name,onClick:e.onClick});return global.BdApi.ReactDOM.render(s,t),t}createTextBoxControl(e){let t=document.createElement("div");t.style.marginTop="8px",t.style.marginBottom="20px";let s=global.BdApi.React.createElement(V,{value:e.value,disabled:e.disabled,placeholder:e.placeholder||""});if(global.BdApi.ReactDOM.render(s,t),e.name){let o=document.createElement("div");o.innerHTML=e.name,o.style.marginBottom="8px",o.style.marginTop="4px",o.style.color="white",o.style.fontSize="16px",o.style.fontWeight="500",t.prepend(o)}if(e.note){let o=document.createElement("div");o.innerHTML=e.note,o.style.marginBottom="12px",o.style.marginTop="6px",o.style.color="#b9bbbe",o.style.fontSize="14px",t.appendChild(o)}return t}createHistoryControl(){let e=this.storage.getUploadHistory().sort((n,l)=>new Date(l.uploadedAt)-new Date(n.uploadedAt)),t=document.createElement("div"),s=document.createElement("h1");s.innerHTML=`Upload History (${e.length})`,s.style.color="#fff",s.style.fontWeight="500",s.style.position="relative",s.style.marginBottom="0.5rem";let o=document.createElement("span");o.innerHTML="clear history",o.style.position="absolute",o.style.right="4px",o.style.cursor="pointer",o.style.fontSize="14px",o.style.opacity="0.4",o.style.textTransform="uppercase",o.onclick=()=>{global.BdApi.showConfirmationModal("Are you sure?","Are you sure you want to delete the plugin's entire upload history. This will NOT delete any files from Google Drive.",{confirmText:"Clear history",cancelText:"Cancel",onConfirm:()=>{this.storage.clearUploadHistory(),a.successToast("Upload history cleared. Please refresh settings.")}})},s.appendChild(o),t.appendChild(s);let r=document.createElement("ol");if(r.style.maxHeight="200px",r.style.backgroundColor="#2b2e31",r.style.overflow="scroll",r.style.borderRadius="6px",r.style.padding="0.75rem",e.length>0)e.forEach(n=>{let l=document.createElement("li");l.onmouseover=()=>{l.style.backgroundColor="#41444a"},l.onmouseout=()=>{l.style.backgroundColor="transparent"},l.style.paddingTop="1rem",l.style.paddingLeft="0.75rem",l.style.paddingRight="0.75rem",l.style.borderRadius="4px",l.style.paddingBottom="1rem",l.style.display="flex",l.style.justifyContent="space-between",l.style.cursor="pointer",l.onclick=()=>window.open(a.driveLink(n.driveItem.id));let c=document.createElement("span");c.style.fontWeight="500",c.innerHTML=`${a.truncate(n.file.name)}`,l.appendChild(c);let p=document.createElement("span");p.style.fontSize="14px",p.innerHTML=`${a.prettifySize(n.file.size)}`,l.appendChild(p),r.appendChild(l)});else{let n=document.createElement("div");n.style.height="60px",n.style.fontSize="15px",n.style.opacity="0.4",n.style.display="flex",n.style.justifyContent="center",n.style.alignItems="center",n.innerHTML="You haven't uploaded any files yet...",r.appendChild(n)}return t.appendChild(r),t}getSettingsPanel(){let e=this.storage.load(d.storage.credentialsKey,!0),t=document.createElement("div");if(t.style.color="#b9bbbe",t.style.fontSize="16px",t.style.lineHeight="18px",e){[{name:"Automatic file uploading",note:"Do not prompt me when uploading files that exceed the upload limit.",value:this.storage.getSettings().autoUpload,disabled:!1,onChange:o=>{this.storage.patchSettings({autoUpload:o})}},{name:"Upload Everything",note:"Use Google Drive for all files, including ones within discords upload limit.",value:this.storage.getSettings().uploadEverything,disabled:!1,onChange:o=>{this.storage.patchSettings({uploadEverything:o})}},{name:"Share direct download link",note:"Share a direct download link to the Google Drive file.",value:this.storage.getSettings().directLink,disabled:!1,onChange:o=>{this.storage.patchSettings({directLink:o})}},{name:"Verbose logs",note:"Display verbose console logs. Useful for debugging.",value:this.storage.getSettings().verbose,disabled:!1,onChange:o=>{this.storage.patchSettings({verbose:o})}}].forEach(o=>t.appendChild(this.createSwitchControl(o)));let s=this.createSettingsCategory(this.createHistoryControl());t.appendChild(s),t.appendChild(this.createTextBoxControl({name:"Google Drive refresh token",value:e.access_token,note:"This value is immutable."})),t.appendChild(this.createTextBoxControl({name:"Google Drive refresh token",value:e.refresh_token,note:"This value is immutable."})),t.appendChild(this.createButtonControl({name:"Unlink Google Drive",onClick:()=>{b.postRevokeToken(e.refresh_token),this.storage.deleteCredentials(),a.infoToast("Google Drive has been unlinked",{timeout:5500}),a.info("Google Drive has been unlinked."),a.closeLastModal()}}))}else{let s=document.createElement("div");s.style.lineHeight="20px",s.style.fontSize="18px",s.style.marginBottom="1rem",s.innerHTML=`\u{1F50C} Hello! It looks like you haven't given access to your Google Drive. 
           This plugin <i>requires</i> you to sign in with Google in order to function.`,t.appendChild(s),t.appendChild(this.createButtonControl({name:"Connect Google Drive",onClick:()=>{this.oauther.launch(),a.closeLastModal()}}))}return t}}})();
 
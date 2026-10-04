import { useState, useEffect, useRef, useCallback, useMemo } from "react";
if(typeof document!=="undefined"&&!document.getElementById("caveat-font")){
  const _lnk=document.createElement("link");_lnk.id="caveat-font";
  _lnk.rel="stylesheet";_lnk.href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=Pacifico&family=Indie+Flower&display=swap";
  document.head.appendChild(_lnk);
}

// ── Theme ──────────────────────────────────────────────────────────────────
// ── Theme: Bright & Fun — cream background, candy primaries, dark ink ──────
const C = {
  bg:"#fff8ec",bgElevated:"#ffffff",card:"#ffffff",cardElevated:"#fff3da",
  border:"#f0dfc0",borderSoft:"#f5ebd4",divider:"#f0dfc0",
  text:"#2c2240",sub:"#7a7290",muted:"#c4b8d8",
  accent:"#ff6b6b",accentSoft:"#ff6b6b1c",accentStrong:"#ff8787",nav:"#ffffff",
  red:"#ff5757",green:"#2ecc71",good:"#2ecc71",bad:"#ff5757",
  glow:"#1fb6b6",gold:"#ffc233",purple:"#9b5de5",
  logic:"#9b5de5",gk:"#3a8fd4",math:"#ffc233",speed:"#ff5757",
};
const R = { sm:10,md:14,lg:18,xl:22,pill:999 };
const S = (c)=>({boxShadow:`0 6px 14px rgba(60,40,90,0.10)`,border:`1px solid ${c||C.border}`});
const FONT_DISPLAY="'Baloo 2','Poppins',system-ui,sans-serif";

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rng(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pick(arr,n){return shuffle(arr).slice(0,n);}

// ── Sound Engine ──────────────────────────────────────────────────────────
const SFX={
  correct:()=>playTone([523,659,784],[0,0.08,0.16],[0.18,0.18,0.22],"sine"),
  wrong:()=>playTone([220,180],[0,0.15],[0.2,0.25],"sawtooth"),
  skip:()=>playTone([350,280],[0,0.1],[0.12,0.15],"sine"),
  levelUp:()=>playTone([523,659,784,1046],[0,0.1,0.2,0.3],[0.15,0.15,0.15,0.3],"sine"),
  tick:()=>playTone([800],[0],[0.06],"square"),
  confetti:()=>playTone([659,784,1046,1318],[0,0.08,0.16,0.24],[0.12,0.12,0.12,0.25],"sine"),
};
let _actx=null;
function getACtx(){if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)();return _actx;}
function playTone(freqs,starts,durs,type){
  try{
    const ctx=getACtx();
    freqs.forEach((f,i)=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type=type||"sine";osc.frequency.value=f;
      const t=ctx.currentTime+starts[i];
      gain.gain.setValueAtTime(0,t);
      gain.gain.linearRampToValueAtTime(0.18,t+0.02);
      gain.gain.linearRampToValueAtTime(0,t+durs[i]);
      osc.start(t);osc.stop(t+durs[i]+0.05);
    });
  }catch(e){}
}

// ── Stats Store ────────────────────────────────────────────────────────────
function loadStats(){
  try{const s=localStorage.getItem("gh_stats_v1");return s?JSON.parse(s):{
    totalQ:{Biology:0,GK:0,Physics:0,Speed:0},
    correctQ:{Biology:0,GK:0,Physics:0,Speed:0},
    gamesPlayed:0,skipped:0,
    mgLevelsCleared:0,mgBestTime:null,
  };}catch(e){return{totalQ:{Biology:0,GK:0,Physics:0,Speed:0},correctQ:{Biology:0,GK:0,Physics:0,Speed:0},gamesPlayed:0,skipped:0,mgLevelsCleared:0,mgBestTime:null};}
}
function saveStats(s){try{localStorage.setItem("gh_stats_v1",JSON.stringify(s));}catch(e){}}

// ── Daily Streak ───────────────────────────────────────────────────────────

// ── Reminder Hub: embedded engine + stylesheet (see RemindMeContainer) ─────
const REMINDME_ENGINE_JS="// \u2500\u2500\u2500 Constants \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nconst TAG_COLORS={Birthday:\"#c026d3\",Anniversary:\"#e0457b\",Work:\"#2f6bf0\",Health:\"#1f9d6b\",Other:\"#8b4dea\"};\nconst REPEAT=[\"Minutes\",\"Daily\",\"Weekly\",\"Monthly\",\"Yearly\"];const REPEAT_MINUTES=[0,5,10,15,20,30,45,60];function reminderRepeats(r){return r.repeat===\"Minutes\"?((r.repeatMin||0)>0):(!!r.repeat&&r.repeat!==\"None\");}function repeatLabel(r){if(r.repeat===\"Minutes\")return (r.repeatMin||0)>0?(\"Every \"+r.repeatMin+\" min\"):\"No repeat\";return r.repeat;}\nconst DAYS_L=[\"Sun\",\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"];\nconst DAYS_S=[\"S\",\"M\",\"T\",\"W\",\"T\",\"F\",\"S\"];\nconst MOODS=[\"\ud83d\ude0a\",\"\ud83e\udd70\",\"\ud83d\ude10\",\"\ud83d\ude14\",\"\ud83d\ude24\",\"\ud83e\udd29\"];\nconst uid=()=>Math.random().toString(36).slice(2,9);\nconst fmtDT=d=>new Date(d).toLocaleString(\"en-IN\",{dateStyle:\"medium\",timeStyle:\"short\"});\nconst fmtT=(h,m)=>{const hh=h%12||12;return`${hh}:${String(m).padStart(2,\"0\")} ${h>=12?\"PM\":\"AM\"}`;};\nconst toLocal=iso=>{try{return new Date(new Date(iso)-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);}catch{return \"\";}};\nconst cdLabel=dt=>{const d=new Date(dt)-Date.now();if(d<0)return\"Past\";const dd=Math.floor(d/864e5),hh=Math.floor((d%864e5)/36e5),mm=Math.floor((d%36e5)/6e4);return dd>0?`in ${dd}d ${hh}h`:hh>0?`in ${hh}h ${mm}m`:`in ${mm}m`;};\n\n// \u2500\u2500\u2500 Persistence \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nconst STORE_KEY=\"remindme_pro_v1\";\nfunction loadPersisted(){try{const r=localStorage.getItem(STORE_KEY);if(r)return JSON.parse(r);}catch(e){}return null;}\nfunction savePersisted(){try{localStorage.setItem(STORE_KEY,JSON.stringify({reminders:S.reminders,alarms:S.alarms,diary:S.diary}));}catch(e){}}\n\nfunction nextOccurrence(dt,repeat,repeatMin){\n  const d=new Date(dt);\n  if(repeat===\"Minutes\")d.setMinutes(d.getMinutes()+(repeatMin||0));\n  else if(repeat===\"Daily\")d.setDate(d.getDate()+1);\n  else if(repeat===\"Weekly\")d.setDate(d.getDate()+7);\n  else if(repeat===\"Monthly\")d.setMonth(d.getMonth()+1);\n  else if(repeat===\"Yearly\")d.setFullYear(d.getFullYear()+1);\n  return d.toISOString();\n}\n\n// \u2500\u2500\u2500 Sounds \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nconst NOTIFY_SOUNDS=[\n  {id:\"default\",label:\"Default\",freqs:[880,1320],type:\"sine\"},\n  {id:\"chime\",label:\"Soft Chime\",freqs:[880,1320],type:\"sine\"},\n  {id:\"bell\",label:\"Crystal Bell\",freqs:[1046,1568],type:\"triangle\"},\n  {id:\"marimba\",label:\"Marimba Pop\",freqs:[523,659],type:\"square\"},\n  {id:\"droplet\",label:\"Droplet\",freqs:[1200,600],type:\"sine\"},\n  {id:\"harp\",label:\"Gentle Harp\",freqs:[659,880,1046],type:\"sine\"},\n  {id:\"ping\",label:\"Soft Ping\",freqs:[1500],type:\"sine\"},\n  {id:\"glass\",label:\"Glass Tap\",freqs:[1800,1200],type:\"triangle\"},\n  {id:\"windchime\",label:\"Wind Chime\",freqs:[988,1318,1760],type:\"sine\"},\n  {id:\"xylophone\",label:\"Xylophone\",freqs:[784,988],type:\"square\"},\n  {id:\"bubble\",label:\"Bubble Pop\",freqs:[400,800,1200],type:\"sine\"},\n];\nconst ALARM_SOUNDS=[\n  {id:\"default\",label:\"Default\",freqs:[440,554,659],type:\"sine\"},\n  {id:\"sunrise\",label:\"Sunrise\",freqs:[440,554,659],type:\"sine\"},\n  {id:\"classic\",label:\"Classic Bell\",freqs:[800,1200],type:\"triangle\"},\n  {id:\"morning\",label:\"Morning Birds\",freqs:[1800,2200,1600],type:\"sine\"},\n  {id:\"calm\",label:\"Calm Waves\",freqs:[300,450],type:\"sine\"},\n];\n\nlet actx=null;\nfunction playTone(freqs,type){\n  try{\n    actx=actx||new(window.AudioContext||window.webkitAudioContext)();\n    if(actx.state===\"suspended\")actx.resume();\n    freqs.forEach((f,i)=>{\n      const o=actx.createOscillator(),g=actx.createGain();\n      o.type=type;o.frequency.value=f;\n      const t0=actx.currentTime+i*0.12;\n      g.gain.setValueAtTime(0.0001,t0);\n      g.gain.exponentialRampToValueAtTime(0.2,t0+0.02);\n      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.38);\n      o.connect(g);g.connect(actx.destination);\n      o.start(t0);o.stop(t0+0.45);\n    });\n  }catch(e){}\n}\nfunction playCustom(dataUrl){try{if(actx&&actx.state===\"suspended\")actx.resume();const a=new Audio(dataUrl);a.volume=0.6;a.play().catch(()=>{});}catch(e){}}\nfunction toast(msg){\n  const t=document.createElement(\"div\");t.className=\"toast\";t.textContent=msg;\n  document.body.appendChild(t);setTimeout(()=>t.remove(),2400);\n}\n\n// \u2500\u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nlet S={\n  tab:\"notify\",\n  reminders:[\n    {id:uid(),title:\"Mom's Birthday \ud83c\udf82\",note:\"Buy cake & flowers\",dt:new Date(Date.now()+86400000*3).toISOString(),repeat:\"Yearly\",tag:\"Birthday\",vib:true,on:true,sound:\"chime\"},\n    {id:uid(),title:\"Wedding Anniversary \ud83d\udc8d\",note:\"Book restaurant table\",dt:new Date(Date.now()+86400000*10).toISOString(),repeat:\"Yearly\",tag:\"Anniversary\",vib:true,on:true,sound:\"bell\"},\n    {id:uid(),title:\"Doctor Appointment \ud83c\udfe5\",note:\"City hospital, 2nd floor\",dt:new Date(Date.now()-86400000*2).toISOString(),repeat:\"Minutes\",repeatMin:0,tag:\"Health\",vib:false,on:false,sound:\"ping\"},\n  ],\n  alarms:[\n    {id:uid(),label:\"Wake up\",h:6,m:30,days:[2,3,4,5,6],vib:true,on:true,sound:\"sunrise\",customSound:null,photo:null},\n    {id:uid(),label:\"Take medicine\",h:21,m:0,days:[1,2,3,4,5,6,7],vib:false,on:true,sound:\"classic\",customSound:null,photo:null},\n  ],\n  diary:[],\n  dmenuOpenId:null,recording:false,\n  // reminder form\n  rm:false,re:null,rt:\"\",rn:\"\",rdt:\"\",rrep:\"Minutes\",rrepMin:0,rtag:\"Other\",rvib:true,rsound:\"default\",rsoundPopup:false,\n  // alarm form\n  am:false,ae:null,ah:7,amin:0,al:\"\",ad:[],avib:true,asound:\"default\",acustom:null,aphoto:null,asoundPopup:false,asnooze:3,\n  // diary\n  dv:\"list\",de:null,dtitle:\"\",dbody:\"\",dmood:\"\",dbold:false,ditalic:false,dunderline:false,dfsize:\"normal\",dfont:\"elegant\",dcolor:\"\",dlastFont:null,dlastSize:null,dlastColor:null,dfontPopup:false,dsizePopup:false,dcolorPopup:false,dphotos:[],dvideos:[],dvoice:null,dmenuOpen:false,\n  dexport:false,dexFrom:\"\",dexTo:\"\",\n  // ring/alarm screen\n  ringing:null,\n  // \u2605 NEW: in-app notification alert popup\n  notifAlert:null,  // { reminder } \u2014 the reminder that is alerting RIGHT NOW\n};\nconst _p=loadPersisted();\nif(_p){\n  if(_p.reminders)S.reminders=_p.reminders;\n  if(_p.alarms)S.alarms=_p.alarms;\n  if(_p.diary)S.diary=_p.diary;\n}\nconst set=p=>{S={...S,...p};savePersisted();render();};\n// Bridge: lets the outer React shell's shared bottom nav switch RemindMe's\n// internal tab (Notify/Alarm/Diary) without RemindMe needing its own nav.\nwindow.__rmGoToTab=(tab)=>{set({tab,dmenuOpenId:null});};\n\n// \u2500\u2500\u2500 DOM helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nfunction el(t,a,c){\n  const e=document.createElement(t);\n  for(const[k,v]of Object.entries(a||{})){\n    if(k===\"style\"&&typeof v===\"object\")Object.assign(e.style,v);\n    else if(k.startsWith(\"on\")&&typeof v===\"function\")e.addEventListener(k.slice(2).toLowerCase(),v);\n    else if(k===\"cls\")e.className=v;\n    else e.setAttribute(k,v);\n  }\n  [c].flat().forEach(ch=>{if(ch!=null)e.appendChild(typeof ch===\"string\"?document.createTextNode(ch):ch);});\n  return e;\n}\nconst D=(a,c)=>el(\"div\",a,c);\nconst B=(a,c)=>el(\"button\",a,c);\nconst Sp=(a,c)=>el(\"span\",a,c);\nconst P=(a,c)=>el(\"p\",a,c);\nconst Inp=a=>el(\"input\",a,[]);\nconst Ta=(a,v)=>{const t=el(\"textarea\",a,[]);t.value=v||\"\";return t;};\nconst Img=a=>el(\"img\",a,[]);\n\n// \u2500\u2500\u2500 Notification engine (real Android-style system notifications) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nlet notifPermission=\"default\";\nlet swReg=null;\n\n// Build the Service Worker as an inline blob so the whole app stays one file.\nconst SW_SOURCE=`\nself.addEventListener('install',e=>self.skipWaiting());\nself.addEventListener('activate',e=>self.clients.claim());\nself.addEventListener('notificationclick',e=>{\n  e.notification.close();\n  const action=e.action;\n  e.waitUntil((async()=>{\n    const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});\n    let client=all[0];\n    if(client){client.focus();}\n    else{client=await self.clients.openWindow('./');}\n    if(client){\n      client.postMessage({type:'notif-action',action:action||'open',tag:e.notification.tag,data:e.notification.data});\n    }\n  })());\n});\n`;\n\nasync function setupServiceWorker(){\n  if(!(\"serviceWorker\" in navigator))return;\n  try{\n    const blob=new Blob([SW_SOURCE],{type:\"application/javascript\"});\n    const swUrl=URL.createObjectURL(blob);\n    swReg=await navigator.serviceWorker.register(swUrl);\n    navigator.serviceWorker.addEventListener(\"message\",ev=>{\n      if(ev.data&&ev.data.type===\"notif-action\")handleNotifAction(ev.data);\n    });\n  }catch(e){/* SW registration can fail on file:// \u2014 falls back to in-page alert only */}\n}\nsetupServiceWorker();\n\nif(\"Notification\" in window){\n  notifPermission=Notification.permission;\n  // No prompt UI here. In this HTML/PWA build, real Android system\n  // notifications require explicit permission, but there's no in-app\n  // banner asking for it anymore. Sound + the in-app popup still work\n  // while the app is open. (A React Native build wouldn't have this\n  // limitation \u2014 Android handles that permission natively.)\n}\n\n// Fires a REAL system notification (shows in the Android shade, works even if\n// the app/tab is in the background) when a Service Worker + permission are\n// available. Falls back to the in-app banner only if the platform can't\n// support system notifications (e.g. running from file:// without https).\nasync function fireSystemNotification(reminder){\n  const title=reminder.title||\"Reminder\";\n  const body=reminder.note||\"Tap to view\";\n  const tag=\"remindme-\"+reminder.id;\n  if(swReg&&notifPermission===\"granted\"){\n    try{\n      await swReg.showNotification(title,{\n        body,\n        tag,\n        renotify:true,\n        icon:NOTIF_ICON_DATA_URL,\n        badge:NOTIF_ICON_DATA_URL,\n        vibrate:reminder.vib?[200,80,200]:undefined,\n        data:{reminderId:reminder.id},\n        actions:[\n          {action:\"done\",title:\"\u2713 Done\"},\n          {action:\"later\",title:\"\u23f1 Later\"}\n        ]\n      });\n      return true;\n    }catch(e){/* fall through to legacy Notification */}\n  }\n  if(\"Notification\" in window&&notifPermission===\"granted\"){\n    try{\n      const n=new Notification(title,{body,tag,icon:NOTIF_ICON_DATA_URL});\n      n.onclick=()=>{window.focus();n.close();};\n      return true;\n    }catch(e){}\n  }\n  return false;\n}\n\n// Handles Done/Later tapped from the REAL system notification (works even\n// if this came from a background tap, routed via the Service Worker).\nfunction handleNotifAction(msg){\n  const id=msg.data&&msg.data.reminderId;\n  const r=S.reminders.find(x=>x.id===id);\n  if(!r)return;\n  if(msg.action===\"done\")dismissNotifDone(r);\n  else if(msg.action===\"later\")dismissNotifLater(r);\n  else set({notifAlert:r}); // plain tap/open \u2014 show in-app detail\n}\n\n// Small bell icon, used as the notification's icon/badge so it reads as a\n// proper branded app notification rather than a generic browser icon.\nconst NOTIF_ICON_DATA_URL=\"data:image/svg+xml;base64,\"+btoa(\n  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"192\" height=\"192\" viewBox=\"0 0 192 192\">'+\n  '<rect width=\"192\" height=\"192\" rx=\"40\" fill=\"#2f6bf0\"/>'+\n  '<path d=\"M96 40c-22 0-40 18-40 40v22l-10 18h100l-10-18V80c0-22-18-40-40-40z\" fill=\"#f3efe4\"/>'+\n  '<circle cx=\"96\" cy=\"140\" r=\"12\" fill=\"#f3efe4\"/>'+\n  '</svg>'\n);\n\n// \u2605 show in-app alert popup for a reminder (with Done + Later buttons) \u2014\n// also fires the real system notification alongside it.\nfunction showNotifAlert(reminder){\n  // Sound always plays. Vibrate is additive \u2014 when ON, the phone also\n  // vibrates alongside the ringtone (not instead of it).\n  const snd=NOTIFY_SOUNDS.find(s=>s.id===reminder.sound);\n  if(snd)playTone(snd.freqs,snd.type);\n  if(reminder.vib&&\"vibrate\" in navigator)navigator.vibrate([200,80,200]);\n  fireSystemNotification(reminder);\n  set({notifAlert:reminder});\n}\n\n// \u2605 NEW: user clicked Done on the alert\nfunction dismissNotifDone(r){\n  if(reminderRepeats(r)){\n    set({\n      notifAlert:null,\n      reminders:S.reminders.map(x=>x.id===r.id?{...x,dt:nextOccurrence(x.dt,x.repeat,x.repeatMin),lastFired:new Date().toISOString().slice(0,16)}:x)\n    });\n    toast(\"Done \u2014 next reminder scheduled \u2713\");\n  } else {\n    set({\n      notifAlert:null,\n      reminders:S.reminders.map(x=>x.id===r.id?{...x,on:false,lastFired:new Date().toISOString().slice(0,16)}:x)\n    });\n    toast(\"Marked as done \u2713\");\n  }\n}\n\n// \u2605 NEW: user clicked Later \u2014 re-alert in exactly 1 hour, keep looping\nfunction dismissNotifLater(r){\n  set({notifAlert:null});\n  toast(\"Reminding again in 1 hour \u23f1\");\n  // Schedule re-alert in 1 hour (3600000 ms)\n  // We update the reminder's dt to 1 hour from now so the firing engine picks it up\n  const newDt=new Date(Date.now()+3600000).toISOString();\n  set({\n    reminders:S.reminders.map(x=>x.id===r.id\n      ?{...x,dt:newDt,on:true,lastFired:\"snoozed_\"+Date.now()} // unique key prevents re-fire within same minute\n      :x)\n  });\n}\n\nfunction fireNativeOrBanner(title,body,onOpen){\n  if(swReg&&notifPermission===\"granted\"){\n    try{\n      swReg.showNotification(title,{body:body||\"\",icon:NOTIF_ICON_DATA_URL,badge:NOTIF_ICON_DATA_URL,tag:\"remindme-generic-\"+Date.now()});\n      if(onOpen)navigator.serviceWorker.addEventListener(\"message\",function h(ev){if(ev.data&&ev.data.type===\"notif-action\"){onOpen();navigator.serviceWorker.removeEventListener(\"message\",h);}});\n      return;\n    }catch(e){}\n  }\n  if(\"Notification\" in window&&notifPermission===\"granted\"){\n    try{const n=new Notification(title,{body:body||\"\",icon:NOTIF_ICON_DATA_URL});n.onclick=()=>{window.focus();n.close();if(onOpen)onOpen();};return;}catch(e){}\n  }\n  showBannerSimple(title,body,onOpen);\n}\nfunction showBannerSimple(title,body,onClick){\n  const banner=D({cls:\"notify-banner\",style:{cursor:onClick?\"pointer\":\"default\"}});\n  banner.appendChild(D({cls:\"notify-banner-icon\"},\"\ud83d\udd14\"));\n  const txt=D({cls:\"notify-banner-txt\"});\n  txt.appendChild(Sp({style:{fontWeight:\"800\",fontSize:\"13px\",color:\"var(--text)\"}},title));\n  txt.appendChild(P({style:{fontSize:\"11.5px\",color:\"var(--sub)\",marginTop:\"2px\"}},body||\"\"));\n  banner.appendChild(txt);\n  if(onClick)banner.addEventListener(\"click\",()=>{banner.classList.remove(\"show\");setTimeout(()=>banner.remove(),300);onClick();});\n  document.body.appendChild(banner);\n  requestAnimationFrame(()=>banner.classList.add(\"show\"));\n  setTimeout(()=>{banner.classList.remove(\"show\");setTimeout(()=>banner.remove(),300);},3200);\n}\n\nlet ringBeatInterval=null,ringPhaseTimeout=null,ringGapTimeout=null,ringCycleCount=0,ringMaxCycles=3,ringCurrentAlarm=null;\nfunction ringSound(alarm){\n  if(!alarm)return;\n  if(alarm.customSound)playCustom(alarm.customSound.data);\n  else{const snd=ALARM_SOUNDS.find(s=>s.id===alarm.sound);if(snd)playTone(snd.freqs,snd.type);}\n  if(alarm.vib&&\"vibrate\" in navigator)navigator.vibrate([400,150,400,150,400]);\n}\nfunction runRingCycle(){\n  if(!ringCurrentAlarm)return;\n  ringCycleCount++;\n  ringSound(ringCurrentAlarm);\n  ringBeatInterval=setInterval(()=>ringSound(ringCurrentAlarm),1300);\n  ringPhaseTimeout=setTimeout(()=>{\n    if(ringBeatInterval){clearInterval(ringBeatInterval);ringBeatInterval=null;}\n    if(ringCycleCount>=ringMaxCycles){\n      // all repeats done: go quiet, ring screen stays up until Dismiss is tapped\n      return;\n    }\n    ringGapTimeout=setTimeout(runRingCycle,30000);\n  },45000);\n}\nfunction startRingLoop(alarm){\n  stopRingLoop();\n  ringCurrentAlarm=alarm;\n  ringMaxCycles=alarm.snoozeMax||3;\n  ringCycleCount=0;\n  runRingCycle();\n}\nfunction stopRingLoop(){\n  if(ringBeatInterval){clearInterval(ringBeatInterval);ringBeatInterval=null;}\n  if(ringPhaseTimeout){clearTimeout(ringPhaseTimeout);ringPhaseTimeout=null;}\n  if(ringGapTimeout){clearTimeout(ringGapTimeout);ringGapTimeout=null;}\n  ringCurrentAlarm=null;\n  ringCycleCount=0;\n}\n\nfunction checkDue(){\n  const now=new Date();\n  const nowKey=now.toISOString().slice(0,16);\n  if(S.notifAlert)return; // don't fire another while one is open\n\n  let remindersChanged=false;\n  let alertTarget=null;\n  const updatedReminders=S.reminders.map(r=>{\n    if(!r.on)return r;\n    if(r.lastFired&&r.lastFired===nowKey)return r;\n    if(r.lastFired&&r.lastFired.startsWith(\"snoozed_\")){\n      // snoozed reminder \u2014 check if its new dt has arrived\n      const snoozeReady=new Date(r.dt)<=now&&(now-new Date(r.dt))<5*60000;\n      if(!snoozeReady)return r;\n    } else {\n      const due=new Date(r.dt)<=now&&(now-new Date(r.dt))<5*60000;\n      if(!due)return r;\n    }\n    remindersChanged=true;\n    if(!alertTarget)alertTarget=r; // show popup for the first due reminder\n    return {...r,lastFired:nowKey};\n  });\n\n  const todayVal=now.getDay()+1;\n  let alarmsChanged=false,toRing=null;\n  const updatedAlarms=S.alarms.map(a=>{\n    if(!a.on||a.lastFired===nowKey||a.h!==now.getHours()||a.m!==now.getMinutes())return a;\n    const dayMatch=a.days.length===0||a.days.includes(todayVal);\n    if(!dayMatch)return a;\n    alarmsChanged=true;toRing=a;\n    return a.days.length===0?{...a,lastFired:nowKey,on:false}:{...a,lastFired:nowKey};\n  });\n\n  if(remindersChanged||alarmsChanged){\n    S={...S,\n      reminders:remindersChanged?updatedReminders:S.reminders,\n      alarms:alarmsChanged?updatedAlarms:S.alarms,\n      ringing:toRing||S.ringing,\n    };\n    savePersisted();\n    if(toRing)startRingLoop(toRing);\n    if(alertTarget){\n      showNotifAlert(alertTarget);\n      return; // showNotifAlert calls set() internally\n    }\n    render();\n  }\n}\nsetInterval(checkDue,15000);\ncheckDue();\n\n// \u2500\u2500\u2500 SHARED UI COMPONENTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nfunction Tog(on,cb){\n  const w=D({cls:\"tog\",style:{background:on?\"linear-gradient(135deg,#3b82f6,#2f6bf0)\":\"#c9d6ea\"},onClick:cb});\n  w.appendChild(D({cls:\"tog-knob\",style:{left:on?\"23px\":\"3px\"}}));\n  return w;\n}\n\nfunction Sheet(title,onClose,body){\n  const ov=D({cls:\"ov\"});\n  ov.appendChild(D({cls:\"ov-bg\",onClick:onClose}));\n  const sh=D({cls:\"sheet\"});\n  sh.appendChild(D({cls:\"sheet-handle\"}));\n  const hd=D({cls:\"sheet-head\"});\n  hd.appendChild(Sp({cls:\"sheet-head-title\"},title));\n  hd.appendChild(B({cls:\"sheet-close\",onClick:onClose},\"\u00d7\"));\n  sh.appendChild(hd);\n  const bd=D({cls:\"sheet-body\"});\n  bd.appendChild(body);\n  sh.appendChild(bd);\n  ov.appendChild(sh);\n  return ov;\n}\n\nfunction Hdr(eye,title,sub,statCount){\n  const w=D({cls:\"hdr\"});\n  w.appendChild(D({cls:\"hdr-eye\"},eye));\n  w.appendChild(el(\"h1\",{style:{fontFamily:\"'Fraunces','Source Serif 4',Georgia,serif\",fontSize:\"32px\",fontWeight:\"600\",letterSpacing:\"-.5px\",color:\"var(--ink)\",lineHeight:\"1.05\"}},title));\n  if(sub)w.appendChild(P({cls:\"hdr-sub\"},sub));\n  if(statCount!==undefined){\n    const pill=D({cls:\"stat-pill\"});\n    pill.appendChild(D({cls:\"stat-dot\"}));\n    pill.appendChild(document.createTextNode(statCount));\n    w.appendChild(pill);\n  }\n  w.appendChild(D({cls:\"hdr-divider\"}));\n  return w;\n}\n\nfunction NotifyHdr(sub,statCount){\n  const w=D({cls:\"hdr hdr-notify\"});\n  w.appendChild(D({cls:\"hdr-eye\"},\"NOTIFICATIONS\"));\n  const row=D({cls:\"hdr-notify-row\"});\n  row.appendChild(el(\"h1\",{cls:\"hdr-notify-title\"},\"Notify\"));\n  const tag=D({cls:\"hdr-tagline\"});\n  tag.appendChild(Sp({cls:\"tg1\"},\"Small reminders\"));\n  tag.appendChild(Sp({cls:\"tg2\"},\"Big movements.\"));\n  row.appendChild(tag);\n  w.appendChild(row);\n  if(sub)w.appendChild(P({cls:\"hdr-sub\"},sub));\n  if(statCount!==undefined){\n    const pill=D({cls:\"stat-pill\"});\n    pill.appendChild(D({cls:\"stat-dot\"}));\n    pill.appendChild(document.createTextNode(statCount));\n    w.appendChild(pill);\n  }\n  return w;\n}\n\nfunction AppStatusBar(){\n  const bar=D({cls:\"app-status-bar\"});\n  const brand=D({cls:\"app-brand\"});\n  brand.appendChild(D({cls:\"app-brand-dot\"}));\n  brand.appendChild(Sp({cls:\"app-brand-name\"},\"Reminder Hub\"));\n  bar.appendChild(brand);\n  bar.appendChild(Sp({cls:\"app-version\"},\"v2.0\"));\n  return bar;\n}\n\n// Nav() removed \u2014 the combined app's bottom nav is owned by the shared\n// React shell (BottomNav component), not by this engine. See BottomNav\n// for the equivalent active-tab styling (active line, glow, pip).\n\nfunction SoundRow(label,onOpen){\n  const row=D({cls:\"snd-summary-row\",onClick:onOpen});\n  const left=D({style:{display:\"flex\",alignItems:\"center\",gap:\"10px\"}});\n  left.appendChild(Sp({style:{color:\"var(--text)\",fontSize:\"14px\",fontWeight:\"600\"}},label));\n  row.appendChild(left);\n  row.appendChild(Sp({style:{color:\"var(--muted)\",fontSize:\"14px\"}},\"\u203a\"));\n  return row;\n}\n\nfunction SoundPopup(title,list,selectedId,onPick,onClose,opts){\n  opts=opts||{};\n  const previewId=S._soundPreview!==undefined?S._soundPreview:selectedId;\n  const ov=D({cls:\"ov\",style:{zIndex:\"300\"}});\n  ov.appendChild(D({cls:\"ov-bg\",onClick:onClose}));\n  const sh=D({cls:\"sheet\"});\n  sh.appendChild(D({cls:\"sheet-handle\"}));\n  const hd=D({cls:\"sheet-head\"});\n  hd.appendChild(Sp({cls:\"sheet-head-title\"},title));\n  hd.appendChild(B({cls:\"sheet-close\",onClick:onClose},\"\u00d7\"));\n  sh.appendChild(hd);\n  const bd=D({cls:\"sheet-body\"});\n  const listWrap=D({cls:\"snd-list\"});\n  list.forEach(snd=>{\n    const active=previewId===snd.id&&!(opts.customActive&&S._soundPreview===undefined);\n    const item=D({cls:\"snd-list-item\"+(active?\" active\":\"\"),onClick:()=>{playTone(snd.freqs,snd.type);set({_soundPreview:snd.id});}});\n    item.appendChild(Sp({style:{flex:\"1\",fontSize:\"14px\",fontWeight:\"600\",color:active?\"var(--cyan)\":\"var(--text)\"}},snd.label));\n    if(active)item.appendChild(Sp({style:{color:\"var(--cyan)\",fontSize:\"15px\"}},\"\u2713\"));\n    listWrap.appendChild(item);\n  });\n  if(opts.allowCustom){\n    const active=!!opts.customActive;\n    const item=D({cls:\"snd-list-item custom\"+(active?\" active\":\"\"),onClick:()=>opts.onCustomClick()});\n    item.appendChild(Sp({style:{fontSize:\"17px\"}},active?\"\u2705\":\"\u2795\"));\n    item.appendChild(Sp({style:{flex:\"1\",fontSize:\"14px\",fontWeight:\"600\",color:active?\"var(--violet)\":\"var(--text)\"}},active?(opts.customName||\"Custom Sound\"):\"Custom Sound\"));\n    if(active)item.appendChild(Sp({style:{color:\"var(--violet)\",fontSize:\"15px\"}},\"\u2713\"));\n    listWrap.appendChild(item);\n  }\n  bd.appendChild(listWrap);\n  bd.appendChild(B({cls:\"save-btn\",style:{marginTop:\"14px\"},onClick:()=>{if(S._soundPreview!==undefined)onPick(S._soundPreview);else onClose();}},\"\u2713 Use This Sound\"));\n  sh.appendChild(bd);\n  ov.appendChild(sh);\n  return ov;\n}\n\n// \u2605 Android-style top notification \u2014 slides DOWN from top like a real system notification\nfunction NotifAlertPopup(r){\n  const tc=TAG_COLORS[r.tag]||\"#2f6bf0\";\n  const now=new Date();\n  const timeStr=now.toLocaleTimeString(\"en-IN\",{hour:\"2-digit\",minute:\"2-digit\"});\n\n  const ov=D({cls:\"notif-overlay\"});\n  const card=D({cls:\"notif-card\"});\n\n  // TOP BAR: app icon \u00b7 name \u00b7 time \u00b7 \u2715 (exactly like Android)\n  const topbar=D({cls:\"notif-topbar\"});\n  topbar.appendChild(D({cls:\"notif-app-icon\"},\"\ud83d\udd14\"));\n  topbar.appendChild(Sp({cls:\"notif-app-label\"},\"Reminder Hub\"));\n  topbar.appendChild(Sp({cls:\"notif-timestamp\"},timeStr+\" \u00b7 Just now\"));\n  topbar.appendChild(B({cls:\"notif-close-x\",onClick:()=>set({notifAlert:null})},\"\u00d7\"));\n  card.appendChild(topbar);\n\n  // MAIN CONTENT: icon + title + note + badges\n  const header=D({cls:\"notif-header\",style:{cursor:\"pointer\"},onClick:()=>{set({notifAlert:null,tab:\"notify\",rm:true,re:r,rt:r.title,rn:r.note||\"\",rdt:toLocal(r.dt),rrep:r.repeat,rtag:r.tag,rvib:r.vib,rsound:r.sound||\"default\",rsoundPopup:false});}});\n  header.appendChild(D({cls:\"notif-icon-wrap\"},\"\ud83d\udd14\"));\n  const meta=D({cls:\"notif-meta\"});\n  meta.appendChild(D({cls:\"notif-title\"},r.title));\n  if(r.note)meta.appendChild(P({cls:\"notif-note\"},r.note));\n  const badgeWrap=D({style:{display:\"flex\",alignItems:\"center\",gap:\"6px\",flexWrap:\"wrap\",marginTop:\"6px\"}});\n  badgeWrap.appendChild(Sp({cls:\"notif-badge\",style:{background:tc+\"18\",color:tc,border:\"1px solid \"+tc+\"28\",padding:\"2px 8px\",borderRadius:\"999px\",fontSize:\"9px\",fontWeight:\"800\"}},r.tag));\n  if(reminderRepeats(r))\n    badgeWrap.appendChild(Sp({cls:\"notif-badge\",style:{background:\"rgba(155,140,255,.12)\",color:\"var(--violet)\",border:\"1px solid rgba(155,140,255,.22)\",padding:\"2px 8px\",borderRadius:\"999px\",fontSize:\"9px\",fontWeight:\"800\"}},\"\u21bb \"+repeatLabel(r)));\n  if(r.snoozedCount&&r.snoozedCount>0)\n    badgeWrap.appendChild(Sp({cls:\"notif-snooze-label\"},\"\u23f1 Snoozed \u00d7\"+r.snoozedCount));\n  meta.appendChild(badgeWrap);\n  header.appendChild(meta);\n  card.appendChild(header);\n\n  // ACTION BUTTONS\n  const actions=D({cls:\"notif-actions\"});\n  const laterBtn=B({cls:\"notif-btn notif-btn-later\",onClick:()=>{\n    const updated={...r,snoozedCount:(r.snoozedCount||0)+1};\n    set({notifAlert:null});\n    const newDt=new Date(Date.now()+3600000).toISOString();\n    set({reminders:S.reminders.map(x=>x.id===r.id?{...updated,dt:newDt,on:true,lastFired:\"snoozed_\"+Date.now()}:x)});\n    toast(\"Reminding again in 1 hour \u23f1\");\n  }});\n  laterBtn.textContent=\"\u23f1  Later (1 hr)\";\n  actions.appendChild(laterBtn);\n\n  const doneBtn=B({cls:\"notif-btn notif-btn-done\",onClick:()=>dismissNotifDone(r)});\n  doneBtn.textContent=\"\u2713  Done\";\n  actions.appendChild(doneBtn);\n  card.appendChild(actions);\n\n  // PROGRESS BAR (auto-dismiss hint)\n  card.appendChild(D({cls:\"notif-swipe-hint\"}));\n\n  ov.appendChild(card);\n\n  // Auto-dismiss after 30s like a real notification\n  setTimeout(()=>{if(S.notifAlert&&S.notifAlert.id===r.id)set({notifAlert:null});},30000);\n\n  return ov;\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// NOTIFY (Reminders)\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction openRM(e){\n  if(e)set({rm:true,re:e,rt:e.title,rn:e.note||\"\",rdt:toLocal(e.dt),rrep:e.repeat||\"Minutes\",rrepMin:e.repeatMin||0,rtag:e.tag,rvib:e.vib,rsound:e.sound||\"default\",rsoundPopup:false});\n  else set({rm:true,re:null,rt:\"\",rn:\"\",rdt:new Date(Date.now()+3600000).toISOString().slice(0,16),rrep:\"Minutes\",rrepMin:0,rtag:\"Other\",rvib:true,rsound:\"default\",rsoundPopup:false});\n}\nfunction saveR(){\n  if(!S.rt.trim())return;\n  const item={id:S.re?.id||uid(),title:S.rt,note:S.rn,dt:new Date(S.rdt).toISOString(),repeat:S.rrep,repeatMin:S.rrep===\"Minutes\"?(S.rrepMin||0):0,tag:S.rtag,vib:S.rvib,sound:S.rsound,on:true,snoozedCount:0};\n  const ex=S.reminders.some(r=>r.id===item.id);\n  set({reminders:ex?S.reminders.map(r=>r.id===item.id?item:r):[item,...S.reminders],rm:false,re:null});\n  toast(\"Reminder saved\");\n}\n\nfunction NotifyScreen(){\n  const sc=D({cls:\"screen screen-notify\"});\n  sc.appendChild(AppStatusBar());\n  const act=S.reminders.filter(r=>r.on).length;\n  const up=S.reminders.filter(r=>new Date(r.dt)>=Date.now()).sort((a,b)=>new Date(a.dt)-new Date(b.dt));\n  const ps=S.reminders.filter(r=>new Date(r.dt)<Date.now());\n  sc.appendChild(NotifyHdr(`${up.length} upcoming \u00b7 ${ps.length} past`,`${act} active`));\n  sc.appendChild(B({cls:\"add-bar-btn\",onClick:()=>openRM(null)},[Sp({cls:\"add-bar-icon\"},\"\uff0b\"),\"New Reminder\"]));\n  const body=D({style:{padding:\"0 16px\"}});\n  if(!S.reminders.length){\n    body.appendChild(D({cls:\"empty\"},[D({cls:\"empty-icon\"},\"\ud83d\udd14\"),P({cls:\"empty-text\"},\"No reminders yet.\\nTap to add your first one.\")]));\n  } else {\n    if(up.length){body.appendChild(P({cls:\"sec-lbl\",style:{color:\"var(--cyan)\"}},\"UPCOMING\"));up.forEach(r=>body.appendChild(RCard(r)));}\n    if(ps.length){body.appendChild(P({cls:\"sec-lbl\"},\"PAST\"));ps.forEach(r=>body.appendChild(RCard(r)));}\n  }\n  sc.appendChild(body);\n  if(S.rm)sc.appendChild(Sheet(S.re?\"Edit Reminder\":\"New Reminder\",()=>set({rm:false,re:null}),RForm()));\n  return sc;\n}\n\nfunction SealStamp(dt){\n  const d=new Date(dt);\n  const h=d.getHours()%12||12;\n  const m=String(d.getMinutes()).padStart(2,\"0\");\n  const ampm=d.getHours()>=12?\"PM\":\"AM\";\n  const seal=D({cls:\"seal-stamp\"});\n  seal.appendChild(Sp({cls:\"seal-stamp-time\"},`${h}:${m}`));\n  seal.appendChild(Sp({cls:\"seal-stamp-ampm\"},ampm));\n  return seal;\n}\n\nfunction RCard(r){\n  const isPast=new Date(r.dt)<Date.now();\n  const tc=TAG_COLORS[r.tag]||\"#2f6bf0\";\n  const card=D({cls:\"card card-cyan\",style:{opacity:r.on?\"1\":\".45\",cursor:\"pointer\"},onClick:()=>openRM(r)});\n  const row=D({style:{display:\"flex\",justifyContent:\"space-between\",alignItems:\"flex-start\",gap:\"12px\"}});\n  const stampWrap=D({style:{flexShrink:\"0\",paddingTop:\"1px\"}});\n  stampWrap.appendChild(SealStamp(r.dt));\n  const left=D({style:{flex:\"1\",minWidth:\"0\"}});\n  const tr=D({style:{display:\"flex\",flexDirection:\"column\",alignItems:\"flex-start\",gap:\"5px\",marginBottom:\"6px\"}});\n  tr.appendChild(Sp({style:{fontWeight:\"800\",fontSize:\"15.5px\",lineHeight:\"1.3\",color:\"var(--ink)\"}},r.title));\n  tr.appendChild(Sp({cls:\"badge\",style:{background:tc+\"18\",color:tc,border:`1px solid ${tc}30`}},r.tag));\n  if(reminderRepeats(r))tr.appendChild(Sp({style:{fontSize:\"10.5px\",color:\"var(--sub)\",fontWeight:\"700\",letterSpacing:\".8px\"}},\"\u21bb \"+repeatLabel(r).toUpperCase()));\n  left.appendChild(tr);\n  if(r.note)left.appendChild(P({style:{fontSize:\"12.5px\",color:\"var(--sub)\",marginBottom:\"6px\",lineHeight:\"17px\",overflow:\"hidden\",whiteSpace:\"nowrap\",textOverflow:\"ellipsis\"}},r.note));\n  const meta=D({style:{display:\"flex\",alignItems:\"center\",gap:\"8px\",flexWrap:\"wrap\"}});\n  meta.appendChild(Sp({style:{fontSize:\"10.5px\",color:isPast?\"var(--red)\":\"var(--green)\",fontWeight:\"600\"}},fmtDT(r.dt)));\n  if(!isPast)meta.appendChild(Sp({cls:\"ctd\"},cdLabel(r.dt)));\n  if(r.snoozedCount&&r.snoozedCount>0)meta.appendChild(Sp({style:{fontSize:\"9px\",color:\"var(--amber)\",fontWeight:\"700\",background:\"rgba(240,168,87,.08)\",border:\"1px solid rgba(240,168,87,.2)\",borderRadius:\"5px\",padding:\"1px 6px\"}},\"\u23f1 \u00d7\"+r.snoozedCount));\n  const sndName=NOTIFY_SOUNDS.find(s=>s.id===r.sound)?.label;\n  if(sndName)meta.appendChild(Sp({style:{fontSize:\"9.5px\",color:\"var(--muted)\"}},(r.vib?\"Vibrate \u00b7 \":\"\")+sndName));\n  left.appendChild(meta);\n  const act=D({style:{display:\"flex\",flexDirection:\"column\",alignItems:\"flex-end\",gap:\"8px\",flexShrink:\"0\"}});\n  const togWrap=D({onClick:e=>e.stopPropagation()});\n  togWrap.appendChild(Tog(r.on,()=>set({reminders:S.reminders.map(x=>x.id===r.id?{...x,on:!x.on}:x)})));\n  act.appendChild(togWrap);\n  const btns=D({style:{display:\"flex\",gap:\"6px\",justifyContent:\"flex-end\",marginTop:\"10px\"}});\n  btns.appendChild(B({cls:\"edit-btn\",onClick:e=>{\n    e.stopPropagation();\n    if(reminderRepeats(r)){set({reminders:S.reminders.map(x=>x.id===r.id?{...x,dt:nextOccurrence(x.dt,x.repeat,x.repeatMin)}:x)});toast(\"Done \u2014 next reminder scheduled \u2713\");}\n    else{set({reminders:S.reminders.map(x=>x.id===r.id?{...x,on:false}:x)});toast(\"Marked done \u2713\");}\n  }},\"\u2713 Done\"));\n  btns.appendChild(B({cls:\"edit-btn\",onClick:e=>{e.stopPropagation();testNotifyBanner(r);}},\"Test\"));\n  btns.appendChild(B({cls:\"del-btn\",onClick:e=>{e.stopPropagation();set({reminders:S.reminders.filter(x=>x.id!==r.id)});}},\"\u2715\"));\n  row.appendChild(stampWrap);row.appendChild(left);row.appendChild(act);\n  card.appendChild(row);\n  card.appendChild(btns);\n  return card;\n}\n\nfunction testNotifyBanner(r){\n  // Shows the actual full notification popup (same as real fire)\n  showNotifAlert(r);\n}\n\nfunction RForm(){\n  const f=D({cls:\"fg\"});\n  const ti=Inp({cls:\"finp\",placeholder:\"e.g. Mom's Birthday \ud83c\udf82\",value:S.rt,type:\"text\"});\n  ti.addEventListener(\"input\",e=>{S.rt=e.target.value;});\n  f.appendChild(ti);\n  const ni=Ta({cls:\"finp note-box\",placeholder:\"Add a note or reminder details\u2026\"},S.rn);\n  ni.addEventListener(\"input\",e=>{S.rn=e.target.value;});\n  f.appendChild(ni);\n  const dw=D({});\n  dw.appendChild(P({cls:\"lbl\"},\"DATE & TIME\"));\n  const di=Inp({cls:\"finp\",type:\"datetime-local\",value:S.rdt});\n  di.addEventListener(\"change\",e=>{S.rdt=e.target.value;});\n  dw.appendChild(di);\n  f.appendChild(dw);\n  const rw=D({});rw.appendChild(P({cls:\"lbl\"},\"REPEAT\"));\n  const rr=D({cls:\"pill-row\"});\n  REPEAT.forEach(op=>{\n    const a=S.rrep===op;\n    rr.appendChild(B({cls:\"pill\",style:{borderColor:a?\"var(--cyan)\":\"var(--border)\",background:a?\"rgba(47,107,240,.08)\":\"transparent\",color:a?\"var(--cyan)\":\"var(--sub)\"},onClick:()=>{S.rrep=op;set({});}},op));\n  });\n  rw.appendChild(rr);\n  if(S.rrep===\"Minutes\"){\n    const mr=D({cls:\"pill-row\",style:{marginTop:\"8px\"}});\n    REPEAT_MINUTES.forEach(n=>{\n      const a=(S.rrepMin||0)===n;\n      mr.appendChild(B({cls:\"pill\",style:{borderColor:a?\"var(--cyan)\":\"var(--border)\",background:a?\"rgba(47,107,240,.08)\":\"transparent\",color:a?\"var(--cyan)\":\"var(--sub)\"},onClick:()=>{S.rrepMin=n;set({});}},n===0?\"No repeat\":n+\" min\"));\n    });\n    rw.appendChild(mr);\n    rw.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"10.5px\",marginTop:\"6px\"}},(S.rrepMin||0)>0?(\"Repeats every \"+S.rrepMin+\" minutes after it fires\"):\"Fires once, no repeat\"));\n  }\n  f.appendChild(rw);\n  const cw=D({});cw.appendChild(P({cls:\"lbl\"},\"CATEGORY\"));\n  const cr=D({cls:\"pill-row\"});\n  Object.keys(TAG_COLORS).forEach(t=>{\n    const a=S.rtag===t;const c=TAG_COLORS[t];\n    cr.appendChild(B({cls:\"pill\",style:{borderColor:a?c:\"var(--border)\",background:a?c+\"18\":\"transparent\",color:a?c:\"var(--sub)\"},onClick:()=>{S.rtag=t;set({});}},t));\n  });\n  cw.appendChild(cr);f.appendChild(cw);\n  const sw=D({});sw.appendChild(P({cls:\"lbl\"},\"NOTIFICATION SOUND\"));\n  const sndLabel=NOTIFY_SOUNDS.find(s=>s.id===S.rsound)?.label||\"Choose a sound\";\n  sw.appendChild(SoundRow(sndLabel,()=>set({rsoundPopup:true,_soundPreview:undefined})));\n  f.appendChild(sw);\n  const vr=D({cls:\"vib-row\"});\n  vr.appendChild(Sp({style:{color:\"var(--text)\",fontSize:\"14px\"}},\"Vibrate\"));\n  vr.appendChild(Tog(S.rvib,()=>{S.rvib=!S.rvib;set({});}));\n  f.appendChild(vr);\n  f.appendChild(B({cls:\"save-btn\",onClick:saveR},\"Save Reminder\"));\n  if(S.rsoundPopup)f.appendChild(SoundPopup(\"Notification Sound\",NOTIFY_SOUNDS,S.rsound,\n    id=>set({rsound:id,rsoundPopup:false,_soundPreview:undefined}),()=>set({rsoundPopup:false,_soundPreview:undefined})));\n  return f;\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// ALARM\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction openAM(e){\n  if(e)set({am:true,ae:e,ah:e.h,amin:e.m,al:e.label,ad:[...e.days],avib:e.vib,asound:e.sound||\"default\",acustom:e.customSound||null,aphoto:e.photo||null,asoundPopup:false,asnooze:e.snoozeMax||3});\n  else set({am:true,ae:null,ah:7,amin:0,al:\"\",ad:[],avib:true,asound:\"default\",acustom:null,aphoto:null,asoundPopup:false,asnooze:3});\n}\nfunction saveA(){\n  const alarm={id:S.ae?.id||uid(),label:S.al,h:S.ah,m:S.amin,days:[...S.ad],vib:S.avib,sound:S.asound,customSound:S.acustom,photo:S.aphoto,snoozeMax:S.asnooze||3,snoozeLeft:S.asnooze||3,on:true};\n  const ex=S.alarms.some(a=>a.id===alarm.id);\n  set({alarms:ex?S.alarms.map(a=>a.id===alarm.id?alarm:a):[alarm,...S.alarms],am:false,ae:null});\n  toast(\"Alarm saved\");\n}\n\nfunction AlamScreen(){\n  const sc=D({cls:\"screen\"});\n  sc.appendChild(AppStatusBar());\n  const act=S.alarms.filter(a=>a.on).length;\n  sc.appendChild(Hdr(\"SCHEDULE\",\"Alarm\",`${act} active alarm${act!==1?\"s\":\"\"}`,`${S.alarms.length} set`));\n  sc.appendChild(B({cls:\"add-bar-btn\",onClick:()=>openAM(null)},[Sp({cls:\"add-bar-icon\"},\"\uff0b\"),\"New Alarm\"]));\n  const body=D({style:{padding:\"0 16px\"}});\n  if(!S.alarms.length){\n    body.appendChild(D({cls:\"empty\"},[D({cls:\"empty-icon\"},\"\u23f0\"),P({cls:\"empty-text\"},\"No alarms set.\\nTap above to add one.\")]));\n  } else {\n    [...S.alarms].sort((a,b)=>a.h*60+a.m-(b.h*60+b.m)).forEach(a=>body.appendChild(ACard(a)));\n  }\n  sc.appendChild(body);\n  if(S.am)sc.appendChild(Sheet(S.ae?\"Edit Alarm\":\"New Alarm\",()=>set({am:false,ae:null}),AForm()));\n  return sc;\n}\n\nfunction ACard(a){\n  const dl=a.days.length===0?\"Once\":a.days.length===7?\"Every day\":a.days.map(d=>DAYS_L[d-1]).join(\", \");\n  const card=D({cls:\"card card-violet\",style:{opacity:a.on?\"1\":\".4\"}});\n  const row=D({style:{display:\"flex\",justifyContent:\"space-between\",alignItems:\"center\"}});\n  const left=D({style:{flex:\"1\",display:\"flex\",alignItems:\"center\",gap:\"10px\",cursor:\"pointer\"},onClick:()=>openAM(a)});\n  if(a.photo)left.appendChild(Img({src:a.photo,style:{width:\"40px\",height:\"40px\",borderRadius:\"10px\",objectFit:\"cover\",flexShrink:\"0\"}}));\n  const info=D({});\n  info.appendChild(P({style:{fontFamily:\"'Fraunces','Source Serif 4',Georgia,serif\",fontSize:\"30px\",fontWeight:\"600\",letterSpacing:\"-1px\",margin:\"0\",color:\"var(--ink)\"}},fmtT(a.h,a.m)));\n  info.appendChild(P({style:{color:\"var(--sub)\",fontSize:\"13px\",fontWeight:\"600\",margin:\"3px 0 2px\"}},a.label||\"Alarm\"));\n  info.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"9.5px\",fontWeight:\"800\",letterSpacing:\".5px\"}},dl.toUpperCase()));\n  left.appendChild(info);\n  const acts=D({style:{display:\"flex\",flexDirection:\"column\",alignItems:\"flex-end\",gap:\"8px\"}});\n  acts.appendChild(Tog(a.on,()=>set({alarms:S.alarms.map(x=>x.id===a.id?{...x,on:!x.on}:x)})));\n  const btnRow=D({style:{display:\"flex\",gap:\"5px\"}});\n  btnRow.appendChild(B({cls:\"edit-btn\",onClick:()=>{set({ringing:a});startRingLoop(a);}},\"Test\"));\n  btnRow.appendChild(B({cls:\"del-btn\",onClick:()=>set({alarms:S.alarms.filter(x=>x.id!==a.id)})},\"\u2715\"));\n  acts.appendChild(btnRow);\n  row.appendChild(left);row.appendChild(acts);card.appendChild(row);\n  return card;\n}\n\nfunction ScrollWheel(max,value,onChange){\n  const ITEM_H=36,WRAP_H=144,PAD=2;\n  const toScrollTop=v=>(v+PAD)*ITEM_H+ITEM_H/2-WRAP_H/2;\n  const toValue=scrollTop=>Math.round((scrollTop+WRAP_H/2-ITEM_H/2)/ITEM_H)-PAD;\n  const wrap=D({cls:\"wheel-wrap\"});\n  const track=D({cls:\"wheel-track\"});\n  for(let pad=0;pad<PAD;pad++)track.appendChild(D({cls:\"wheel-item blank\"},\"\"));\n  for(let i=0;i<max;i++){track.appendChild(D({cls:\"wheel-item\"+(i===value?\" sel\":\"\"),\"data-val\":i},String(i).padStart(2,\"0\")));}\n  for(let pad=0;pad<PAD;pad++)track.appendChild(D({cls:\"wheel-item blank\"},\"\"));\n  wrap.appendChild(track);wrap.appendChild(D({cls:\"wheel-highlight\"}));\n  let settleTimer=null;\n  const scrollToValue=(v,smooth)=>track.scrollTo({top:toScrollTop(v),behavior:smooth?\"smooth\":\"instant\"});\n  const commit=()=>{const idx=Math.max(0,Math.min(max-1,toValue(track.scrollTop)));if(idx!==value)onChange(idx);else scrollToValue(idx,true);};\n  track.addEventListener(\"scroll\",()=>{clearTimeout(settleTimer);settleTimer=setTimeout(commit,120);});\n  requestAnimationFrame(()=>scrollToValue(value,false));\n  return wrap;\n}\n\nfunction AForm(){\n  const f=D({cls:\"fg\"});\n  const tb=D({cls:\"time-box\"});\n  tb.appendChild(ScrollWheel(24,S.ah,v=>{S.ah=v;set({});}));\n  tb.appendChild(Sp({cls:\"sc\"},\":\"));\n  tb.appendChild(ScrollWheel(60,S.amin,v=>{S.amin=v;set({});}));\n  tb.appendChild(Sp({cls:\"sa\"},S.ah>=12?\"PM\":\"AM\"));\n  f.appendChild(tb);\n  const li=Inp({cls:\"finp\",placeholder:\"Label e.g. Wake up, Workout, Medicine\",value:S.al,type:\"text\"});\n  li.addEventListener(\"input\",e=>{S.al=e.target.value;});\n  f.appendChild(li);\n  const dw=D({});dw.appendChild(P({cls:\"lbl\"},\"REPEAT ON\"));\n  const dr=D({cls:\"day-row\"});\n  DAYS_S.forEach((d,i)=>{\n    const v=i+1;const sel=S.ad.includes(v);\n    dr.appendChild(B({cls:\"day-btn\",style:{borderColor:sel?\"var(--cyan)\":\"var(--border)\",background:sel?\"rgba(47,107,240,.08)\":\"transparent\",color:sel?\"var(--cyan)\":\"var(--muted)\"},\n      onClick:()=>{S.ad=S.ad.includes(v)?S.ad.filter(x=>x!==v):[...S.ad,v];set({});}},d));\n  });\n  dw.appendChild(dr);\n  if(!S.ad.length)dw.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"10.5px\",marginTop:\"6px\"}},\"No days selected \u2014 rings once only\"));\n  f.appendChild(dw);\n  const sw=D({});sw.appendChild(P({cls:\"lbl\"},\"ALARM RINGTONE\"));\n  const fileInput=Inp({type:\"file\",accept:\"audio/*\",style:{display:\"none\"}});\n  fileInput.addEventListener(\"change\",e=>{\n    const file=e.target.files[0];if(!file)return;\n    const reader=new FileReader();\n    reader.onload=ev=>{S.acustom={name:file.name,data:ev.target.result};playCustom(ev.target.result);set({asoundPopup:false,_soundPreview:undefined});};\n    reader.readAsDataURL(file);\n  });\n  sw.appendChild(fileInput);\n  const asndLabel=S.acustom?S.acustom.name:(ALARM_SOUNDS.find(s=>s.id===S.asound)?.label||\"Choose a ringtone\");\n  sw.appendChild(SoundRow(asndLabel,()=>set({asoundPopup:true,_soundPreview:undefined})));\n  f.appendChild(sw);\n  if(S.asoundPopup)f.appendChild(SoundPopup(\"Alarm Ringtone\",ALARM_SOUNDS,S.asound,\n    id=>set({asound:id,acustom:null,asoundPopup:false,_soundPreview:undefined}),()=>set({asoundPopup:false,_soundPreview:undefined}),\n    {allowCustom:true,customActive:!!S.acustom,customName:S.acustom?.name,onCustomClick:()=>fileInput.click()}));\n  const pw=D({});pw.appendChild(P({cls:\"lbl\"},\"PHOTO ON RING SCREEN\"));\n  const photoInput=Inp({type:\"file\",accept:\"image/*\",style:{display:\"none\"}});\n  photoInput.addEventListener(\"change\",e=>{\n    const file=e.target.files[0];if(!file)return;\n    const reader=new FileReader();\n    reader.onload=ev=>{S.aphoto=ev.target.result;set({});};\n    reader.readAsDataURL(file);\n  });\n  const photoPick=D({cls:\"photo-pick\",onClick:()=>photoInput.click()});\n  photoPick.appendChild(photoInput);\n  if(S.aphoto)photoPick.appendChild(Img({src:S.aphoto,cls:\"photo-thumb\"}));\n  else photoPick.appendChild(D({cls:\"photo-placeholder\"},\"\ud83d\uddbc\ufe0f\"));\n  const photoText=D({});\n  photoText.appendChild(P({style:{color:\"var(--text)\",fontSize:\"13px\",fontWeight:\"600\"}},S.aphoto?\"Photo selected\":\"Add a photo\"));\n  photoText.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"10.5px\",marginTop:\"2px\"}},\"Shown full-screen when this alarm rings\"));\n  photoPick.appendChild(photoText);\n  if(S.aphoto){photoPick.appendChild(B({cls:\"photo-clear\",onClick:e=>{e.stopPropagation();S.aphoto=null;set({});}},\"\u2715\"));}\n  pw.appendChild(photoPick);f.appendChild(pw);\n  const snz=D({});snz.appendChild(P({cls:\"lbl\"},\"SNOOZE TIMES\"));\n  const snzRow=D({cls:\"pill-row\"});\n  [1,2,3,5,10].forEach(n=>{\n    const sel=(S.asnooze||3)===n;\n    snzRow.appendChild(B({cls:\"pill\",style:{borderColor:sel?\"var(--cyan)\":\"var(--border)\",background:sel?\"rgba(47,107,240,.08)\":\"transparent\",color:sel?\"var(--cyan)\":\"var(--sub)\"},\n      onClick:()=>{S.asnooze=n;set({});}},n+\"x\"));\n  });\n  snz.appendChild(snzRow);\n  snz.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"10.5px\",marginTop:\"5px\"}},\"How many times snooze is allowed before auto-dismiss\"));\n  f.appendChild(snz);\n  const vr=D({cls:\"vib-row\"});\n  vr.appendChild(Sp({style:{color:\"var(--text)\",fontSize:\"14px\"}},\"Vibrate\"));\n  vr.appendChild(Tog(S.avib,()=>{S.avib=!S.avib;set({});}));\n  f.appendChild(vr);\n  f.appendChild(B({cls:\"save-btn\",onClick:saveA},\"Save Alarm\"));\n  return f;\n}\n\nfunction RingScreen(alarm){\n  const wrap=D({cls:\"ring\"});\n  if(alarm.photo){wrap.appendChild(Img({src:alarm.photo,cls:\"ring-photo-bg\"}));wrap.appendChild(D({cls:\"ring-photo-overlay\"}));}\n  else wrap.appendChild(Sp({cls:\"ring-fallback\"},\"\u23f0\"));\n  wrap.appendChild(Sp({cls:\"ring-time\"},fmtT(alarm.h,alarm.m)));\n  wrap.appendChild(Sp({cls:\"ring-label\"},alarm.label||\"Alarm\"));\n  const actions=D({cls:\"ring-actions\"});\n  const snoozeMax=alarm.snoozeMax||3;\n  const snoozeLeft=alarm.snoozeLeft!==undefined?alarm.snoozeLeft:snoozeMax;\n  const canSnooze=snoozeLeft>0;\n  const snoozeLabel=canSnooze?`Snooze 5 min (${snoozeLeft} left)`:\"No more snooze\";\n  actions.appendChild(B({cls:\"ring-snooze\",style:{opacity:canSnooze?\"1\":\".45\",cursor:canSnooze?\"pointer\":\"default\"},onClick:()=>{\n    if(!canSnooze)return;\n    stopRingLoop();\n    const updatedAlarm={...alarm,snoozeLeft:snoozeLeft-1};\n    set({ringing:null});\n    toast(`Snoozed 5 min \\u2014 ${snoozeLeft-1} left`);\n    setTimeout(()=>{set({ringing:updatedAlarm});startRingLoop(updatedAlarm);},5*60*1000);\n  }},snoozeLabel));\n  actions.appendChild(B({cls:\"ring-dismiss\",onClick:()=>{stopRingLoop();set({ringing:null});}},\"Dismiss\"));\n  wrap.appendChild(actions);\n  return wrap;\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// DIARY\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nlet mediaRecorder=null,recordChunks=[];\n\nfunction DailryScreen(){\n  if(S.dv===\"write\")return DWrite();\n  const sc=D({cls:\"screen diary-light\"});\n  sc.appendChild(AppStatusBar());\n  sc.appendChild(Hdr(\"PERSONAL LOG\",\"Diary\",`${S.diary.length} entr${S.diary.length===1?\"y\":\"ies\"}`));\n  const actRow=D({style:{display:\"flex\",gap:\"8px\",margin:\"0 16px 14px\"}});\n  actRow.appendChild(B({cls:\"add-bar-btn diary-add-bar\",style:{flex:\"1\",margin:\"0\"},onClick:()=>openDW(null)},[Sp({cls:\"add-bar-icon\"},\"\uff0b\"),\"Write New Entry\"]));\n  actRow.appendChild(B({cls:\"add-bar-btn\",style:{flex:\"0 0 auto\",margin:\"0\",background:\"var(--violet)\",padding:\"14px 16px\"},onClick:()=>set({dexport:true,dexFrom:\"\",dexTo:\"\"})},[\"\\ud83d\\udcc4 PDF\"]));\n  sc.appendChild(actRow);\n  const body=D({style:{padding:\"0 16px\"}});\n  if(!S.diary.length){\n    body.appendChild(D({cls:\"empty\"},[D({cls:\"empty-icon\"},\"\ud83d\udcd4\"),P({cls:\"empty-text diary-empty-text\"},\"Your story starts here.\\nTap above to write your first entry.\")]));\n  } else {\n    [...S.diary].sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(e=>body.appendChild(DCard(e)));\n  }\n  sc.appendChild(body);\n  if(S.dexport)sc.appendChild(DExportModal());\n  return sc;\n}\n\nfunction openDW(entry){\n  if(entry)set({dv:\"write\",de:entry,dtitle:entry.title===\"Untitled\"?\"\":entry.title,dbody:stripHtml(entry.body||\"\"),dbodyHtml:entry.body||\"\",dmood:entry.mood||\"\",\n    dbold:!!entry.bold,ditalic:!!entry.italic,dunderline:!!entry.underline,dfsize:entry.fsize||\"normal\",dfont:entry.font||\"handwritten\",dcolor:entry.color||\"\",dlastFont:entry.font||null,dlastSize:entry.fsize||null,dlastColor:entry.color||null,dfontPopup:false,dsizePopup:false,dcolorPopup:false,dphotos:entry.photos?[...entry.photos]:[],dvideos:entry.videos?[...entry.videos]:[],dvoice:entry.voice||null,dmenuOpen:false});\n  else set({dv:\"write\",de:null,dtitle:\"\",dbody:\"\",dbodyHtml:\"\",dmood:\"\",dbold:false,ditalic:false,dunderline:false,dfsize:\"normal\",dfont:\"elegant\",dcolor:\"\",dlastFont:null,dlastSize:null,dlastColor:null,dfontPopup:false,dsizePopup:false,dcolorPopup:false,dphotos:[],dvideos:[],dvoice:null,dmenuOpen:false});\n}\nfunction saveDiary(){\n  if(!S.dtitle.trim()&&!S.dbody.trim()&&!S.dphotos.length&&!S.dvideos.length&&!S.dvoice){set({dv:\"list\",de:null});return;}\n  const entry={id:S.de?.id||uid(),title:S.dtitle||\"Untitled\",body:S.dbodyHtml||S.dbody,mood:S.dmood,bold:S.dbold,italic:S.ditalic,\n    underline:S.dunderline,fsize:S.dfsize||\"normal\",font:S.dfont||'elegant',color:S.dcolor||'',photos:[...S.dphotos],videos:[...S.dvideos],voice:S.dvoice,date:S.de?.date||new Date().toISOString()};\n  const ex=S.diary.some(d=>d.id===entry.id);\n  set({diary:ex?S.diary.map(d=>d.id===entry.id?entry:d):[entry,...S.diary],dv:\"list\",de:null});\n  toast(\"Entry saved\");\n}\n\nfunction MoodRowD(value,onChange){\n  const mr=D({cls:\"mood-row\"});\n  MOODS.forEach(m=>{\n    const sel=value===m;\n    const mb=B({cls:\"mood-btn diary-mood-btn\"+(sel?\" sel\":\"\"),onClick:()=>onChange(value===m?\"\":m)});\n    mb.textContent=m;mr.appendChild(mb);\n  });\n  return mr;\n}\n\nconst DIARY_STYLES=[{id:'normal',lbl:'Normal',family:\"'Inter','Segoe UI',system-ui,sans-serif\"},{id:'elegant',lbl:'Elegant Serif',family:\"'Georgia','Times New Roman',serif\"},{id:'typewriter',lbl:'Typewriter',family:\"'Courier New',monospace\"},{id:'poppins',lbl:'Modern Sans',family:\"'Poppins','Segoe UI',sans-serif\"},{id:'playfair',lbl:'Classic Serif',family:\"'Playfair Display',Georgia,serif\"},{id:'minimalist',lbl:'Minimalist',family:\"'Helvetica Neue',Arial,sans-serif\"},{id:'montserrat',lbl:'Bold Modern',family:\"'Montserrat',sans-serif\"},{id:'handwritten',lbl:'Handwritten',family:\"'Caveat',cursive\"},{id:'dancing',lbl:'Dancing Script',family:\"'Dancing Script',cursive\"},{id:'pacifico',lbl:'Pacifico',family:\"'Pacifico',cursive\"},{id:'indie',lbl:'Indie Flower',family:\"'Indie Flower',cursive\"}];function diaryFontFamily(id){const s=DIARY_STYLES.find(x=>x.id===id);return s?s.family:DIARY_STYLES.find(x=>x.id==='elegant').family;}const _fszGlobal={h1:\"32px\",h2:\"24px\",normal:\"15px\",small:\"11px\"};const DIARY_SIZES=[{id:'h1',lbl:'Heading 1'},{id:'h2',lbl:'Heading 2'},{id:'normal',lbl:'Normal'},{id:'small',lbl:'Small'}];const DIARY_COLORS=[{id:'rosegold',lbl:'Rose Gold',hex:'#b76e79'},{id:'mint',lbl:'Mint',hex:'#1f9e79'},{id:'coral',lbl:'Coral',hex:'#ff6f5e'},{id:'lavender',lbl:'Lavender',hex:'#8878d4'},{id:'sage',lbl:'Sage',hex:'#7c9473'},{id:'burgundy',lbl:'Burgundy',hex:'#7b2d3f'},{id:'peach',lbl:'Peach',hex:'#ff9e7a'},{id:'slateblue',lbl:'Slate Blue',hex:'#5c7ea3'},{id:'plum',lbl:'Plum',hex:'#7d4a6b'},{id:'black',lbl:'Black',hex:'#1a1a1a'},{id:'red',lbl:'Red',hex:'#e53935'},{id:'orange',lbl:'Orange',hex:'#fb8c00'},{id:'yellow',lbl:'Yellow',hex:'#fdd835'},{id:'green',lbl:'Green',hex:'#43a047'},{id:'blue',lbl:'Blue',hex:'#1e88e5'},{id:'indigo',lbl:'Indigo',hex:'#3949ab'},{id:'violet',lbl:'Violet',hex:'#8e24aa'}];function diaryColorHex(id){const c=DIARY_COLORS.find(x=>x.id===id);return c?c.hex:'var(--ink)';}function stripHtml(html){var d=document.createElement('div');d.innerHTML=html||'';return d.textContent||'';}function _diaryTextNodesIn(container){var nodes=[];(function walk(n){if(n.nodeType===3){nodes.push(n);}else{for(var i=0;i<n.childNodes.length;i++)walk(n.childNodes[i]);}})(container);return nodes;}function _diaryLocateOffset(container,idx){var nodes=_diaryTextNodesIn(container);var ci=0;for(var i=0;i<nodes.length;i++){var n=nodes[i];var next=ci+n.textContent.length;if(idx<=next)return {node:n,offset:idx-ci};ci=next;}if(nodes.length)return {node:nodes[nodes.length-1],offset:nodes[nodes.length-1].textContent.length};return {node:container,offset:0};}function diaryGetSelectionOffsets(container){var sel=window.getSelection();if(!sel||sel.rangeCount===0)return null;var range=sel.getRangeAt(0);if(!container.contains(range.commonAncestorContainer))return null;var start=0,end=0;var nodes=_diaryTextNodesIn(container);var ci=0,foundS=-1,foundE=-1;for(var i=0;i<nodes.length;i++){var n=nodes[i];var len=n.textContent.length;if(n===range.startContainer)foundS=ci+range.startOffset;if(n===range.endContainer)foundE=ci+range.endOffset;ci+=len;}if(foundS===-1)foundS=range.startContainer===container?0:ci;if(foundE===-1)foundE=range.endContainer===container?ci:ci;start=Math.min(foundS,foundE);end=Math.max(foundS,foundE);return {start:start,end:end};}function diarySetRangeByOffsets(container,start,end){var s=_diaryLocateOffset(container,start),e=_diaryLocateOffset(container,end);var r=document.createRange();r.setStart(s.node,s.offset);r.setEnd(e.node,e.offset);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);return r;}function diaryWrapSelectionWithStyle(container,start,end,styleObj){if(start==null||end==null||end<=start)return false;var range;try{range=diarySetRangeByOffsets(container,start,end);}catch(e){return false;}var span=document.createElement('span');Object.assign(span.style,styleObj);try{var frag=range.extractContents();span.appendChild(frag);range.insertNode(span);}catch(e){return false;}window.getSelection().removeAllRanges();return true;}function diaryInsertStyleMarker(container,offset,styleObj){var loc;try{loc=_diaryLocateOffset(container,offset);}catch(e){return false;}var node=loc.node,off=loc.offset;var span=document.createElement('span');Object.assign(span.style,styleObj);var zwsp=document.createTextNode('\u200b');span.appendChild(zwsp);var parent=node.parentNode;if(off===node.textContent.length&&parent!==container){var tw=parent;while(tw.parentNode&&tw.parentNode!==container){tw=tw.parentNode;}if(tw.parentNode===container){tw.parentNode.insertBefore(span,tw.nextSibling);}else{container.appendChild(span);}}else if(off===0&&parent!==container){var tw2=parent;while(tw2.parentNode&&tw2.parentNode!==container){tw2=tw2.parentNode;}if(tw2.parentNode===container){tw2.parentNode.insertBefore(span,tw2);}else{container.insertBefore(span,container.firstChild);}}else{var range=document.createRange();range.setStart(node,off);range.setEnd(node,off);try{range.insertNode(span);}catch(e){return false;}}void span.offsetHeight;var nr=document.createRange();nr.setStart(zwsp,1);nr.collapse(true);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(nr);container.focus();return true;}function diaryApplyStyleFromPoint(container,start,end,styleObj,markerStyleObj){if(start!=null&&end!=null&&end>start){return diaryWrapSelectionWithStyle(container,start,end,styleObj);}var offset=start!=null?start:(container.textContent||'').length;return diaryInsertStyleMarker(container,offset,markerStyleObj||styleObj);}function diaryCurrentPendingStyle(){var st={};st.fontWeight=S.dbold?'700':'400';st.fontStyle=S.ditalic?'italic':'normal';var u=!!S.dunderline;st.textDecoration=u?'underline':'none';st.textDecorationLine=u?'underline':'none';st.textDecorationStyle=u?'solid':'';st.textDecorationColor=u?'currentColor':'';st.textDecorationThickness=u?'1px':'';st.textUnderlineOffset=u?'2px':'';var fontId=S.dlastFont||S.dfont||'elegant';var fontDef=(typeof DIARY_STYLES!=='undefined')?DIARY_STYLES.find(function(x){return x.id===fontId;}):null;st.fontFamily=fontDef?fontDef.family:diaryFontFamily(fontId);var sizeId=S.dlastSize||S.dfsize||'normal';st.fontSize=_fszGlobal[sizeId]||'15px';var colorId=(S.dlastColor!=null)?S.dlastColor:S.dcolor;var colorDef=colorId?DIARY_COLORS.find(function(x){return x.id===colorId;}):null;st.color=colorDef?colorDef.hex:'var(--ink)';return st;}function DiaryPickerPopup(title,items,selectedId,onPick,onClose,renderItem){const ov=D({cls:'ov',style:{zIndex:'300'}});ov.appendChild(D({cls:'ov-bg',onClick:onClose}));const sh=D({cls:'sheet'});sh.appendChild(D({cls:'sheet-handle'}));const hd=D({cls:'sheet-head'});hd.appendChild(Sp({cls:'sheet-head-title'},title));hd.appendChild(B({cls:'sheet-close',onClick:onClose},'\u00d7'));sh.appendChild(hd);const bd=D({cls:'sheet-body'});const listWrap=D({cls:'snd-list'});items.forEach(it=>{const active=selectedId===it.id;const item=D({cls:'snd-list-item'+(active?' active':''),style:{display:'flex',alignItems:'center',gap:'0'},onClick:()=>onPick(it.id)});renderItem(item,it,active);if(active)item.appendChild(Sp({style:{color:'var(--cyan)',fontSize:'15px',marginLeft:'8px'}},'\u2713'));listWrap.appendChild(item);});bd.appendChild(listWrap);sh.appendChild(bd);ov.appendChild(sh);return ov;}function DWrite(){\n  const today=new Date().toLocaleDateString(\"en-IN\",{weekday:\"long\",day:\"numeric\",month:\"long\",year:\"numeric\"});\n  const wc=S.dbody?S.dbody.trim().split(/\\s+/).filter(Boolean).length:0;\n  const wrap=D({cls:\"dw diary-light\"});\n  const bar=D({cls:\"dw-bar diary-bar\"});\n  bar.appendChild(B({cls:\"dw-back diary-back\",onClick:()=>set({dv:\"list\",de:null,dmenuOpen:false})},\"\u2190 Back\"));\n  const ti=Inp({cls:\"dw-title diary-title-input\",placeholder:\"Entry title\u2026\",value:S.dtitle,type:\"text\",\n    style:{fontWeight:S.dbold?\"900\":\"800\",fontStyle:S.ditalic?\"italic\":\"normal\",textDecoration:S.dunderline?\"underline\":\"none\"}});\n  ti.addEventListener(\"input\",e=>{S.dtitle=e.target.value;});\n  bar.appendChild(ti);\n  const dotsWrap=D({style:{position:\"relative\",flexShrink:\"0\"}});\n  dotsWrap.appendChild(B({cls:\"diary-dots-btn dark\",onClick:()=>set({dmenuOpen:!S.dmenuOpen})},\"\u22ee\"));\n  if(S.dmenuOpen)dotsWrap.appendChild(DWriteMenu());\n  bar.appendChild(dotsWrap);\n  bar.appendChild(B({cls:\"dw-save diary-save\",onClick:saveDiary},\"SAVE\"));\n  wrap.appendChild(bar);\n  const meta=D({cls:\"dw-meta diary-meta\"});\n  meta.appendChild(Sp({cls:\"dw-date diary-date\"},today));\n  meta.appendChild(D({style:{marginLeft:\"auto\"}},MoodRowD(S.dmood,m=>{S.dmood=m;set({});})));\n  wrap.appendChild(meta);\n  if(S.dphotos.length){\n    const strip=D({cls:\"diary-photo-strip\"});\n    S.dphotos.forEach((p,i)=>{\n      const ph=D({cls:\"diary-photo-thumb-wrap\"});\n      ph.appendChild(Img({src:p,cls:\"diary-photo-thumb\"}));\n      ph.appendChild(B({cls:\"diary-photo-remove\",onClick:()=>{S.dphotos=S.dphotos.filter((_,idx)=>idx!==i);set({});}},\"\u2715\"));\n      strip.appendChild(ph);\n    });\n    wrap.appendChild(strip);\n  }\n  if(S.dvideos.length){\n    const vstrip=D({cls:\"diary-photo-strip\"});\n    S.dvideos.forEach((v,i)=>{\n      const vh=D({cls:\"diary-photo-thumb-wrap\"});\n      const vid=el(\"video\",{src:v,cls:\"diary-photo-thumb\",muted:\"true\"},[]);\n      vh.appendChild(vid);\n      vh.appendChild(B({cls:\"diary-photo-remove\",onClick:()=>{S.dvideos=S.dvideos.filter((_,idx)=>idx!==i);set({});}},\"\u2715\"));\n      vstrip.appendChild(vh);\n    });\n    wrap.appendChild(vstrip);\n  }\n  if(S.dvoice){\n    const vw=D({cls:\"diary-voice-row\"});\n    vw.appendChild(Sp({style:{fontSize:\"15px\"}},\"\ud83c\udf99\ufe0f\"));\n    const audio=el(\"audio\",{controls:\"true\",src:S.dvoice,style:{flex:\"1\",height:\"32px\"}},[]);\n    vw.appendChild(audio);\n    vw.appendChild(B({cls:\"diary-photo-remove\",style:{position:\"static\"},onClick:()=>{S.dvoice=null;set({});}},\"\u2715\"));\n    wrap.appendChild(vw);\n  }\n  const _fsz={h1:\"32px\",h2:\"24px\",normal:\"15px\",small:\"11px\"};\n  const _flh={h1:\"44px\",h2:\"34px\",normal:\"25px\",small:\"18px\"};\n  const body=D({cls:'dw-body diary-body-input',style:{fontWeight:'400',fontStyle:'normal',textDecoration:'none',fontSize:_fsz[S.dfsize||'normal']||'15px',lineHeight:_flh[S.dfsize||'normal']||'25px',fontFamily:diaryFontFamily(S.dfont||'elegant'),color:S.dcolor?diaryColorHex(S.dcolor):'var(--ink)',whiteSpace:'pre-wrap',wordBreak:'break-word',outline:'none'},contenteditable:'true'});body.innerHTML=S.dbodyHtml||'';wrap.appendChild(body);const foot=D({cls:'dw-foot diary-foot'});const fb=B({cls:'fmt-btn diary-fmt-btn'+(S.dbold?' active':''),onClick:()=>{const offs=diaryGetSelectionOffsets(body);const st=offs?offs.start:null,en=offs?offs.end:null;S.dbold=!S.dbold;const on=S.dbold;set({});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{fontWeight:on?'700':'400'},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}}});fb.textContent='B';foot.appendChild(fb);const fi=B({cls:'fmt-btn diary-fmt-btn'+(S.ditalic?' active':''),onClick:()=>{const offs=diaryGetSelectionOffsets(body);const st=offs?offs.start:null,en=offs?offs.end:null;S.ditalic=!S.ditalic;const on=S.ditalic;set({});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{fontStyle:on?'italic':'normal'},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}}});fi.textContent='I';fi.style.fontStyle='italic';foot.appendChild(fi);const fu=B({cls:'fmt-btn diary-fmt-btn'+(S.dunderline?' active':''),onClick:()=>{const offs=diaryGetSelectionOffsets(body);const st=offs?offs.start:null,en=offs?offs.end:null;S.dunderline=!S.dunderline;const on=S.dunderline;set({});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{textDecoration:on?'underline':'none',textDecorationLine:on?'underline':'none',textDecorationStyle:'solid',textDecorationColor:'currentColor',textDecorationThickness:on?'1px':'',textUnderlineOffset:on?'2px':''},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}}});fu.textContent='U';fu.style.textDecoration='underline';foot.appendChild(fu);const _sizeSep=Sp({style:{width:'1px',height:'22px',background:'var(--border)',alignSelf:'center',margin:'0 6px'}});foot.appendChild(_sizeSep);const styleBtn=B({cls:'fmt-btn diary-fmt-btn',style:{fontWeight:'800',fontSize:'13px',fontStyle:'italic'},onClick:()=>{const offs=diaryGetSelectionOffsets(body);S._selStart=offs?offs.start:null;S._selEnd=offs?offs.end:null;S.dfontPopup=true;S.dsizePopup=false;S.dcolorPopup=false;set({});}});styleBtn.textContent='S';foot.appendChild(styleBtn);const sizeBtn=B({cls:'fmt-btn diary-fmt-btn',style:{display:'flex',alignItems:'center',justifyContent:'center',gap:'0'},onClick:()=>{const offs=diaryGetSelectionOffsets(body);S._selStart=offs?offs.start:null;S._selEnd=offs?offs.end:null;S.dsizePopup=true;S.dfontPopup=false;S.dcolorPopup=false;set({});}},[Sp({style:{fontSize:'9px',fontWeight:'800'}},'A'),Sp({style:{fontSize:'15px',fontWeight:'800',marginLeft:'1px'}},'A')]);foot.appendChild(sizeBtn);const colorBtn=B({cls:'fmt-btn diary-fmt-btn',style:{padding:'0',display:'flex',alignItems:'center',justifyContent:'center'},onClick:()=>{const offs=diaryGetSelectionOffsets(body);S._selStart=offs?offs.start:null;S._selEnd=offs?offs.end:null;S.dcolorPopup=true;S.dfontPopup=false;S.dsizePopup=false;set({});}},[Sp({style:{width:'18px',height:'18px',borderRadius:'50%',display:'inline-block',border:'1px solid var(--border)',background:'conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)'}})]);foot.appendChild(colorBtn);const wcLabel=Sp({cls:'wc diary-wc'},`${wc} words`);foot.appendChild(wcLabel);wrap.appendChild(foot);if(S.dfontPopup)wrap.appendChild(DiaryPickerPopup('Text Style',DIARY_STYLES,S.dlastFont||S.dfont||'elegant',id=>{const it=DIARY_STYLES.find(x=>x.id===id);const st=S._selStart,en=S._selEnd;S.dlastFont=id;set({dfontPopup:false});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{fontFamily:it.family},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}},()=>set({dfontPopup:false}),(item,it,active)=>{item.appendChild(Sp({style:{flex:'1',fontFamily:it.family,fontSize:'17px',fontWeight:'600',color:active?'var(--cyan)':'var(--text)'}},it.lbl));}));if(S.dsizePopup)wrap.appendChild(DiaryPickerPopup('Text Size',DIARY_SIZES,S.dlastSize||S.dfsize||'normal',id=>{const st=S._selStart,en=S._selEnd;S.dlastSize=id;set({dsizePopup:false});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{fontSize:_fsz[id]||'15px'},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}},()=>set({dsizePopup:false}),(item,it,active)=>{item.appendChild(Sp({style:{flex:'1',fontSize:_fsz[it.id]||'16px',fontWeight:'700',color:active?'var(--cyan)':'var(--text)'}},it.lbl));}));if(S.dcolorPopup)wrap.appendChild(DiaryPickerPopup('Text Colour',DIARY_COLORS,S.dlastColor!=null?S.dlastColor:(S.dcolor||''),id=>{const c=DIARY_COLORS.find(x=>x.id===id);const st=S._selStart,en=S._selEnd;const turningOff=S.dlastColor===id;S.dlastColor=turningOff?'':id;set({dcolorPopup:false});const nb=document.querySelector('#rm-root .dw-body');if(nb){diaryApplyStyleFromPoint(nb,st,en,{color:turningOff?'var(--ink)':(c?c.hex:'var(--ink)')},diaryCurrentPendingStyle());S.dbodyHtml=nb.innerHTML;S.dbody=nb.innerText||nb.textContent||'';}},()=>set({dcolorPopup:false}),(item,it,active)=>{item.appendChild(Sp({style:{width:'22px',height:'22px',borderRadius:'50%',display:'inline-block',border:'1px solid rgba(0,0,0,.15)',background:it.hex,flexShrink:'0'}}));item.appendChild(Sp({style:{flex:'1',fontSize:'14px',fontWeight:'600',marginLeft:'10px',color:active?'var(--cyan)':'var(--text)'}},it.lbl));}));body.addEventListener('input',()=>{S.dbodyHtml=body.innerHTML;S.dbody=body.innerText||body.textContent||'';const newWc=S.dbody.trim()?S.dbody.trim().split(/\\s+/).filter(Boolean).length:0;wcLabel.textContent=newWc+' word'+(newWc!==1?'s':'')+'';});const photoInput=Inp({type:\"file\",accept:\"image/*\",multiple:\"true\",style:{display:\"none\"},id:\"diaryPhotoInput\"});\n  photoInput.addEventListener(\"change\",e=>{\n    const files=[...e.target.files];if(!files.length)return;\n    let remaining=files.length;\n    files.forEach(file=>{\n      const reader=new FileReader();\n      reader.onload=ev=>{S.dphotos=[...S.dphotos,ev.target.result];remaining--;if(remaining===0)set({dmenuOpen:false});};\n      reader.readAsDataURL(file);\n    });\n  });\n  wrap.appendChild(photoInput);\n  const videoInput=Inp({type:\"file\",accept:\"video/*\",multiple:\"true\",style:{display:\"none\"},id:\"diaryVideoInput\"});\n  videoInput.addEventListener(\"change\",e=>{\n    const files=[...e.target.files];if(!files.length)return;\n    let remaining=files.length;\n    files.forEach(file=>{\n      const reader=new FileReader();\n      reader.onload=ev=>{if(ev.target.result.length>5*1024*1024){toast(\"Video too large (max 5MB)\");remaining--;if(remaining===0)set({dmenuOpen:false});return;}S.dvideos=[...S.dvideos,ev.target.result];remaining--;if(remaining===0)set({dmenuOpen:false});};\n      reader.readAsDataURL(file);\n    });\n  });\n  wrap.appendChild(videoInput);\n  return wrap;\n}\n\nfunction DWriteMenu(){\n  const menu=D({cls:\"diary-card-menu dark-menu\"});\n  menu.appendChild(B({cls:\"diary-menu-item\",onClick:()=>{document.getElementById(\"diaryPhotoInput\").click();}},\"Add Image\"));\n  if(S.recording){\n    menu.appendChild(B({cls:\"diary-menu-item danger\",onClick:stopRecording},\"Stop Recording\"));\n  } else {\n    menu.appendChild(B({cls:\"diary-menu-item\",onClick:startRecording},\"Voice Record\"));\n  }\n  return menu;\n}\n\nasync function startRecording(){\n  try{\n    const stream=await navigator.mediaDevices.getUserMedia({audio:true});\n    recordChunks=[];\n    mediaRecorder=new MediaRecorder(stream);\n    mediaRecorder.ondataavailable=e=>recordChunks.push(e.data);\n    mediaRecorder.onstop=()=>{\n      const blob=new Blob(recordChunks,{type:\"audio/webm\"});\n      const reader=new FileReader();\n      reader.onload=ev=>{S.dvoice=ev.target.result;set({recording:false,dmenuOpen:false});};\n      reader.readAsDataURL(blob);\n      stream.getTracks().forEach(t=>t.stop());\n    };\n    mediaRecorder.start();set({recording:true});\n  }catch(e){toast(\"Microphone access denied\");set({dmenuOpen:false});}\n}\nfunction stopRecording(){if(mediaRecorder&&mediaRecorder.state!==\"inactive\")mediaRecorder.stop();}\n\nfunction DCard(entry){\n  const dl=new Date(entry.date).toLocaleDateString(\"en-IN\",{day:\"numeric\",month:\"short\",year:\"numeric\"});\n  const _plain=stripHtml(entry.body||\"\");const wc=_plain?_plain.trim().split(/\\s+/).filter(Boolean).length:0;\n  const card=D({cls:\"card diary-card\"+(S.dmenuOpenId===entry.id?\" menu-open\":\"\"),style:{cursor:\"pointer\"},onClick:()=>openDW(entry)});\n  const row=D({style:{display:\"flex\",gap:\"10px\",alignItems:\"flex-start\"}});\n  const left=D({style:{flex:\"1\",minWidth:\"0\"}});\n  const tr=D({style:{display:\"flex\",alignItems:\"center\",gap:\"8px\",marginBottom:\"5px\"}});\n  if(entry.mood)tr.appendChild(Sp({style:{fontSize:\"18px\"}},entry.mood));\n  tr.appendChild(Sp({style:{fontWeight:entry.bold?\"900\":\"800\",fontStyle:entry.italic?\"italic\":\"normal\",\n    textDecoration:entry.underline?\"underline\":\"none\",fontSize:\"14.5px\",color:\"var(--ink)\",overflow:\"hidden\",whiteSpace:\"nowrap\",textOverflow:\"ellipsis\"}},entry.title));\n  left.appendChild(tr);\n  left.appendChild(P({style:{color:\"#5a5a72\",fontSize:\"12.5px\",lineHeight:\"18px\",marginBottom:\"7px\",overflow:\"hidden\",display:\"-webkit-box\",WebkitLineClamp:\"2\",WebkitBoxOrient:\"vertical\"}},_plain||\"No content\"));\n  const meta=D({style:{display:\"flex\",alignItems:\"center\",gap:\"8px\",flexWrap:\"wrap\"}});\n  meta.appendChild(Sp({style:{fontSize:\"10px\",color:\"#9090a8\",fontWeight:\"600\"}},dl));\n  meta.appendChild(Sp({style:{fontSize:\"9px\",color:\"#9090a8\",fontWeight:\"600\"}},`\u00b7 ${wc} word${wc!==1?\"s\":\"\"}`));\n  if(entry.photos?.length)meta.appendChild(Sp({style:{fontSize:\"9px\",color:\"#9090a8\"}},`\u00b7 \ud83d\udcf7 ${entry.photos.length}`));\n  if(entry.voice)meta.appendChild(Sp({style:{fontSize:\"9px\",color:\"#9090a8\"}},\"\u00b7 \ud83c\udf99\ufe0f\"));\n  left.appendChild(meta);\n  if(entry.photos?.length){\n    const thumbs=D({style:{display:\"flex\",gap:\"6px\",marginTop:\"8px\",flexWrap:\"wrap\"}});\n    entry.photos.slice(0,4).forEach(p=>thumbs.appendChild(Img({src:p,style:{width:\"40px\",height:\"40px\",borderRadius:\"8px\",objectFit:\"cover\"}})));\n    left.appendChild(thumbs);\n  }\n  const dotsBtn=B({cls:\"diary-dots-btn\",onClick:e=>{e.stopPropagation();set({dmenuOpenId:S.dmenuOpenId===entry.id?null:entry.id});}},\"\u22ee\");\n  row.appendChild(left);row.appendChild(dotsBtn);\n  card.appendChild(row);\n  if(S.dmenuOpenId===entry.id)card.appendChild(DCardMenu(entry));\n  return card;\n}\n\nfunction DCardMenu(entry){\n  const menu=D({cls:\"diary-card-menu\",onClick:e=>e.stopPropagation()});\n  menu.appendChild(B({cls:\"diary-menu-item\",onClick:()=>{shareDiaryEntry(entry);set({dmenuOpenId:null});}},\"\ud83d\udd17 Share\"));\n  menu.appendChild(B({cls:\"diary-menu-item danger\",onClick:()=>set({diary:S.diary.filter(d=>d.id!==entry.id),dmenuOpenId:null})},\"\ud83d\uddd1\ufe0f Delete\"));\n  return menu;\n}\n\nasync function shareDiaryEntry(entry){\n  const text=`${entry.title}\\n\\n${stripHtml(entry.body||\"\")}`.trim();\n  if(navigator.share){try{await navigator.share({title:entry.title,text});return;}catch(e){}}\n  try{await navigator.clipboard.writeText(text);toast(\"Copied to clipboard\");}\n  catch(e){toast(\"Couldn't share \u2014 copy manually\");}\n}\n\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\n// \u2500\u2500\u2500 PDF EXPORT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nfunction DExportModal(){\n  const ov=D({cls:\"ov\",style:{zIndex:\"350\"}});\n  ov.appendChild(D({cls:\"ov-bg\",onClick:()=>set({dexport:false})}));\n  const sh=D({cls:\"sheet\"});sh.appendChild(D({cls:\"sheet-handle\"}));\n  const hd=D({cls:\"sheet-head\"});\n  hd.appendChild(Sp({cls:\"sheet-head-title\"},\"Export Diary to PDF\"));\n  hd.appendChild(B({cls:\"sheet-close\",onClick:()=>set({dexport:false})},\"\u00d7\"));\n  sh.appendChild(hd);\n  const bd=D({cls:\"sheet-body\"});const f=D({cls:\"fg\"});\n  const fw=D({});fw.appendChild(P({cls:\"lbl\"},\"FROM DATE\"));\n  const fi=Inp({cls:\"finp\",type:\"date\",value:S.dexFrom});\n  fi.addEventListener(\"change\",e=>{S.dexFrom=e.target.value;});\n  fw.appendChild(fi);f.appendChild(fw);\n  const tw=D({});tw.appendChild(P({cls:\"lbl\"},\"TO DATE\"));\n  const tii=Inp({cls:\"finp\",type:\"date\",value:S.dexTo});\n  tii.addEventListener(\"change\",e=>{S.dexTo=e.target.value;});\n  tw.appendChild(tii);f.appendChild(tw);\n  f.appendChild(P({style:{color:\"var(--muted)\",fontSize:\"10.5px\"}},\"Same date in both fields exports just that day. Leave empty to export everything.\"));\n  f.appendChild(B({cls:\"save-btn\",style:{background:\"var(--violet)\"},onClick:()=>generateDiaryPDF(S.dexFrom,S.dexTo)},\"\ud83d\udcc4 Generate PDF\"));\n  bd.appendChild(f);sh.appendChild(bd);ov.appendChild(sh);\n  return ov;\n}\n\nfunction escHtml(s){return (s||\"\").replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\");}\n\nfunction generateDiaryPDF(fromStr,toStr){\n  let entries=[...S.diary].sort((a,b)=>new Date(a.date)-new Date(b.date));\n  if(fromStr){\n    const from=new Date(fromStr+\"T00:00:00\");\n    const to=toStr?new Date(toStr+\"T23:59:59\"):new Date(fromStr+\"T23:59:59\");\n    entries=entries.filter(e=>{const d=new Date(e.date);return d>=from&&d<=to;});\n  }\n  if(!entries.length){toast(\"No diary entries in that range\");return;}\n  const w=window.open(\"\",\"_blank\");\n  if(!w){toast(\"Popup blocked \u2014 allow popups to export PDF\");return;}\n  const rl=fromStr?(toStr&&toStr!==fromStr?(fromStr+\" to \"+toStr):fromStr):\"All entries\";\n  let bh=\"\";\n  entries.forEach(e=>{\n    const dl=new Date(e.date).toLocaleDateString(\"en-IN\",{weekday:\"long\",day:\"numeric\",month:\"long\",year:\"numeric\"});\n    const tl=new Date(e.date).toLocaleTimeString(\"en-IN\",{hour:\"2-digit\",minute:\"2-digit\"});\n    bh+=\"<div style='page-break-inside:avoid;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #ddd;'>\";\n    bh+=\"<div style='font-size:11px;color:#888;font-family:monospace;'>\"+dl+\" \u00b7 \"+tl+\"</div>\";\n    bh+=\"<div style='font-size:20px;font-weight:700;margin:6px 0;'>\"+(e.mood?e.mood+\" \":\"\")+escHtml(e.title||\"Untitled\")+\"</div>\";\n    if(e.body)bh+=\"<div style='font-size:14px;line-height:1.7;color:#222;'>\"+e.body+\"</div>\";\n    if(e.photos&&e.photos.length){\n      bh+=\"<div style='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;'>\";\n      e.photos.forEach(p=>{bh+=\"<img src='\"+p+\"' style='width:130px;height:130px;object-fit:cover;border-radius:6px;'/>\";});\n      bh+=\"</div>\";\n    }\n    if(e.videos&&e.videos.length)bh+=\"<p style='color:#888;font-size:12px;'>\ud83c\udfa5 \"+e.videos.length+\" video(s) \u2014 view in app</p>\";\n    if(e.voice)bh+=\"<p style='color:#888;font-size:12px;'>\ud83c\udf99\ufe0f Voice note \u2014 view in app</p>\";\n    bh+=\"</div>\";\n  });\n  const ps=\"window.onload=function(){setTimeout(function(){window.print();},300);};\";\n  const html=\"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Reminder Hub Diary</title>\"\n    +\"<style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#222;}h1{font-size:24px;}.meta{color:#888;font-size:12px;margin-bottom:24px;font-family:monospace;}@media print{body{margin:0;padding:20px;}}</style></head>\"\n    +\"<body><h1>\ud83d\udcd4 Diary Export</h1><div class='meta'>Reminder Hub \u00b7 \"+rl+\" \u00b7 \"+entries.length+\" entr\"+(entries.length===1?\"y\":\"ies\")+\" \u00b7 \"+new Date().toLocaleDateString(\"en-IN\")+\"</div>\"\n    +bh+\"<script>\"+ps+\"<\\/script></body></html>\";\n  w.document.write(html);w.document.close();\n  set({dexport:false});\n  toast(\"PDF ready \u2014 use print dialog to save\");\n}\n\n// RENDER\n// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\nfunction render(){\n  const root=document.getElementById(\"rm-root\");\n  if(!root)return;\n  // Preserve scroll position of any open sheet/popup body \u2014 since render()\n  // rebuilds the whole DOM, scrollable panels would otherwise snap back to\n  // the top every time something inside them is tapped (sound pick, day\n  // toggle, vibrate switch, etc).\n  const prevScrollers=[...root.querySelectorAll(\".sheet-body, .screen\")];\n  const scrollMemo=prevScrollers.map(el=>el.scrollTop);\n  root.innerHTML=\"\";\n  // Ring screen (alarm going off)\n  if(S.ringing){root.appendChild(RingScreen(S.ringing));if(window.__rmSetNavHidden)window.__rmSetNavHidden(true);return;}\n  const isDiaryWrite=S.tab===\"dailry\"&&S.dv===\"write\";\n  if(S.tab===\"notify\")root.appendChild(NotifyScreen());\n  else if(S.tab===\"alam\")root.appendChild(AlamScreen());\n  else root.appendChild(DailryScreen());\n  // The shared bottom nav (owned by the React shell) hides during diary\n  // writing, matching the original app's behavior of hiding its own Nav().\n  if(window.__rmSetNavHidden)window.__rmSetNavHidden(isDiaryWrite);\n  // \u2605 NEW: notification alert popup rendered on top of everything\n  if(S.notifAlert)root.appendChild(NotifAlertPopup(S.notifAlert));\n  // Restore scroll positions in the same order the scrollers were found \u2014\n  // the structure (sheet open/closed, which screen) is the same right\n  // after a set(), so positions line up.\n  const newScrollers=[...root.querySelectorAll(\".sheet-body, .screen\")];\n  newScrollers.forEach((el,i)=>{if(scrollMemo[i])el.scrollTop=scrollMemo[i];});\n}\n\n// Expose the engine's render + state accessors so the React wrapper can\n// drive the initial mount and read/write the active tab.\nwindow.__rmEngine={render,get S(){return S;},set,STORE_KEY};\nrender(); // first paint \u2014 checkDue() below only renders if something's due\n";

const REMINDME_CSS="#rm-container, #rm-container *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}\n#rm-container{\n  --bg:#f2f8ff;--bg2:#e4f0fd;--card:#ffffff;--card2:#f4f8ff;--card3:#eaf1fd;\n  --border:#d6e6fa;--border2:#e2eefc;--border3:#bcd6f5;\n  --text:#14213d;--sub:#5b6b8a;--muted:#8fa3c4;\n  --cyan:#2f6bf0;--cyan2:#1d55d6;--cyan3:rgba(47,107,240,.08);\n  --violet:#8b4dea;--violet2:#6d3bc4;\n  --green:#1f9d6b;--red:#e5484d;--amber:#e08a1e;\n  --glass:rgba(255,255,255,.92);\n  --shadow-card:0 6px 22px rgba(59,110,200,.10);\n  --shadow-glow:0 0 0 rgba(0,0,0,0);\n  --ink:#14213d;\n  --seal:#2f6bf0;\n}\n#rm-container{background:\n    repeating-linear-gradient(0deg,rgba(33,29,24,.025) 0px,rgba(33,29,24,.025) 1px,transparent 1px,transparent 28px),\n    var(--bg);\n  font-family:'Source Sans 3','Inter',system-ui,sans-serif;color:var(--text);min-height:100vh;display:flex;justify-content:center;}\n#rm-root{width:100%;max-width:480px;min-height:100vh;position:relative;}\n#rm-container button, #rm-container input, #rm-container textarea{font-family:inherit;outline:none;}\n#rm-container *::-webkit-scrollbar{width:0;}\n#rm-container input[type=\"datetime-local\"]{color-scheme:light;}\n#rm-container .screen{min-height:100vh;padding-bottom:118px;overflow-y:auto;}\n/* \u2500\u2500 TOP STATUS BAR (app identity) \u2014 registry letterhead \u2500\u2500 */\n#rm-container .app-status-bar{\n  display:flex;align-items:center;justify-content:space-between;\n  padding:18px 22px 0;\n}\n#rm-container .app-brand{display:flex;align-items:center;gap:8px;}\n#rm-container .app-brand-dot{width:7px;height:7px;border-radius:50%;background:var(--seal);box-shadow:none;}\n#rm-container .app-brand-name{font-family:'Fraunces','Source Serif 4',Georgia,serif;font-size:13px;font-weight:600;\n  letter-spacing:.5px;color:var(--ink);font-style:italic;}\n#rm-container .app-version{font-size:9px;font-weight:600;color:var(--muted);letter-spacing:1px;\n  font-family:'JetBrains Mono',monospace;text-transform:uppercase;}\n/* \u2500\u2500 HEADER \u2014 ledger heading \u2500\u2500 */\n#rm-container .hdr{padding:22px 22px 16px;}\n#rm-container .hdr-eye{font-size:9.5px;font-weight:700;letter-spacing:2.4px;color:var(--seal);margin-bottom:8px;\n  display:flex;align-items:center;gap:8px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}\n#rm-container .hdr-eye::before{content:'';width:16px;height:1px;background:var(--seal);}\n#rm-container .hdr-title{font-family:'Fraunces','Source Serif 4',Georgia,serif;font-size:34px;font-weight:600;\n  letter-spacing:-.5px;color:var(--ink);line-height:1.05;}\n#rm-container .hdr-sub{font-size:12px;color:var(--sub);margin-top:8px;font-weight:500;letter-spacing:.1px;}\n#rm-container .hdr-divider{height:1px;background:linear-gradient(90deg,var(--border3) 0%,transparent 85%);margin-top:18px;}\n/* \u2500\u2500 NAV \u2014 clean tab strip, not floating dock \u2500\u2500 */\n#rm-container .nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;\n  background:var(--card);\n  border-top:1px solid var(--border);\n  display:flex;z-index:100;padding:8px 0 26px;}\n#rm-container .nav-btn{flex:1;background:none;border:none;cursor:pointer;\n  display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px 4px;position:relative;}\n#rm-container .nav-icon{font-size:20px;transition:filter 0.2s,opacity 0.2s;filter:grayscale(1);}\n#rm-container .nav-label{font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:color 0.2s;\n  font-family:'JetBrains Mono',monospace;}\n#rm-container .nav-pip{width:3px;height:3px;border-radius:50%;background:var(--seal);margin-top:1px;}\n@keyframes pip{0%,100%{opacity:1}50%{opacity:.3}}\n#rm-container .nav-pip{animation:pip 2.5s ease-in-out infinite;}\n#rm-container .nav-active-line{position:absolute;top:0;left:30%;right:30%;height:2px;background:var(--seal);}\n/* \u2500\u2500 CARDS \u2014 ledger rows with a left rule and a wax-seal time stamp \u2500\u2500 */\n#rm-container .card{background:var(--card);border:1px solid var(--border);border-radius:4px;\n  padding:16px 16px 16px 20px;margin-bottom:11px;position:relative;overflow:hidden;\n  box-shadow:var(--shadow-card);\n  transition:transform .15s;}\n#rm-container .card:active{transform:scale(0.99);}\n#rm-container .card.menu-open{overflow:visible;z-index:30;}\n#rm-container .card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;}\n#rm-container .card-cyan::before{background:var(--seal);}\n#rm-container .card-violet::before{background:var(--violet);}\n#rm-container .card-green::before{background:var(--green);}\n#rm-container .card-cyan{box-shadow:var(--shadow-card);}\n#rm-container .sec-lbl{font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;\n  color:var(--muted);margin:22px 0 11px;display:flex;align-items:center;gap:10px;\n  font-family:'JetBrains Mono',monospace;}\n#rm-container .sec-lbl::after{content:'';flex:1;height:1px;background:var(--border);}\n/* \u2500\u2500 TOGGLE \u2500\u2500 */\n#rm-container .tog{width:42px;height:24px;border-radius:3px;position:relative;cursor:pointer;border:1px solid var(--border3);\n  flex-shrink:0;transition:background .25s;}\n#rm-container .tog-knob{position:absolute;top:2px;width:18px;height:18px;border-radius:2px;background:#fff;\n  transition:left .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 3px rgba(33,29,24,.3);}\n/* \u2500\u2500 SHEETS \u2500\u2500 */\n#rm-container .ov{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;justify-content:flex-end;}\n#rm-container .ov-bg{position:absolute;inset:0;background:rgba(33,29,24,.45);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}\n#rm-container .sheet{position:relative;background:var(--bg);border-radius:14px 14px 0 0;\n  border:1px solid var(--border);border-bottom:none;\n  padding:0 0 env(safe-area-inset-bottom);\n  max-height:88vh;display:flex;flex-direction:column;\n  box-shadow:0 -8px 40px rgba(33,29,24,.12);}\n#rm-container .sheet-handle{width:34px;height:3px;border-radius:2px;background:var(--border3);margin:12px auto 0;}\n#rm-container .sheet-head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px 14px;}\n#rm-container .sheet-head-title{font-family:'Fraunces','Source Serif 4',Georgia,serif;font-weight:600;font-size:19px;letter-spacing:-.2px;}\n#rm-container .sheet-close{width:28px;height:28px;border-radius:3px;background:var(--card2);border:1px solid var(--border);\n  color:var(--sub);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;\n  transition:background .15s;}\n#rm-container .sheet-close:active{background:var(--border2);}\n#rm-container .sheet-body{overflow-y:auto;padding:0 22px 28px;flex:1;}\n/* \u2500\u2500 FORM FIELDS \u2500\u2500 */\n#rm-container .fg{display:flex;flex-direction:column;gap:15px;}\n#rm-container .lbl{font-size:9px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;\n  font-family:'JetBrains Mono',monospace;}\n#rm-container .finp{background:var(--card2);color:var(--text);border:1px solid var(--border);\n  border-radius:6px;padding:13px 15px;font-size:14.5px;width:100%;transition:border-color .2s,box-shadow .2s;}\n#rm-container .finp:focus{border-color:var(--seal);box-shadow:0 0 0 3px rgba(47,107,240,.08);}\n#rm-container .finp::placeholder{color:var(--muted);}\n#rm-container .note-box{min-height:80px;resize:vertical;line-height:21px;font-family:inherit;}\n#rm-container .pill-row{display:flex;flex-wrap:wrap;gap:8px;}\n#rm-container .pill{border-radius:4px;padding:7px 14px;font-size:11.5px;font-weight:700;cursor:pointer;\n  border:1px solid;transition:all .15s;white-space:nowrap;letter-spacing:.3px;}\n#rm-container .save-btn{background:var(--seal);border:none;\n  border-radius:6px;padding:15px;width:100%;color:#fbf6ec;font-weight:700;font-size:14.5px;\n  cursor:pointer;letter-spacing:.4px;margin-top:6px;\n  box-shadow:0 3px 12px rgba(47,107,240,.22);transition:opacity .15s,transform .1s;}\n#rm-container .save-btn:active{opacity:.88;transform:scale(0.99);}\n#rm-container .vib-row{display:flex;justify-content:space-between;align-items:center;\n  background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:13px 15px;}\n/* \u2500\u2500 TIME WHEEL \u2500\u2500 */\n#rm-container .time-box{background:var(--card2);border:1px solid var(--border);border-radius:8px;\n  padding:10px 14px;display:flex;justify-content:center;align-items:center;gap:6px;}\n#rm-container .wheel-wrap{position:relative;width:64px;height:144px;}\n#rm-container .wheel-track{height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;\n  scrollbar-width:none;-ms-overflow-style:none;}\n#rm-container .wheel-track::-webkit-scrollbar{display:none;}\n#rm-container .wheel-item{height:36px;display:flex;align-items:center;justify-content:center;\n  scroll-snap-align:center;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;color:var(--muted);\n  transition:font-size .15s,color .15s,font-weight .15s;user-select:none;}\n#rm-container .wheel-item.blank{height:36px;}\n#rm-container .wheel-item.sel{font-size:28px;font-weight:700;color:var(--seal);}\n#rm-container .wheel-highlight{position:absolute;top:54px;left:0;right:0;height:36px;\n  border-top:1px solid var(--border3);border-bottom:1px solid var(--border3);\n  background:rgba(47,107,240,.05);pointer-events:none;border-radius:4px;}\n#rm-container .sc{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--muted);line-height:1;align-self:center;}\n#rm-container .sa{font-size:13px;font-weight:700;color:var(--sub);align-self:center;margin-left:4px;}\n/* \u2500\u2500 DAY BUTTONS \u2500\u2500 */\n#rm-container .day-row{display:flex;gap:7px;justify-content:space-between;}\n#rm-container .day-btn{flex:1;height:38px;border-radius:5px;border:1px solid;\n  font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;letter-spacing:.3px;}\n/* \u2500\u2500 BADGES \u2500\u2500 */\n#rm-container .badge{border-radius:3px;padding:2px 8px;font-size:8.5px;font-weight:700;letter-spacing:.6px;\n  font-family:'JetBrains Mono',monospace;text-transform:uppercase;}\n/* \u2500\u2500 CARD ACTIONS \u2500\u2500 */\n#rm-container .edit-btn{background:rgba(47,107,240,.06);border:1px solid rgba(47,107,240,.25);border-radius:4px;\n  padding:5px 10px;color:var(--seal);font-size:9.5px;font-weight:700;cursor:pointer;letter-spacing:.4px;\n  transition:background .15s;font-family:'JetBrains Mono',monospace;}\n#rm-container .edit-btn:active{background:rgba(47,107,240,.14);}\n#rm-container .del-btn{background:rgba(162,60,46,.06);border:1px solid rgba(162,60,46,.22);border-radius:4px;\n  padding:5px 9px;color:var(--red);font-size:11px;cursor:pointer;transition:background .15s;}\n#rm-container .del-btn:active{background:rgba(162,60,46,.16);}\n/* \u2500\u2500 EMPTY STATE \u2500\u2500 */\n#rm-container .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;\n  padding:70px 40px 40px;gap:12px;text-align:center;}\n#rm-container .empty-icon{font-size:38px;opacity:.25;}\n#rm-container .empty-text{color:var(--sub);font-size:12.5px;line-height:20px;font-weight:500;}\n/* \u2500\u2500 COUNTDOWN TAG \u2500\u2500 */\n#rm-container .ctd{font-size:9px;font-weight:700;background:rgba(47,107,240,.06);\n  border:1px solid rgba(47,107,240,.22);border-radius:3px;padding:2px 7px;color:var(--seal);letter-spacing:.3px;\n  font-family:'JetBrains Mono',monospace;}\n/* \u2500\u2500 SOUND PICKER \u2500\u2500 */\n#rm-container .snd-summary-row{display:flex;justify-content:space-between;align-items:center;\n  background:var(--card2);border:1px solid var(--border);border-radius:6px;\n  padding:13px 15px;cursor:pointer;transition:border-color .15s;}\n#rm-container .snd-summary-row:active{border-color:var(--seal);}\n#rm-container .snd-list{display:flex;flex-direction:column;gap:6px;}\n#rm-container .snd-list-item{display:flex;align-items:center;gap:12px;background:var(--card2);\n  border:1px solid var(--border);border-radius:6px;padding:13px 15px;cursor:pointer;transition:all .15s;}\n#rm-container .snd-list-item.active{border-color:var(--seal);background:rgba(47,107,240,.06);}\n#rm-container .snd-list-item.custom{border-style:dashed;}\n#rm-container .snd-list-item.custom.active{border-color:var(--violet);background:rgba(76,90,71,.08);border-style:solid;}\n/* \u2500\u2500 ADD BAR \u2500\u2500 */\n#rm-container .add-bar-btn{display:flex;align-items:center;justify-content:center;gap:9px;\n  background:var(--seal);border:none;border-radius:6px;\n  padding:14px;margin:0 16px 14px;color:#fbf6ec;font-weight:700;font-size:13px;\n  letter-spacing:.4px;cursor:pointer;\n  box-shadow:0 3px 12px rgba(47,107,240,.22);\n  transition:opacity .15s,transform .1s;}\n#rm-container .add-bar-btn:active{opacity:.85;transform:scale(0.99);}\n#rm-container .add-bar-icon{font-size:16px;}\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n   ANDROID-STYLE TOP NOTIFICATION \u2014 slides down from top.\n   Intentionally kept dark/neutral (real Android system\n   notifications render in OS chrome, not the app's own theme).\n   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n#rm-container .notif-overlay{\n  position:fixed;top:0;left:50%;transform:translateX(-50%);\n  width:100%;max-width:480px;\n  z-index:800;\n  padding:10px 12px 0;\n  pointer-events:none;\n}\n#rm-container .notif-bg{display:none;}\n#rm-container .notif-card{\n  pointer-events:all;\n  width:100%;\n  background:rgba(28,26,22,0.97);\n  border:1px solid rgba(255,255,255,.08);\n  border-radius:14px;\n  padding:0;\n  overflow:hidden;\n  box-shadow:0 8px 32px rgba(0,0,0,.45);\n  animation:notifSlideDown .38s cubic-bezier(.2,1.3,.5,1) both;\n  touch-action:pan-x;\n}\n@keyframes notifSlideDown{\n  from{opacity:0;transform:translateY(-110%) scale(.94)}\n  to{opacity:1;transform:translateY(0) scale(1)}\n}\n#rm-container .notif-topbar{\n  display:flex;align-items:center;gap:8px;\n  padding:10px 14px 6px;\n  border-bottom:1px solid rgba(255,255,255,.06);\n}\n#rm-container .notif-app-icon{\n  width:16px;height:16px;border-radius:3px;flex-shrink:0;\n  background:#2f6bf0;\n  display:flex;align-items:center;justify-content:center;font-size:9px;\n}\n#rm-container .notif-app-label{\n  font-size:11px;font-weight:600;color:rgba(255,255,255,.55);\n  letter-spacing:.3px;flex:1;\n}\n#rm-container .notif-timestamp{font-size:10px;color:rgba(255,255,255,.35);font-weight:500;}\n#rm-container .notif-close-x{\n  background:none;border:none;color:rgba(255,255,255,.35);\n  font-size:16px;cursor:pointer;padding:0 0 0 8px;line-height:1;\n}\n#rm-container .notif-header{\n  padding:10px 14px 12px;\n  display:flex;align-items:flex-start;gap:12px;\n}\n#rm-container .notif-icon-wrap{\n  width:40px;height:40px;border-radius:50%;flex-shrink:0;\n  display:flex;align-items:center;justify-content:center;font-size:20px;\n  background:rgba(47,107,240,.18);border:1px solid rgba(47,107,240,.3);\n}\n#rm-container .notif-meta{flex:1;min-width:0;}\n#rm-container .notif-title{font-size:15px;font-weight:600;color:#fff;letter-spacing:-.1px;line-height:1.25;}\n#rm-container .notif-note{font-size:12px;color:rgba(255,255,255,.5);margin-top:3px;line-height:16px;\n  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n#rm-container .notif-badge{display:inline-flex;align-items:center;gap:4px;margin-top:6px;\n  padding:2px 8px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:.4px;}\n#rm-container .notif-snooze-label{\n  font-size:9.5px;font-weight:700;color:#d9a45a;\n  background:rgba(217,164,90,.12);border:1px solid rgba(217,164,90,.25);\n  border-radius:3px;padding:2px 7px;letter-spacing:.2px;\n  display:inline-flex;align-items:center;gap:4px;margin-top:5px;\n}\n#rm-container .notif-actions{\n  display:flex;gap:8px;\n  padding:0 12px 12px;\n}\n#rm-container .notif-btn{\n  flex:1;border:none;border-radius:8px;padding:11px 10px;cursor:pointer;\n  font-weight:600;font-size:13px;letter-spacing:.2px;\n  transition:opacity .15s,transform .1s;\n}\n#rm-container .notif-btn:active{opacity:.8;transform:scale(0.97);}\n#rm-container .notif-btn-later{\n  background:rgba(255,255,255,.08);\n  color:rgba(255,255,255,.65);\n  border:1px solid rgba(255,255,255,.1);\n}\n#rm-container .notif-btn-done{\n  background:#2f6bf0;\n  color:#fff;font-weight:700;\n}\n#rm-container .notif-swipe-hint{\n  height:3px;\n  background:#2f6bf0;\n  opacity:.4;\n  border-radius:0 0 14px 14px;\n  animation:notifBar 8s linear forwards;\n}\n@keyframes notifBar{from{width:100%}to{width:0%}}\n/* \u2500\u2500 NOTIFY BANNER (slide-down for test) \u2500\u2500 */\n#rm-container .notify-banner{position:fixed;top:-130px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);\n  max-width:448px;background:var(--card);border:1px solid var(--border);border-radius:8px;\n  padding:13px 15px;display:flex;gap:12px;align-items:flex-start;z-index:700;\n  box-shadow:0 8px 28px rgba(33,29,24,.18);transition:top .35s cubic-bezier(.34,1.2,.64,1);}\n#rm-container .notify-banner.show{top:16px;}\n#rm-container .notify-banner-icon{font-size:19px;flex-shrink:0;}\n#rm-container .notify-banner-txt{flex:1;min-width:0;}\n/* \u2500\u2500 PHOTO PICKER \u2500\u2500 */\n#rm-container .photo-pick{display:flex;align-items:center;gap:12px;background:var(--card2);\n  border:1px solid var(--border);border-radius:6px;padding:12px;cursor:pointer;}\n#rm-container .photo-thumb{width:44px;height:44px;border-radius:4px;object-fit:cover;flex-shrink:0;}\n#rm-container .photo-placeholder{width:44px;height:44px;border-radius:4px;background:var(--card3);\n  display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}\n#rm-container .photo-clear{background:rgba(162,60,46,.06);border:1px solid rgba(162,60,46,.2);\n  border-radius:4px;padding:5px 9px;color:var(--red);font-size:11px;cursor:pointer;margin-left:auto;}\n/* \u2500\u2500 ALARM RING SCREEN \u2500\u2500 */\n#rm-container .ring{position:fixed;inset:0;z-index:500;background:var(--ink);display:flex;flex-direction:column;\n  align-items:center;justify-content:center;padding:40px 24px;left:50%;transform:translateX(-50%);\n  max-width:480px;width:100%;}\n#rm-container .ring-time{font-family:'JetBrains Mono',monospace;font-size:50px;font-weight:700;letter-spacing:-1px;color:#fbf6ec;position:relative;z-index:2;}\n#rm-container .ring-label{font-size:14px;color:rgba(251,246,236,.6);font-weight:600;margin-top:6px;margin-bottom:32px;position:relative;z-index:2;letter-spacing:.3px;}\n#rm-container .ring-photo-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}\n#rm-container .ring-photo-overlay{position:absolute;inset:0;z-index:1;\n  background:linear-gradient(180deg,rgba(33,29,24,.35) 0%,rgba(33,29,24,.55) 45%,rgba(33,29,24,.92) 100%);}\n#rm-container .ring-fallback{font-size:64px;opacity:.3;margin-bottom:8px;position:relative;z-index:2;}\n#rm-container .ring-actions{position:absolute;bottom:50px;width:calc(100% - 48px);display:flex;flex-direction:column;gap:10px;z-index:2;}\n#rm-container .ring-snooze{background:rgba(251,246,236,.08);border:1px solid rgba(251,246,236,.18);border-radius:8px;padding:16px;\n  color:#fbf6ec;font-weight:600;font-size:15px;cursor:pointer;transition:opacity .15s;}\n#rm-container .ring-dismiss{background:#2f6bf0;border:none;border-radius:8px;\n  padding:16px;color:#fff;font-weight:700;font-size:15px;cursor:pointer;}\n/* \u2500\u2500 TOAST \u2500\u2500 */\n#rm-container .toast{position:fixed;bottom:130px;left:50%;transform:translateX(-50%);\n  background:var(--ink);border:1px solid rgba(251,246,236,.15);color:#fbf6ec;\n  padding:10px 18px;border-radius:6px;\n  font-size:12px;font-weight:600;letter-spacing:.3px;z-index:600;\n  box-shadow:0 6px 24px rgba(33,29,24,.3);\n  animation:toastfade 2.4s ease forwards;pointer-events:none;}\n@keyframes toastfade{0%{opacity:0;transform:translate(-50%,10px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}\n/* \u2500\u2500 DIARY \u2014 same paper as the rest of the app, no separate light theme needed \u2500\u2500 */\n#rm-container .diary-light{background:var(--card);color:var(--ink);}\n#rm-container .dw{display:flex;flex-direction:column;min-height:100vh;}\n#rm-container .dw-bar{display:flex;align-items:center;gap:8px;padding:12px 14px;position:sticky;top:0;z-index:10;}\n#rm-container .dw-back{flex-shrink:0;border:1px solid;border-radius:5px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;background:none;white-space:nowrap;}\n#rm-container .dw-title{flex:1;min-width:0;border:1px solid transparent;border-radius:5px;padding:8px 10px;\n  font-family:'Fraunces','Source Serif 4',Georgia,serif;font-size:18px;background:transparent;}\n#rm-container .dw-save{flex-shrink:0;border:none;border-radius:5px;padding:9px 16px;font-size:12.5px;font-weight:700;letter-spacing:.4px;cursor:pointer;white-space:nowrap;}\n#rm-container .dw-meta{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid;}\n#rm-container .dw-date{font-size:11.5px;font-weight:600;font-family:'JetBrains Mono',monospace;}\n#rm-container .dw-body{flex:1;width:100%;border:none;padding:16px;font-size:15px;line-height:25px;background:transparent;resize:none;min-height:160px;font-family:'Caveat','Segoe Script','Bradley Hand',cursive;}\n#rm-container .dw-foot{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid;}\n#rm-container .fmt-btn{flex-shrink:0;width:34px;height:34px;border-radius:5px;border:1px solid;font-size:13px;font-weight:700;cursor:pointer;background:none;}\n#rm-container .wc{margin-left:auto;font-size:10.5px;font-weight:500;white-space:nowrap;font-family:'JetBrains Mono',monospace;}\n#rm-container .diary-add-bar{background:var(--green)!important;box-shadow:0 3px 12px rgba(76,107,74,.22)!important;}\n#rm-container .diary-empty-text{color:var(--muted);}\n#rm-container .diary-card{background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow-card);}\n#rm-container .diary-card::before{background:var(--green);}\n#rm-container .diary-dots-btn{background:var(--card2);border:1px solid var(--border);border-radius:5px;width:30px;height:30px;\n  color:var(--sub);font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}\n#rm-container .diary-dots-btn.dark{background:var(--card2);border-color:var(--border);color:var(--sub);}\n#rm-container .diary-card-menu{position:absolute;top:36px;right:16px;background:var(--card);border:1px solid var(--border);\n  border-radius:8px;box-shadow:0 8px 28px rgba(33,29,24,.16);z-index:20;overflow:hidden;min-width:190px;}\n#rm-container .diary-card-menu.dark-menu{background:var(--card);border-color:var(--border);box-shadow:0 8px 28px rgba(33,29,24,.16);}\n#rm-container .diary-menu-item{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:none;\n  padding:12px 14px;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;border-bottom:1px solid var(--border2);}\n#rm-container .diary-card-menu.dark-menu .diary-menu-item{color:var(--text);border-bottom-color:var(--border2);}\n#rm-container .diary-menu-item:last-child{border-bottom:none;}\n#rm-container .diary-menu-item.danger{color:var(--red);}\n#rm-container .diary-bar{background:rgba(251,248,240,.95);border-bottom:1px solid var(--border);}\n#rm-container .diary-back{background:var(--card2);border-color:var(--border);color:var(--sub);}\n#rm-container .diary-title-input{color:var(--ink);}\n#rm-container .diary-title-input::placeholder{color:var(--muted);}\n#rm-container .diary-save{background:var(--green);color:#fff;}\n#rm-container .diary-meta{border-bottom-color:var(--border);}\n#rm-container .diary-date{color:var(--muted);}\n#rm-container .diary-mood-btn{border-color:var(--border);}\n#rm-container .diary-mood-btn.sel{border-color:var(--green);background:rgba(76,107,74,.1);}\n#rm-container .diary-body-input{color:var(--ink);}\n#rm-container .diary-body-input::placeholder{color:var(--muted);}\n#rm-container .diary-foot{background:rgba(251,248,240,.95);border-top-color:var(--border);}\n#rm-container .diary-fmt-btn{background:var(--card2);border-color:var(--border);color:var(--sub);}\n#rm-container .diary-fmt-btn.active{border-color:var(--green);background:rgba(76,107,74,.12);color:var(--green);}\n#rm-container .diary-wc{color:var(--muted);}\n#rm-container .diary-photo-strip{display:flex;gap:8px;padding:12px 18px;flex-wrap:wrap;border-bottom:1px solid var(--border);}\n#rm-container .diary-photo-thumb-wrap{position:relative;}\n#rm-container .diary-photo-thumb{width:64px;height:64px;border-radius:5px;object-fit:cover;display:block;}\n#rm-container .diary-photo-remove{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;\n  background:var(--red);border:none;color:#fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}\n#rm-container .diary-voice-row{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid var(--border);}\n#rm-container .mood-row{display:flex;gap:6px;}\n#rm-container .mood-btn{background:none;border:1px solid;border-radius:5px;padding:7px;font-size:16px;cursor:pointer;transition:all .15s;}\n/* \u2500\u2500 STATS PILL (header) \u2500\u2500 */\n#rm-container .stat-pill{display:inline-flex;align-items:center;gap:5px;\n  background:rgba(47,107,240,.05);border:1px solid rgba(47,107,240,.2);\n  border-radius:3px;padding:4px 11px;font-size:9.5px;font-weight:700;\n  color:var(--seal);letter-spacing:.5px;margin-top:10px;font-family:'JetBrains Mono',monospace;}\n#rm-container .stat-dot{width:5px;height:5px;border-radius:50%;background:var(--seal);}\n/* \u2500\u2500 WAX SEAL TIME STAMP \u2014 signature element, sits on each reminder/alarm card \u2500\u2500 */\n#rm-container .seal-stamp{\n  width:46px;height:46px;border-radius:50%;flex-shrink:0;\n  background:radial-gradient(circle at 32% 28%, #b8603d 0%, #2f6bf0 55%, #1d55d6 100%);\n  display:flex;flex-direction:column;align-items:center;justify-content:center;\n  box-shadow:0 2px 6px rgba(124,58,34,.35),inset 0 -2px 4px rgba(0,0,0,.2),inset 0 2px 3px rgba(255,255,255,.15);\n  position:relative;\n}\n#rm-container .seal-stamp::before{\n  content:'';position:absolute;inset:3px;border-radius:50%;\n  border:1px dashed rgba(255,255,255,.35);\n}\n#rm-container .seal-stamp-time{font-family:'JetBrains Mono',monospace;color:#fbf0e6;font-size:12px;font-weight:700;line-height:1;letter-spacing:-.3px;}\n#rm-container .seal-stamp-ampm{font-family:'JetBrains Mono',monospace;color:rgba(251,240,230,.7);font-size:7px;font-weight:700;letter-spacing:.5px;margin-top:1px;}\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 BLUE \"NOTIFY\" REDESIGN (compact) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n#rm-container{background:\n  radial-gradient(120% 50% at 92% 4%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 60%),\n  linear-gradient(180deg,#e2efff 0%,#f2f8ff 38%,#fbfdff 100%);}\n#rm-container .screen-notify{position:relative;overflow-x:hidden;}\n#rm-container .screen-notify>*:not(.ov){position:relative;z-index:1;}\n#rm-container .screen-notify::before{content:'';position:absolute;right:0;top:150px;width:64px;height:92px;z-index:0;pointer-events:none;\n  background:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 170'><path d='M118 170 C100 120 96 70 108 8' fill='none' stroke='%2378b6f2' stroke-width='2.5' stroke-linecap='round'/><g fill='%2391c4f6'><ellipse cx='96' cy='30' rx='9' ry='20' transform='rotate(-25 96 30)'/><ellipse cx='108' cy='58' rx='10' ry='22' transform='rotate(25 108 58)'/><ellipse cx='90' cy='78' rx='9' ry='20' transform='rotate(-35 90 78)'/><ellipse cx='106' cy='100' rx='10' ry='22' transform='rotate(30 106 100)'/><ellipse cx='88' cy='122' rx='9' ry='19' transform='rotate(-40 88 122)'/></g></svg>\") no-repeat right top/contain;opacity:.75;}\n#rm-container .app-status-bar{padding:14px 18px 0;}\n#rm-container .app-brand-dot{width:8px;height:8px;background:linear-gradient(135deg,#38b6ff,#2f6bf0);}\n#rm-container .app-brand-name{font-size:15px;font-weight:700;color:#14235a;}\n#rm-container .app-version{color:#6db3f2;font-size:11px;font-weight:600;font-family:inherit;letter-spacing:.5px;}\n#rm-container .hdr-notify{padding:10px 18px 4px;}\n#rm-container .hdr-notify .hdr-eye{color:#2f6bf0;font-size:10px;letter-spacing:3px;font-family:inherit;font-weight:700;margin-bottom:0;}\n#rm-container .hdr-notify .hdr-eye::before{background:#2f6bf0;width:14px;height:2px;}\n#rm-container .hdr-notify-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:nowrap;}\n#rm-container .hdr-notify-title{font-family:'Poppins','Nunito','Inter',system-ui,sans-serif;font-size:clamp(30px,9.5vw,38px);font-weight:800;\n  letter-spacing:-1px;line-height:1.2;padding-right:4px;flex:0 0 auto;\n  background:linear-gradient(90deg,#e6197d 0%,#f7803c 28%,#f5a623 44%,#4c6ef5 72%,#8b4dea 100%);\n  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;}\n#rm-container .hdr-tagline{display:flex;flex-direction:column;align-items:flex-end;min-width:0;\n  font-family:'Poppins','Nunito','Inter',system-ui,sans-serif;font-weight:800;font-size:clamp(10.5px,3.3vw,13px);line-height:1.3;text-align:right;}\n#rm-container .hdr-tagline .tg1{background:linear-gradient(90deg,#14a3b8,#f0508c);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;}\n#rm-container .hdr-tagline .tg2{background:linear-gradient(90deg,#f7803c,#8b4dea);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;}\n#rm-container .hdr-notify .hdr-sub{font-size:13px;color:#6b7a99;margin-top:2px;font-weight:500;}\n#rm-container .stat-pill{background:rgba(255,255,255,.85);border:1.5px solid #bcd8f7;border-radius:999px;padding:6px 14px;\n  font-size:12px;font-weight:700;color:#2f6bf0;font-family:inherit;letter-spacing:0;margin-top:10px;gap:7px;}\n#rm-container .stat-dot{width:7px;height:7px;background:#2f6bf0;}\n#rm-container .add-bar-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:auto;max-width:220px;\n  margin:10px 18px 6px;padding:12px 22px;border-radius:14px;font-size:14px;font-weight:700;letter-spacing:.2px;color:#fff;\n  background:linear-gradient(90deg,#2f6bf0,#8b4dea);box-shadow:0 6px 16px rgba(80,90,240,.30);}\n#rm-container .add-bar-icon{font-size:17px;font-weight:600;}\n#rm-container .sec-lbl{font-size:11px;letter-spacing:3px;font-family:inherit;margin:16px 0 10px;color:#2f6bf0;}\n#rm-container .sec-lbl::after{background:linear-gradient(90deg,#9cc8f5,rgba(156,200,245,.15));}\n#rm-container .card{border-radius:16px;border:1px solid #d9e8fb;background:#fff;padding:14px 14px 12px 18px;margin-bottom:12px;\n  box-shadow:0 4px 16px rgba(59,110,200,.09);}\n#rm-container .card::before{width:4px;}\n#rm-container .card-cyan::before{background:linear-gradient(180deg,#38b6ff,#2f6bf0);}\n#rm-container .seal-stamp{width:54px;height:54px;\n  background:radial-gradient(circle at 30% 25%,#ffb84d 0%,#ff6b6b 55%,#e83e8c 100%);\n  box-shadow:0 4px 12px rgba(240,90,110,.32),inset 0 2px 4px rgba(255,255,255,.35);}\n#rm-container .seal-stamp::before{inset:3px;border:1.5px dashed rgba(255,255,255,.45);}\n#rm-container .seal-stamp-time{font-family:inherit;font-size:15px;color:#fff;font-weight:800;letter-spacing:-.3px;}\n#rm-container .seal-stamp-ampm{font-family:inherit;font-size:10px;color:rgba(255,255,255,.92);font-weight:700;margin-top:1px;}\n#rm-container .tog{width:40px;height:23px;border-radius:12px;border:none;}\n#rm-container .tog-knob{width:17px;height:17px;top:3px;border-radius:50%;box-shadow:0 2px 4px rgba(20,40,100,.25);}\n#rm-container .edit-btn,#rm-container .del-btn{background:#f3f8ff;border:1.5px solid #cfe2f8;border-radius:10px;padding:6px 11px;\n  color:#2f6bf0;font-size:12px;font-weight:600;font-family:inherit;letter-spacing:0;}\n#rm-container .del-btn{font-size:13px;padding:6px 10px;}\n#rm-container .badge{border-radius:999px;padding:3px 10px;font-size:10.5px;font-weight:700;letter-spacing:.5px;font-family:inherit;}\n#rm-container .ctd{border-radius:999px;font-family:inherit;padding:2px 8px;font-size:9.5px;}\n#rm-container .save-btn{background:linear-gradient(90deg,#2f6bf0,#8b4dea);border-radius:14px;box-shadow:0 6px 16px rgba(80,90,240,.28);}\n";

// ── Router ─────────────────────────────────────────────────────────────────
function GameHubApp({onNavHiddenChange}){
  useEffect(()=>{
    if(document.getElementById("gh-fun-font"))return;
    const link=document.createElement("link");
    link.id="gh-fun-font";
    link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  },[]);
  const [screen,setScreen]=useState("hub");
  const [highScores,setHighScores]=useState(()=>{
    try{const s=localStorage.getItem("gh_highs");return s?JSON.parse(s):{braindash:0};}
    catch(e){return{braindash:0};}
  });
  const [stats,setStats]=useState(loadStats);
  const [online,setOnline]=useState(typeof navigator!=="undefined"?navigator.onLine:true);
  const [soundOn,setSoundOn]=useState(()=>{try{return localStorage.getItem("gh_sound")!=="off";}catch(e){return true;}});

  // Tell the shared shell whether to hide the bottom nav. GameHub's game
  // screens (BrainDash, MemoryGrid) are drill-down full-screen views, same
  // as the original standalone app — only the top-level hub shows the nav.
  useEffect(()=>{
    onNavHiddenChange(screen!=="hub");
  },[screen]);

  function toggleSound(){
    setSoundOn(p=>{
      const next=!p;
      try{localStorage.setItem("gh_sound",next?"on":"off");}catch(e){}
      return next;
    });
  }

  function playSound(key){if(soundOn&&SFX[key])SFX[key]();}

  const updateHigh=(k,v)=>setHighScores(p=>{
    const next={...p,[k]:Math.max(p[k]||0,v)};
    try{localStorage.setItem("gh_highs",JSON.stringify(next));}catch(e){}
    return next;
  });

  function updateStats(patch){
    setStats(p=>{const next={...p,...patch};saveStats(next);return next;});
  }

  useEffect(()=>{
    const goOnline=()=>setOnline(true), goOffline=()=>setOnline(false);
    window.addEventListener("online",goOnline);
    window.addEventListener("offline",goOffline);
    return()=>{window.removeEventListener("online",goOnline);window.removeEventListener("offline",goOffline);};
  },[]);

  function navTo(s){
    setScreen(s);
  }

  if(screen==="memorygrid") return <MemoryGridScreen onBack={()=>setScreen("hub")} playSound={playSound} onLevelClear={(lvl)=>{
    updateStats({mgLevelsCleared:Math.max(stats.mgLevelsCleared||0,lvl)});
  }}/>;
  if(screen==="braindash"){
    return <BrainDashScreen onBack={()=>setScreen("hub")} highScore={highScores.braindash}
      onNewHigh={(v)=>updateHigh("braindash",v)} playSound={playSound}
      onStatsUpdate={updateStats} stats={stats}/>;
  }
  if(screen==="stats") return <StatsScreen onBack={()=>setScreen("hub")} stats={stats} highScores={highScores}/>;
  if(screen==="piano") return <PianoScreen onBack={()=>setScreen("hub")}/>;
  if(screen==="ruler") return <RulerPuzzleScreen onBack={()=>setScreen("hub")}/>;
  return <HubScreen onNav={navTo} online={online} soundOn={soundOn} toggleSound={toggleSound}/>;
}

// ════════════════════════════════════════════════════════════════════════════
// ── COMBINED APP SHELL ───────────────────────────────────────────────────────
// Owns the 4-tab bottom nav (GameHub, Notify, Alarm, Diary). GameHub renders
// as native React (GameHubApp above). Reminder Hub renders via its own
// self-contained vanilla-JS engine, injected once and mounted into a plain
// div — see RemindMeContainer below. Both report back when they're in a
// "drill-down" view (a game in progress, the diary writer, an alarm ringing)
// so the shared nav can hide, matching each app's original behavior.
// ════════════════════════════════════════════════════════════════════════════

const MEMORYHUB_PIANO_HTML=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Alphabet Piano</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #362f78;
    --ink-soft: #5a4fb0;
    --grad1: #6a5ff0;
    --grad2: #c07be0;
    --glass: rgba(255,255,255,0.42);
    --glass-strong: rgba(255,255,255,0.62);
    --glass-line: rgba(255,255,255,0.55);
    --key-text: #362f78;
    --muted: #7a70b8;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    height: 100%;
    background:
      radial-gradient(60% 40% at 80% 15%, rgba(255,255,255,0.35), transparent 60%),
      radial-gradient(70% 50% at 10% 90%, rgba(255,180,230,0.35), transparent 60%),
      linear-gradient(150deg, #7b6ff2 0%, #a97bf0 45%, #e08fd8 100%);
    color: var(--ink);
    font-family: 'Manrope', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* decorative sparkles + music notes, purely atmospheric */
  .deco {
    position: fixed;
    color: rgba(255,255,255,0.55);
    pointer-events: none;
    z-index: 0;
    user-select: none;
  }
  .deco.note { font-size: 20px; }
  .deco.spark { font-size: 14px; }
  .d1 { top: 6%; left: 6%; font-size: 24px; }
  .d2 { top: 14%; left: 20%; }
  .d3 { top: 8%; right: 10%; }
  .d4 { bottom: 10%; left: 8%; }
  .d5 { bottom: 22%; right: 6%; }
  .d6 { top: 46%; right: 4%; opacity: 0.4; }

  .stage {
    position: relative;
    z-index: 1;
    height: 100dvh;
    max-width: 720px;
    margin: 0 auto;
    padding: 2.2vh 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.3vh;
  }

  /* --- header: script-serif title --- */
  .titleWrap { text-align: center; }
  .titleWrap .line1 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: clamp(26px, 7.5vw, 36px);
    color: var(--ink);
    line-height: 1;
    display: block;
  }
  .titleWrap .line2 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-style: italic;
    font-size: clamp(30px, 8.5vw, 42px);
    background: linear-gradient(90deg, var(--grad1), var(--grad2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    line-height: 1;
    display: block;
    margin-top: -2px;
  }
  .tagline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
    font-weight: 700;
  }
  .tagline::before, .tagline::after {
    content: '';
    width: 20px;
    height: 1px;
    background: var(--ink-soft);
    opacity: 0.4;
  }

  #status {
    font-size: 11px;
    color: var(--ink-soft);
    min-height: 14px;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  /* --- glass panel shared look --- */
  .glassPanel {
    width: 100%;
    max-width: 520px;
    background: var(--glass);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    border: 1px solid var(--glass-line);
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(90,60,160,0.18);
  }

  /* text box, pill shaped like the reference */
  .textboxRow {
    padding: 8px 10px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .textboxIcon { font-size: 16px; opacity: 0.6; flex: none; margin-top: 8px; }
  #textInput {
    flex: 1;
    min-height: 70px;
    max-height: 70px;
    resize: none;
    background: transparent;
    border: none;
    padding: 6px 4px;
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    color: var(--ink);
    outline: none;
    line-height: 1.4;
  }
  #textInput::placeholder { color: rgba(54,47,120,0.4); }
  #clearBtn {
    flex: none;
    width: 26px; height: 26px;
    border-radius: 50%;
    margin-top: 6px;
    border: none;
    background: rgba(255,255,255,0.6);
    color: var(--ink-soft);
    font-size: 13px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }

  /* controls panel */
  .controlsPanel {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .iconBtn {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    border: none;
    cursor: pointer;
    transition: transform 0.12s ease, filter 0.12s ease;
  }
  .iconBtn:active { transform: scale(0.9); }
  .iconBtn:disabled { opacity: 0.4; cursor: default; }
  #playTextBtn {
    background: linear-gradient(135deg, var(--grad1), var(--grad2));
    color: #fff;
    box-shadow: 0 4px 14px rgba(122,90,230,0.45);
  }
  #stopTextBtn {
    background: rgba(255,255,255,0.55);
    color: var(--ink-soft);
  }
  .tempoBlock { flex: 1; text-align: center; }
  .tempoLabel {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
    font-weight: 700;
    margin-bottom: 4px;
  }
  .tempoGroup {
    display: flex;
    background: rgba(255,255,255,0.4);
    border-radius: 999px;
    padding: 3px;
    gap: 3px;
  }
  .tempoBtn {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    font-size: 12px;
    padding: 6px 4px;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .tempoBtn.active {
    background: linear-gradient(135deg, var(--grad1), var(--grad2));
    color: #fff;
    box-shadow: 0 3px 10px rgba(122,90,230,0.4);
  }

  /* --- keyboard: glass keys, fixed 6-per-row --- */
  .keyboard {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    width: 100%;
    max-width: 520px;
    padding: 4px 0;
  }
  .key {
    position: relative;
    width: 100%;
    height: 46px;
    border: none;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 19px;
    color: var(--key-text);
    background: var(--glass-strong);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.7);
    -webkit-tap-highlight-color: transparent;
    transform: translateY(0) scale(1);
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
    box-shadow: 0 4px 10px rgba(90,60,160,0.16);
  }
  .key.active {
    transform: translateY(1px) scale(0.95);
    background: linear-gradient(135deg, var(--grad1), var(--grad2));
    color: #fff;
    box-shadow: 0 2px 8px rgba(122,90,230,0.5);
  }
  /* Y and Z centered on their own row */
  .keyboard > .key:nth-child(25) { grid-column: 3; }
  .keyboard > .key:nth-child(26) { grid-column: 4; }

  /* bottom row: comma, spacebar, period */
  .bottomRow {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }
  .key.punct {
    width: 44px;
    height: 40px;
    flex: none;
    border-radius: 50%;
    font-size: 18px;
    background: rgba(255,255,255,0.55);
  }
  .key.punct.active {
    background: linear-gradient(135deg, var(--grad2), var(--grad1));
    color: #fff;
  }
  .key.space {
    flex: 1;
    height: 44px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--grad1), var(--grad2));
    color: #fff;
    font-size: 12px;
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    box-shadow: 0 4px 14px rgba(122,90,230,0.4);
    border: none;
  }
  .key.space.active {
    transform: translateY(1px) scale(0.98);
    box-shadow: 0 2px 8px rgba(122,90,230,0.55);
  }

  @media (prefers-reduced-motion: reduce) {
    .key { transition: none; }
  }

  @media (max-height: 700px) {
    .key { height: 38px; font-size: 16px; }
    .key.punct { height: 32px; width: 38px; }
    .key.space { height: 32px; }
    .titleWrap .line1 { font-size: 22px; }
    .titleWrap .line2 { font-size: 26px; }
    #textInput { min-height: 50px; max-height: 50px; }
  }
</style>
</head>
<body>
  <div class="deco d1 note">♪</div>
  <div class="deco d2 spark">✦</div>
  <div class="deco d3 note">♫</div>
  <div class="deco d4 note">♪</div>
  <div class="deco d5 spark">✦</div>
  <div class="deco d6 note" style="font-size:28px;">♩</div>

  <div class="stage">
    <div class="titleWrap">
      <span class="line1">Alphabet</span>
      <span class="line2">Piano</span>
      <div class="tagline">Turn text into melody</div>
    </div>
    <div id="status">Tap a key to begin</div>

    <div class="glassPanel textboxRow">
      <span class="textboxIcon">⌨</span>
      <textarea id="textInput" placeholder="Type or tap keys..." rows="1"></textarea>
      <button id="clearBtn" type="button" aria-label="Clear text">✕</button>
    </div>

    <div class="glassPanel controlsPanel">
      <button id="playTextBtn" class="iconBtn">▶</button>
      <button id="stopTextBtn" class="iconBtn" disabled>■</button>
      <div class="tempoBlock">
        <div class="tempoLabel">Tempo</div>
        <div class="tempoGroup">
          <button class="tempoBtn" data-gap="320">Slow</button>
          <button class="tempoBtn active" data-gap="200">Normal</button>
          <button class="tempoBtn" data-gap="110">Fast</button>
        </div>
      </div>
    </div>

    <div class="keyboard" id="keyboard"></div>
  </div>

<script>
  const LETTERS = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i));
  const PATTERN = [
    ['C', 0], ['D', 2], ['E', 4], ['G', 7], ['A', 9]
  ]; // semitone offsets from C within an octave, pentatonic
  const BASE_OCTAVE = 3; // A = C3

  function noteFreq(letter) {
    const idx = LETTERS.indexOf(letter);
    let octaveOffset, patternIdx;
    if (idx === 25) {
      octaveOffset = 5; // final extra note
      patternIdx = 0;
    } else {
      octaveOffset = Math.floor(idx / 5);
      patternIdx = idx % 5;
    }
    const [name, semitone] = PATTERN[patternIdx];
    const midiC = 12 * (BASE_OCTAVE + octaveOffset + 1);
    const midi = midiC + semitone;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    return { freq, label: name + (BASE_OCTAVE + octaveOffset) };
  }

  const NOTES = {};
  LETTERS.forEach(l => { NOTES[l] = noteFreq(l); });

  // Rotate three notes as requested: whoever had C3 (A) now plays E6;
  // whoever had E6 (R) now plays D6; whoever had D6 (Q) now plays C3.
  {
    const oldA = NOTES['A']; // C3
    const oldQ = NOTES['Q']; // D6
    const oldR = NOTES['R']; // E6
    NOTES['A'] = oldR; // C3 -> E6
    NOTES['R'] = oldQ; // E6 -> D6
    NOTES['Q'] = oldA; // D6 -> C3
  }

  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq) {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const dur = 0.9;

    // small speakers reproduce bass weakly, so boost gain for lower notes
    const bassBoost = 1 + Math.max(0, (420 - freq) / 420) * 1.4;
    const peak = Math.min(0.75, 0.4 * bassBoost);

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    const harmonics = [
      { mult: 1, gain: 1.0, type: 'sine' },
      { mult: 2, gain: 0.5, type: 'sine' },
      { mult: 3, gain: 0.22, type: 'sine' },
      { mult: 4, gain: 0.1, type: 'sine' },
    ];
    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      osc.type = h.type;
      osc.frequency.value = freq * h.mult;
      const g = ctx.createGain();
      g.gain.value = h.gain;
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  }

  // Warm Hum — the sound for the space between words: a low round hum
  // (G2) with a soft high overtone (D5), gentle fade in and out.
  function playWarmHum() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    [[196, 0.16, 1.1], [587.33, 0.05, 1.1]].forEach(([freq, peak, dur]) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
      g.connect(ctx.destination);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      o.start(now);
      o.stop(now + dur);
    });
  }

  // Comma — Rain Tap: a single soft filtered water droplet (picked as option #12).
  function playComma() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const dur = 0.06;
    const bufSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.3, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, now);
    g2.gain.exponentialRampToValueAtTime(0.12, now + 0.006);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    g2.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 1200;
    o.connect(g2);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  // Period — Soft Whoosh: airy filtered noise sweep (picked as option #9).
  function playPeriod() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const dur = 0.28;
    const bufSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(2200, now);
    filt.frequency.exponentialRampToValueAtTime(400, now + dur * 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  const keyboard = document.getElementById('keyboard');
  const status = document.getElementById('status');
  const keyEls = {};

  LETTERS.forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.style.animationDelay = \`\${i * 18}ms\`;
    btn.innerHTML = \`<span class="letter">\${letter}</span>\`;
    btn.addEventListener('pointerdown', () => pressLetter(letter));
    keyboard.appendChild(btn);
    keyEls[letter] = btn;
  });

  // bottom row — comma, spacebar, period
  const bottomRow = document.createElement('div');
  bottomRow.className = 'bottomRow';

  const commaBtn = document.createElement('button');
  commaBtn.className = 'key punct';
  commaBtn.innerHTML = \`<span class="letter">,</span>\`;
  commaBtn.addEventListener('pointerdown', () => pressComma());

  const spaceBtn = document.createElement('button');
  spaceBtn.className = 'key space';
  spaceBtn.innerHTML = \`<span class="letter">␣ space</span>\`;
  spaceBtn.addEventListener('pointerdown', () => pressSpace());

  const periodBtn = document.createElement('button');
  periodBtn.className = 'key punct';
  periodBtn.innerHTML = \`<span class="letter">.</span>\`;
  periodBtn.addEventListener('pointerdown', () => pressPeriod());

  bottomRow.appendChild(commaBtn);
  bottomRow.appendChild(spaceBtn);
  bottomRow.appendChild(periodBtn);
  keyboard.appendChild(bottomRow);

  // --- sound-only helpers: used during auto-playback, never touch the textbox ---
  function soundLetter(letter) {
    playTone(NOTES[letter].freq);
    const el = keyEls[letter];
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 180);
    status.textContent = \`\${letter} · \${NOTES[letter].label}\`;
  }

  function soundSpace() {
    playWarmHum();
    spaceBtn.classList.add('active');
    setTimeout(() => spaceBtn.classList.remove('active'), 320);
    status.textContent = '␣ space';
  }

  function soundComma() {
    playComma();
    commaBtn.classList.add('active');
    setTimeout(() => commaBtn.classList.remove('active'), 160);
    status.textContent = ', comma';
  }

  function soundPeriod() {
    playPeriod();
    periodBtn.classList.add('active');
    setTimeout(() => periodBtn.classList.remove('active'), 220);
    status.textContent = '. period';
  }

  // --- manual-entry helpers: used only by actual key taps, also type into the box ---
  function pressLetter(letter) {
    soundLetter(letter);
    if (textInput) textInput.value += letter;
  }

  function pressSpace() {
    soundSpace();
    if (textInput) textInput.value += ' ';
  }

  function pressComma() {
    soundComma();
    if (textInput) textInput.value += ',';
  }

  function pressPeriod() {
    soundPeriod();
    if (textInput) textInput.value += '.';
  }

  const textInput = document.getElementById('textInput');
  const playTextBtn = document.getElementById('playTextBtn');
  const stopTextBtn = document.getElementById('stopTextBtn');
  const tempoBtns = document.querySelectorAll('.tempoBtn');
  let noteGapValue = 200;

  tempoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tempoBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      noteGapValue = Number(btn.dataset.gap);
    });
  });

  let stopRequested = false;

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function playText() {
    const raw = textInput.value;
    if (!raw.trim()) return;

    stopRequested = false;
    playTextBtn.disabled = true;
    stopTextBtn.disabled = false;

    const noteGap = noteGapValue; // ms between letters
    let played = 0;

    for (const ch of raw) {
      if (stopRequested) break;
      const upper = ch.toUpperCase();
      if (NOTES[upper]) {
        soundLetter(upper);
        played++;
        await delay(noteGap);
      } else if (ch === '.') {
        soundPeriod();
        await delay(noteGap * 2.2); // longer breath at a period
      } else if (/[!?]/.test(ch)) {
        status.textContent = '…';
        await delay(noteGap * 2.2); // longer breath at sentence end
      } else if (ch === ',') {
        soundComma();
        await delay(noteGap * 1.4); // small breath at a comma
      } else if (/[;:]/.test(ch)) {
        await delay(noteGap * 1.4); // small breath
      } else if (/\\s/.test(ch)) {
        soundSpace(); // Warm Hum plays for the space between words
        await delay(noteGap * 1.1);
      }
      // other symbols (numbers, punctuation) are simply skipped
    }

    playTextBtn.disabled = false;
    stopTextBtn.disabled = true;
    if (!stopRequested) {
      status.textContent = played ? \`Played \${played} notes\` : 'No letters found to play';
    } else {
      status.textContent = 'Stopped';
    }
  }

  function stopText() {
    stopRequested = true;
  }

  playTextBtn.addEventListener('click', playText);
  stopTextBtn.addEventListener('click', stopText);

  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    status.textContent = 'Cleared';
  });
</script>
</body>
</html>
`;

function RulerPuzzleScreen({onBack}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column",backgroundColor:"#fff"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 16px",backgroundColor:"#f8e6ef",flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(0,0,0,0.08)",
          border:"none",borderRadius:R.md,color:"#7a1f4a",fontSize:13,fontWeight:700,
          padding:"7px 14px",cursor:"pointer"}}>← GameHub</button>
        <span style={{color:"#7a1f4a",fontWeight:700,fontFamily:FONT_DISPLAY,fontSize:15}}>Ruler Puzzle</span>
        <span style={{width:80}}/>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        <RulerSlidePuzzle/>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- *
 *  RULER SLIDE PUZZLE — in-browser recreation of the 2x7 ruler toy.
 *
 *  Mechanism (from the toy): a 2-row x 7-column strip of picture tiles
 *  trapped in a channel, 13 tiles + 1 empty slot. A tile only slides
 *  orthogonally into the single empty slot — sideways along its row, or
 *  up/down into the other row of the same column. The round dial is a
 *  physical lock: twist it to shuffle + start.
 * ---------------------------------------------------------------------- */

const MAX_LEVEL = 6;
const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

// Levels 1-6 widen the board: 2x2 up to 2x7 (matches the ruler toy's own
// 2x7 layout at level 6). From level 7 onward it flips to a narrow, tall
// strip — columns fixed at 2, rows equal to the level number — since a
// phone screen runs out of horizontal room long before it runs out of
// vertical scroll room.
function gridForLevel(level) {
  if (level <= 6) return { rows: 2, cols: level + 1 };
  // Level 7 = 7x2, level 8 = 8x2, ... level 10 = 10x2.
  return { rows: level, cols: 2 };
}

// Levels 1-6 number left-to-right along each row (row-major). Levels 7-10
// instead number straight down column 1 first, then column 2 (column-major)
// — picked by the player from the pattern reference image.
function patternForLevel(level) {
  return level <= 6 ? "row-major" : "col-major";
}

// Fallback theme (used only if a level somehow has no themed set assigned).
const DEFAULT_TILE_ART = [
  { glyph: "👾", from: "#FF6FB8", to: "#B0176A" },
  { glyph: "🛸", from: "#F21F8C", to: "#8C0E58" },
  { glyph: "👽", from: "#FF8AD2", to: "#C81E7A" },
  { glyph: "🦖", from: "#F21F8C", to: "#B0176A" },
  { glyph: "🐙", from: "#FF6FB8", to: "#8C0E58" },
];

// Level 1 — Cats
const CAT_TILE_ART = [
  { glyph: "😺", from: "#FFC94A", to: "#F21F8C" },
  { glyph: "😸", from: "#FF8AD2", to: "#B0176A" },
  { glyph: "😹", from: "#FFC94A", to: "#C81E7A" },
  { glyph: "😻", from: "#FF6FB8", to: "#F21F8C" },
  { glyph: "😼", from: "#FFC94A", to: "#8C0E58" },
  { glyph: "🐱", from: "#FF8AD2", to: "#F21F8C" },
];

// Level 2 — Hands / gestures
const HANDS_TILE_ART = [
  { glyph: "🫵", from: "#8AB4FF", to: "#4A3CC9" },
  { glyph: "👉", from: "#B98AFF", to: "#5E2FB0" },
  { glyph: "👈", from: "#8AB4FF", to: "#6A3CC9" },
  { glyph: "☝️", from: "#8AF0FF", to: "#4A3CC9" },
  { glyph: "✌️", from: "#B98AFF", to: "#4A3CC9" },
  { glyph: "🤞", from: "#8AB4FF", to: "#5E2FB0" },
  { glyph: "🤙", from: "#8AF0FF", to: "#5E2FB0" },
  { glyph: "👍", from: "#B98AFF", to: "#6A3CC9" },
];

// Level 3 — Birds
const BIRD_TILE_ART = [
  { glyph: "🐦", from: "#7FD8FF", to: "#1E7FB0" },
  { glyph: "🦃", from: "#FFB07F", to: "#B0561E" },
  { glyph: "🐦‍🔥", from: "#FF8A5C", to: "#C81E1E" },
  { glyph: "🦅", from: "#9AB0C9", to: "#3C4E63" },
  { glyph: "🦉", from: "#C9A97F", to: "#5E4326" },
  { glyph: "🦜", from: "#7FD8A0", to: "#1E8F5C" },
  { glyph: "🦚", from: "#7FE0D8", to: "#1E8FA0" },
];

// Level 4 — Smileys
const SMILEY_TILE_ART = [
  { glyph: "😄", from: "#FFC94A", to: "#F21F8C" },
  { glyph: "🙂", from: "#FF8AD2", to: "#B0176A" },
  { glyph: "😆", from: "#FFC94A", to: "#C81E7A" },
  { glyph: "😊", from: "#FF6FB8", to: "#F21F8C" },
  { glyph: "😁", from: "#FFC94A", to: "#8C0E58" },
  { glyph: "🥳", from: "#FF8AD2", to: "#F21F8C" },
  { glyph: "😉", from: "#FFC94A", to: "#B0176A" },
  { glyph: "😎", from: "#FF6FB8", to: "#C81E7A" },
  { glyph: "🤩", from: "#FFC94A", to: "#FF6FB8" },
];

// Level 5 — Sea creatures
const SEA_TILE_ART = [
  { glyph: "🦐", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🦀", from: "#E6CBA8", to: "#A06A22" },
  { glyph: "🐙", from: "#DDE6A8", to: "#8EA022" },
  { glyph: "🦑", from: "#BAE6A8", to: "#46A022" },
  { glyph: "🐠", from: "#A8E6B9", to: "#22A045" },
  { glyph: "🐡", from: "#A8E6DC", to: "#22A08D" },
  { glyph: "🐬", from: "#A8CCE6", to: "#226BA0" },
  { glyph: "🦈", from: "#A8A9E6", to: "#2223A0" },
  { glyph: "🐳", from: "#CBA8E6", to: "#6822A0" },
  { glyph: "🐚", from: "#E6A8DE", to: "#A02290" },
  { glyph: "🦞", from: "#E6A8BB", to: "#A02248" },
];

// Level 6 — Rabbits & woodland animals
const WOODLAND_TILE_ART = [
  { glyph: "🐇", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🐰", from: "#E6C5A8", to: "#A05E22" },
  { glyph: "🦔", from: "#E6E3A8", to: "#A09A22" },
  { glyph: "🦡", from: "#CCE6A8", to: "#6AA022" },
  { glyph: "🦫", from: "#AEE6A8", to: "#2FA022" },
  { glyph: "🐿️", from: "#A8E6BF", to: "#22A051" },
  { glyph: "🍄", from: "#A8E6DC", to: "#22A08D" },
  { glyph: "🦨", from: "#A8D2E6", to: "#2277A0" },
  { glyph: "🦇", from: "#A8B4E6", to: "#223BA0" },
  { glyph: "🦉", from: "#B9A8E6", to: "#4522A0" },
  { glyph: "🌰", from: "#D6A8E6", to: "#8022A0" },
  { glyph: "🍂", from: "#E6A8D8", to: "#A02284" },
  { glyph: "🪵", from: "#E6A8BB", to: "#A02248" },
];

// Level 7 — Flags (every gradient below is unique — no two flags share a color)
const FLAG_TILE_ART = [
  { glyph: "🇸🇾", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🇺🇸", from: "#E6C5A8", to: "#A05E22" },
  { glyph: "🇬🇧", from: "#E6E3A8", to: "#A09A22" },
  { glyph: "🇫🇷", from: "#CCE6A8", to: "#6AA022" },
  { glyph: "🇯🇵", from: "#AEE6A8", to: "#2FA022" },
  { glyph: "🇧🇷", from: "#A8E6BF", to: "#22A051" },
  { glyph: "🇮🇳", from: "#A8E6DC", to: "#22A08D" },
  { glyph: "🇰🇷", from: "#A8D2E6", to: "#2277A0" },
  { glyph: "🇨🇦", from: "#A8B4E6", to: "#223BA0" },
  { glyph: "🇦🇺", from: "#B9A8E6", to: "#4522A0" },
  { glyph: "🇩🇪", from: "#D6A8E6", to: "#8022A0" },
  { glyph: "🇮🇹", from: "#E6A8D8", to: "#A02284" },
  { glyph: "🇪🇸", from: "#E6A8BB", to: "#A02248" },
];

// Level 8 — Flowers
const FLOWER_TILE_ART = [
  { glyph: "🪷", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🌸", from: "#E6C1A8", to: "#A05522" },
  { glyph: "🌺", from: "#E6DAA8", to: "#A08822" },
  { glyph: "🌷", from: "#D8E6A8", to: "#84A022" },
  { glyph: "🌹", from: "#BFE6A8", to: "#51A022" },
  { glyph: "🌻", from: "#A8E6AA", to: "#22A026" },
  { glyph: "🌼", from: "#A8E6C3", to: "#22A05A" },
  { glyph: "💐", from: "#A8E6DC", to: "#22A08D" },
  { glyph: "🥀", from: "#A8D6E6", to: "#227FA0" },
  { glyph: "🏵️", from: "#A8BDE6", to: "#224CA0" },
  { glyph: "💮", from: "#ACA8E6", to: "#2B22A0" },
  { glyph: "🌾", from: "#C6A8E6", to: "#5E22A0" },
  { glyph: "🌱", from: "#DFA8E6", to: "#9122A0" },
  { glyph: "🪴", from: "#E6A8D4", to: "#A0227B" },
  { glyph: "🎍", from: "#E6A8BB", to: "#A02248" },
];

// Level 9 — Sports (every gradient below is unique)
const SPORTS_TILE_ART = [
  { glyph: "⚽", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🏀", from: "#E6BEA8", to: "#A04F22" },
  { glyph: "🏈", from: "#E6D4A8", to: "#A07C22" },
  { glyph: "⚾", from: "#E2E6A8", to: "#97A022" },
  { glyph: "🎾", from: "#CCE6A8", to: "#6AA022" },
  { glyph: "🏐", from: "#B6E6A8", to: "#3DA022" },
  { glyph: "🏉", from: "#A8E6B1", to: "#22A033" },
  { glyph: "🎱", from: "#A8E6C7", to: "#22A060" },
  { glyph: "🏓", from: "#A8E6DC", to: "#22A08D" },
  { glyph: "🏸", from: "#A8D9E6", to: "#2286A0" },
  { glyph: "🥊", from: "#A8C3E6", to: "#2259A0" },
  { glyph: "🥋", from: "#A8ADE6", to: "#222CA0" },
  { glyph: "🎳", from: "#B9A8E6", to: "#4522A0" },
  { glyph: "⛳", from: "#CFA8E6", to: "#7122A0" },
  { glyph: "🏹", from: "#E5A8E6", to: "#9E22A0" },
  { glyph: "🥌", from: "#E6A8D1", to: "#A02275" },
  { glyph: "🛹", from: "#E6A8BB", to: "#A02248" },
];

// Level 10 — Mix of every category above (every gradient below is unique)
const MIX_TILE_ART = [
  { glyph: "😺", from: "#E6A8A8", to: "#A02222" },
  { glyph: "🫵", from: "#E6BCA8", to: "#A04B22" },
  { glyph: "🐦", from: "#E6D0A8", to: "#A07322" },
  { glyph: "😄", from: "#E6E4A8", to: "#A09C22" },
  { glyph: "🦐", from: "#D4E6A8", to: "#7BA022" },
  { glyph: "🐇", from: "#C0E6A8", to: "#52A022" },
  { glyph: "🇸🇾", from: "#ACE6A8", to: "#29A022" },
  { glyph: "🪷", from: "#A8E6B8", to: "#22A043" },
  { glyph: "⚽", from: "#A8E6CC", to: "#22A06C" },
  { glyph: "🦃", from: "#A8E6E0", to: "#22A095" },
  { glyph: "🥳", from: "#A8D7E6", to: "#2282A0" },
  { glyph: "🦀", from: "#A8C3E6", to: "#225AA0" },
  { glyph: "🦔", from: "#A8AFE6", to: "#2231A0" },
  { glyph: "🌻", from: "#B5A8E6", to: "#3C22A0" },
  { glyph: "🐴", from: "#C9A8E6", to: "#6422A0" },
  { glyph: "👍", from: "#DCA8E6", to: "#8D22A0" },
  { glyph: "🐦‍🔥", from: "#E6A8DB", to: "#A0228A" },
  { glyph: "😎", from: "#E6A8C7", to: "#A02261" },
  { glyph: "🇮🇳", from: "#E6A8B3", to: "#A02239" },
];

const LEVEL_TILE_ART = {
  1: CAT_TILE_ART,
  2: HANDS_TILE_ART,
  3: BIRD_TILE_ART,
  4: SMILEY_TILE_ART,
  5: SEA_TILE_ART,
  6: WOODLAND_TILE_ART,
  7: FLAG_TILE_ART,
  8: FLOWER_TILE_ART,
  9: SPORTS_TILE_ART,
  10: MIX_TILE_ART,
};

function tileArtForLevel(level) {
  return LEVEL_TILE_ART[level] || DEFAULT_TILE_ART;
}

const COLORS = {
  bg1: "#F6EEF3",
  bg2: "#E3D3E0",
  ink: "#241B2E",
  inkSoft: "#5B4B67",
  pink: "#EE2D8C",
  pinkDeep: "#B0176A",
  pinkSoft: "#FF7FC2",
  acrylic: "rgba(255,255,255,0.55)",
  acrylicBorder: "rgba(255,255,255,0.85)",
  steel: "#D9DCE3",
  steelDark: "#8D93A3",
  steelLight: "#F2F4F8",
  emptyBg: "rgba(255,255,255,0.35)",
  emptyBorder: "rgba(140,100,140,0.45)",
};

/* ---------------------------- puzzle logic ---------------------------- *
 * Every helper below takes `rows` and `cols` explicitly, since the grid
 * shape now changes per level (wider for levels 1-6, taller from 7 on).
 * `pattern` controls which tile value is targeted at which physical grid
 * position when solved — movement mechanics themselves never change.
 * ------------------------------------------------------------------------ */

const rowOf = (i, cols) => Math.floor(i / cols);
const colOf = (i, cols) => i % cols;
const idxOf = (r, c, cols) => r * cols + c;

function solvedBoard(rows, cols, pattern = "row-major") {
  const total = rows * cols;
  const board = new Array(total);
  if (pattern === "col-major") {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        board[idxOf(r, c, cols)] = c * rows + r;
      }
    }
  } else {
    for (let i = 0; i < total; i++) board[i] = i;
  }
  return board;
}

function isSolved(board, target) {
  return board.every((v, i) => v === target[i]);
}

function getMovable(board, rows, cols) {
  const blankVal = board.length - 1;
  const blank = board.indexOf(blankVal);
  const br = rowOf(blank, cols);
  const bc = colOf(blank, cols);
  const out = [];
  [
    [br - 1, bc],
    [br + 1, bc],
    [br, bc - 1],
    [br, bc + 1],
  ].forEach(([r, c]) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) out.push(idxOf(r, c, cols));
  });
  return out;
}

function tryMove(board, rows, cols, tileIndex) {
  const movable = getMovable(board, rows, cols);
  if (!movable.includes(tileIndex)) return null;
  const blankVal = board.length - 1;
  const blank = board.indexOf(blankVal);
  const next = board.slice();
  next[blank] = board[tileIndex];
  next[tileIndex] = blankVal;
  return next;
}

/* ------------------------- line-move interaction -------------------------
 * The player can tap or drag ANY tile that shares the blank's row or
 * column — not just one directly touching it — and the whole run of
 * tiles between that tile and the blank shifts over together as a
 * single move. This is purely an interaction-layer convenience: it's
 * always equivalent to a sequence of ordinary adjacent slides (each one
 * legal via getMovable/tryMove above), so it never changes which boards
 * are reachable — solvability is exactly as guaranteed before.
 * ------------------------------------------------------------------------ */

function getLineMoveInfo(board, rows, cols, tileIndex) {
  const blankVal = board.length - 1;
  const blank = board.indexOf(blankVal);
  if (tileIndex === blank) return null;
  const tr = rowOf(tileIndex, cols);
  const tc = colOf(tileIndex, cols);
  const br = rowOf(blank, cols);
  const bc = colOf(blank, cols);
  if (tr === br && tc !== bc) return { axis: "x", line: tr, from: tc, to: bc };
  if (tc === bc && tr !== br) return { axis: "y", line: tc, from: tr, to: br };
  return null; // tile isn't aligned with the blank on either axis
}

function tryLineMove(board, rows, cols, tileIndex) {
  const info = getLineMoveInfo(board, rows, cols, tileIndex);
  if (!info) return null;
  const blankVal = board.length - 1;
  const next = board.slice();
  const { axis, line, from, to } = info;
  const cellAt = (p) => (axis === "x" ? idxOf(line, p, cols) : idxOf(p, line, cols));
  if (from < to) {
    for (let p = to; p > from; p--) next[cellAt(p)] = board[cellAt(p - 1)];
  } else {
    for (let p = to; p < from; p++) next[cellAt(p)] = board[cellAt(p + 1)];
  }
  next[cellAt(from)] = blankVal;
  return next;
}

function shuffleBoard(rows, cols, pattern = "row-major") {
  const target = solvedBoard(rows, cols, pattern);
  let board = target.slice();
  // fewer random moves for tiny boards so a 2x1/2x2 level doesn't loop forever
  const total = board.length;
  const steps = Math.max(20, total * 12) + Math.floor(Math.random() * total * 4);
  let lastBlank = -1;
  for (let i = 0; i < steps; i++) {
    const movable = getMovable(board, rows, cols).filter((m) => m !== lastBlank);
    const pool = movable.length ? movable : getMovable(board, rows, cols);
    const choice = pool[Math.floor(Math.random() * pool.length)];
    const blankBefore = board.indexOf(board.length - 1);
    const next = tryMove(board, rows, cols, choice);
    if (next) {
      lastBlank = blankBefore;
      board = next;
    }
  }
  return isSolved(board, target) ? shuffleBoard(rows, cols, pattern) : board;
}

/* ------------------------------ audio ---------------------------------- */

function useBeeper() {
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  };

  const beep = useCallback((freq, dur, vol = 0.18, type = "sine", delay = 0) => {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }, []);

  const play = useCallback(
    (name) => {
      switch (name) {
        case "slide":
          beep(720, 0.07, 0.12, "triangle");
          break;
        case "snap":
          beep(220, 0.09, 0.16, "sine");
          break;
        case "unlock":
          beep(500, 0.09, 0.15, "square");
          beep(720, 0.11, 0.15, "square", 0.1);
          break;
        case "win":
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            beep(f, 0.22, 0.16, "triangle", i * 0.12)
          );
          break;
        default:
          break;
      }
    },
    [beep]
  );

  return { play };
}

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

/* ---------------------------- persistence ------------------------------ */

function useBestScore(level) {
  const [best, setBest] = useState({ time: null, moves: null });
  const key = `ruler-puzzle-best-L${level}`;

  useEffect(() => {
    setBest({ time: null, moves: null });
    try {
      const raw = localStorage.getItem(key);
      if (raw) setBest(JSON.parse(raw));
    } catch {
      /* no saved score yet for this level */
    }
  }, [key]);

  const save = useCallback(
    async (timeMs, moves) => {
      let newBestTime = false;
      let newBestMoves = false;
      setBest((prev) => {
        const nextTime = prev.time === null || timeMs < prev.time ? timeMs : prev.time;
        const nextMoves = prev.moves === null || moves < prev.moves ? moves : prev.moves;
        newBestTime = nextTime !== prev.time || prev.time === null;
        newBestMoves = nextMoves !== prev.moves || prev.moves === null;
        const next = { time: nextTime, moves: nextMoves };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage unavailable (e.g. private mode) — score just won't persist */
        }
        return next;
      });
      return { newBestTime, newBestMoves };
    },
    [key]
  );

  return { best, save };
}

/* -------------------------------- timer --------------------------------- */

function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startRef.current !== null) setElapsed(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
  }, []);
  const stop = useCallback(() => {
    setRunning(false);
    if (startRef.current !== null) setElapsed(Date.now() - startRef.current);
  }, []);
  const reset = useCallback(() => {
    setRunning(false);
    startRef.current = null;
    setElapsed(0);
  }, []);

  return { elapsed, running, start, stop, reset };
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(
    2,
    "0"
  )}`;
}

/* -------------------------------- board --------------------------------- */

function Tile({ tileId, size, style, onPointerDown, imageSlice, showNumbers, artSet }) {
  const set = artSet || DEFAULT_TILE_ART;
  const art = set[tileId % set.length];
  const pad = 3;
  const inner = size - pad * 2;
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        width: size,
        height: size,
        padding: pad,
        boxSizing: "border-box",
        touchAction: "none",
        cursor: "pointer",
        userSelect: "none",
        ...style,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: 12,
          background: imageSlice
            ? undefined
            : `linear-gradient(135deg, ${art.from}, ${art.to})`,
          backgroundImage: imageSlice ? imageSlice.backgroundImage : undefined,
          backgroundSize: imageSlice ? imageSlice.backgroundSize : undefined,
          backgroundPosition: imageSlice ? imageSlice.backgroundPosition : undefined,
          backgroundRepeat: "no-repeat",
          border: "1.5px solid rgba(255,255,255,0.55)",
          boxShadow: "0 3px 4px rgba(91,42,80,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {!imageSlice && (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "45%",
                background: "rgba(255,255,255,0.16)",
              }}
            />
            <span style={{ fontSize: inner * 0.42, lineHeight: 1 }}>{art.glyph}</span>
          </>
        )}
        {(showNumbers || !imageSlice) && (
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              minWidth: 15,
              height: 15,
              padding: "0 2px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 800, color: COLORS.pinkDeep }}>
              {tileId + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LockDial({ size, onClick, spin }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: COLORS.steelLight,
        border: `4px solid ${COLORS.steel}`,
        boxShadow: "0 6px 10px rgba(91,42,80,0.18)",
        position: "relative",
        cursor: "pointer",
        transform: spin ? "rotate(300deg)" : "rotate(0deg)",
        transition: "transform 0.5s cubic-bezier(0.2,0.8,0.2,1)",
        padding: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 5,
          borderRadius: "50%",
          border: `2px solid ${COLORS.steelDark}`,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.32,
          height: size * 0.32,
          marginTop: -(size * 0.16),
          marginLeft: -(size * 0.16),
          borderRadius: "50%",
          background: COLORS.steel,
          border: `2px solid ${COLORS.steelDark}`,
        }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 2,
            height: size * 0.38,
            background: COLORS.steelDark,
            opacity: 0.35,
            transformOrigin: "top left",
            transform: `rotate(${i * 45}deg) translate(-1px, 0)`,
          }}
        />
      ))}
    </button>
  );
}


function Confetti({ show }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        glyph: ["🎉", "✨", "⭐", "🎊", "💫"][Math.floor(Math.random() * 5)],
        x: (Math.random() * 2 - 1) * 140,
        delay: Math.random() * 0.25,
        rot: Math.random() * 60 - 30,
      })),
    [show]
  );
  if (!show) return null;
  return (
    <>
      <style>{`
        @keyframes confettiBurst {
          0% { opacity: 0; transform: translate(0,0) scale(0.4) rotate(0deg); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx), -220px) scale(1) rotate(var(--rot)); }
        }
      `}</style>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            fontSize: 26,
            "--tx": `${p.x}px`,
            "--rot": `${p.rot}deg`,
            animation: `confettiBurst 1.1s ease-out ${p.delay}s both`,
            pointerEvents: "none",
          }}
        >
          {p.glyph}
        </span>
      ))}
    </>
  );
}

/* --------------------------------- app ---------------------------------- */

function RulerSlidePuzzle() {
  const [level, setLevel] = useState(1);
  const { rows, cols } = gridForLevel(level);
  const pattern = patternForLevel(level);
  const tileArt = tileArtForLevel(level);

  const [board, setBoard] = useState(() => solvedBoard(rows, cols, pattern));
  const [phase, setPhase] = useState("locked"); // locked | playing | won
  const [moves, setMoves] = useState(0);
  const [victory, setVictory] = useState(null);
  const [dialSpin, setDialSpin] = useState(false);

  const timer = useTimer();
  const { play } = useBeeper();
  const { best, save } = useBestScore(level);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [customImage, setCustomImage] = useState(null); // { url, w, h }
  const fileInputRef = useRef(null);

  const handlePickImage = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      const img = new Image();
      img.onload = () => {
        setCustomImage({ url, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const clearImage = useCallback(() => setCustomImage(null), []);

  const selectLevel = useCallback(
    (n) => {
      const g = gridForLevel(n);
      const p = patternForLevel(n);
      setLevel(n);
      setBoard(solvedBoard(g.rows, g.cols, p));
      setMoves(0);
      timer.reset();
      setPhase("locked");
      setVictory(null);
    },
    [timer]
  );

  // The target (solved) board for the current level/pattern, and the
  // inverse lookup — which physical grid position each tile value calls
  // home. Row-major and column-major patterns place the same tile value
  // at different physical slots, so image slicing must go through this
  // rather than assuming a tile's value equals its home index.
  const target = useMemo(() => solvedBoard(rows, cols, pattern), [rows, cols, pattern]);
  const homeIndexOf = useMemo(() => {
    const map = {};
    target.forEach((value, physicalIndex) => {
      map[value] = physicalIndex;
    });
    return map;
  }, [target]);

  const GAP = 3;
  const boardAreaWidth = Math.max(220, containerWidth - 24);
  // Levels 1-6 size tiles off their own column count (level 1 = fewer,
  // bigger tiles; level 6 = more, smaller tiles — the original behavior).
  // Levels 7-10 instead pin to a fixed reference of 6 columns — level 5's
  // width — so they don't balloon to the cap just because they only have
  // 2 actual columns.
  const SIZE_BASIS_COLS = level <= 6 ? cols : 6;
  const rawCell = Math.floor((boardAreaWidth - GAP * (SIZE_BASIS_COLS - 1)) / SIZE_BASIS_COLS);
  const cellSize = Math.max(20, Math.min(56, rawCell));
  const step = cellSize + GAP;
  const boardWidth = cellSize * cols + GAP * (cols - 1);
  const boardHeight = cellSize * rows + GAP * (rows - 1);

  // "cover"-style crop of the uploaded photo across the whole board, then
  // each tile just windows into its own home slice of that cropped image.
  const imageCover = useMemo(() => {
    if (!customImage) return null;
    const scale = Math.max(boardWidth / customImage.w, boardHeight / customImage.h);
    const scaledW = customImage.w * scale;
    const scaledH = customImage.h * scale;
    const offsetX = (boardWidth - scaledW) / 2;
    const offsetY = (boardHeight - scaledH) / 2;
    return { scaledW, scaledH, offsetX, offsetY };
  }, [customImage, boardWidth, boardHeight]);

  const sliceFor = useCallback(
    (tileId) => {
      if (!customImage || !imageCover) return null;
      const homeIndex = homeIndexOf[tileId];
      const r = rowOf(homeIndex, cols);
      const c = colOf(homeIndex, cols);
      return {
        backgroundImage: `url(${customImage.url})`,
        backgroundSize: `${imageCover.scaledW}px ${imageCover.scaledH}px`,
        backgroundPosition: `${imageCover.offsetX - c * step}px ${imageCover.offsetY - r * step}px`,
      };
    },
    [customImage, imageCover, step, cols, homeIndexOf]
  );

  const targetFor = useCallback(
    (index) => ({ x: colOf(index, cols) * step, y: rowOf(index, cols) * step }),
    [step, cols]
  );

  // drag state kept in refs so pointer handlers always see fresh data
  const boardRef = useRef(board);
  boardRef.current = board;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const dragState = useRef(null); // { tileId, originIndex, axis, sign, baseX, baseY, startedAsTap }
  const [dragOverride, setDragOverride] = useState(null); // { tileId, x, y }
  const dragPosRef = useRef(null); // mirrors dragOverride but reads back synchronously

  const handleCommit = useCallback(
    (tileIndex) => {
      setBoard((prev) => {
        const next = tryLineMove(prev, rows, cols, tileIndex);
        return next || prev;
      });
      setMoves((m) => m + 1);
    },
    [rows, cols]
  );

  const onPointerDown = (tileId) => (e) => {
    if (phaseRef.current !== "playing") return;
    const currentBoard = boardRef.current;
    const originIndex = currentBoard.indexOf(tileId);
    const info = getLineMoveInfo(currentBoard, rows, cols, originIndex);
    if (!info) return; // tile isn't aligned with the blank's row/column

    const axis = info.axis;
    const sign = Math.sign(info.to - info.from); // direction the tile travels toward the blank
    const lineDistance = Math.abs(info.to - info.from); // how many cells to drag it the whole way
    const base = targetFor(originIndex);

    dragState.current = {
      tileId,
      originIndex,
      axis,
      sign,
      maxDrag: step * lineDistance,
      baseX: base.x,
      baseY: base.y,
      startedAsTap: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
    };
    dragPosRef.current = { x: base.x, y: base.y };
    setDragOverride({ tileId, x: base.x, y: base.y });
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const onMove = (ev) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = ev.clientX - ds.startX;
      const dy = ev.clientY - ds.startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) ds.startedAsTap = false;
      let next;
      if (ds.axis === "x") {
        const raw = dx * ds.sign;
        const clamped = Math.max(0, Math.min(ds.maxDrag, raw));
        next = { x: ds.baseX + clamped * ds.sign, y: ds.baseY };
      } else {
        const raw = dy * ds.sign;
        const clamped = Math.max(0, Math.min(ds.maxDrag, raw));
        next = { x: ds.baseX, y: ds.baseY + clamped * ds.sign };
      }
      dragPosRef.current = next;
      setDragOverride({ tileId, ...next });
    };

    const onUp = () => {
      const ds = dragState.current;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!ds) return;

      const cur = dragPosRef.current || { x: ds.baseX, y: ds.baseY };
      const travelled = ds.axis === "x" ? (cur.x - ds.baseX) * ds.sign : (cur.y - ds.baseY) * ds.sign;
      // a light flick (>40% of one cell) is enough to commit the whole line move
      const shouldCommit = ds.startedAsTap || travelled > step * 0.4;

      if (shouldCommit && tryLineMove(boardRef.current, rows, cols, ds.originIndex)) {
        play("slide");
        vibrate(10);
        handleCommit(ds.originIndex);
        setTimeout(() => play("snap"), 90);
      }
      dragState.current = null;
      dragPosRef.current = null;
      setDragOverride(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const beginRound = useCallback(() => {
    setBoard(shuffleBoard(rows, cols, pattern));
    setMoves(0);
    timer.start();
    setPhase("playing");
    setVictory(null);
    setDialSpin((s) => !s);
    play("unlock");
    vibrate(20);
  }, [timer, play, rows, cols, pattern]);

  const goToNextLevel = useCallback(() => {
    const nextLevel = Math.min(level + 1, MAX_LEVEL);
    const g = gridForLevel(nextLevel);
    const p = patternForLevel(nextLevel);
    setLevel(nextLevel);
    setBoard(shuffleBoard(g.rows, g.cols, p));
    setMoves(0);
    timer.start();
    setPhase("playing");
    setVictory(null);
    play("unlock");
    vibrate(20);
  }, [level, timer, play]);

  const handleReset = useCallback(() => {
    setBoard(solvedBoard(rows, cols, pattern));
    setMoves(0);
    timer.reset();
    setPhase("locked");
    setVictory(null);
  }, [timer, rows, cols, pattern]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (!isSolved(board, target)) return;
    timer.stop();
    play("win");
    vibrate([15, 40, 15, 40, 30]);
    setPhase("won");
    const timeMs = timer.elapsed;
    save(timeMs, moves).then(({ newBestTime, newBestMoves }) => {
      setVictory({ timeMs, moves, newBestTime, newBestMoves });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, phase, target]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: `linear-gradient(180deg, ${COLORS.bg1}, ${COLORS.bg2})`,
        display: "flex",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, letterSpacing: 0.5 }}>
              RULER SLIDE
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginTop: 1 }}>
              Level {level} · {rows} × {cols} track
            </div>
          </div>
          {phase !== "locked" && (
            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: COLORS.acrylic,
                border: `1.5px solid ${COLORS.acrylicBorder}`,
                fontWeight: 800,
                fontSize: 13,
                color: COLORS.pinkDeep,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>

        {phase !== "locked" && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <StatCard label="TIME" value={fmt(timer.elapsed)} />
            <StatCard label="MOVES" value={String(moves)} />
            <StatCard
              label="BEST"
              value={best.time !== null ? fmt(best.time) : "--:--"}
              sub={best.moves !== null ? `${best.moves} mv` : undefined}
            />
          </div>
        )}

        {phase === "locked" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.inkSoft, letterSpacing: 1, marginBottom: 6 }}>
              LEVEL — GRID GROWS EACH TIME
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LEVELS.map((n) => {
                const active = n === level;
                return (
                  <button
                    key={n}
                    onClick={() => selectLevel(n)}
                    style={{
                      width: 52,
                      height: 48,
                      borderRadius: 12,
                      border: active ? `2px solid ${COLORS.pink}` : `1.5px solid ${COLORS.acrylicBorder}`,
                      background: active ? COLORS.pink : COLORS.acrylic,
                      color: active ? "#fff" : COLORS.ink,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1.1,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{n}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85 }}>2×{n + 1}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.inkSoft, marginTop: 6 }}>
              {rows}×{cols} grid — {rows * cols - 1} tiles to place
            </div>
          </div>
        )}

        {phase === "locked" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              padding: 12,
              background: COLORS.acrylic,
              border: `1.5px solid ${COLORS.acrylicBorder}`,
              borderRadius: 16,
            }}
          >
            {customImage ? (
              <img
                src={customImage.url}
                alt="Selected"
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.pinkSoft}, ${COLORS.pinkDeep})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                🖼️
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.ink }}>
                {customImage ? "Photo ready" : "Use your own photo"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.inkSoft, marginTop: 1 }}>
                {customImage
                  ? "It'll be cut into the 13 tiles"
                  : "Optional — otherwise the alien tiles are used"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: COLORS.pink,
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {customImage ? "Change" : "Choose"}
            </button>
            {customImage && (
              <button
                onClick={clearImage}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: "transparent",
                  color: COLORS.inkSoft,
                  border: `1.5px solid ${COLORS.acrylicBorder}`,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8 }}>
          <div
            style={{
              maxWidth: "100%",
              overflowX: boardWidth + 20 > boardAreaWidth ? "auto" : "visible",
              WebkitOverflowScrolling: "touch",
              borderRadius: 26,
            }}
          >
            <div
              style={{
                width: boardWidth + 20,
                height: boardHeight + 20,
                background: COLORS.acrylic,
                border: `2px solid ${COLORS.acrylicBorder}`,
                borderRadius: 26,
                boxShadow: "0 6px 10px rgba(91,42,80,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "relative", width: boardWidth, height: boardHeight }}>
                {board.map((tileId, index) => {
                  if (tileId !== board.length - 1) return null;
                  const t = targetFor(index);
                  return (
                  <div
                    key={`blank-${index}`}
                    style={{
                      position: "absolute",
                      left: t.x,
                      top: t.y,
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 12,
                      background: COLORS.emptyBg,
                      border: `1.5px dashed ${COLORS.emptyBorder}`,
                    }}
                  />
                );
              })}
              {board.map((tileId, index) => {
                if (tileId === board.length - 1) return null;
                const isDragging = dragOverride && dragOverride.tileId === tileId;
                const pos = isDragging ? dragOverride : targetFor(index);
                return (
                  <Tile
                    key={`tile-${tileId}`}
                    tileId={tileId}
                    size={cellSize}
                    onPointerDown={onPointerDown(tileId)}
                    imageSlice={sliceFor(tileId)}
                    showNumbers={phase !== "won"}
                    artSet={tileArt}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transition: isDragging ? "none" : "left 0.22s cubic-bezier(0.2,0.8,0.2,1), top 0.22s cubic-bezier(0.2,0.8,0.2,1)",
                    }}
                  />
                );
              })}
              </div>
            </div>
          </div>

          {customImage && phase !== "locked" && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.inkSoft, letterSpacing: 1, marginBottom: 6 }}>
                TARGET PICTURE
              </div>
              <div
                style={{
                  width: boardWidth * 0.55,
                  height: boardHeight * 0.55,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `2px solid ${COLORS.acrylicBorder}`,
                  boxShadow: "0 4px 8px rgba(91,42,80,0.18)",
                }}
              >
                <img
                  src={customImage.url}
                  alt="Full target"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          )}
        </div>

        {phase === "locked" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28, gap: 10 }}>
            <LockDial size={92} onClick={beginRound} spin={dialSpin} />
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.ink }}>Twist to unlock</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>
              Tap to shuffle &amp; start
            </div>
          </div>
        )}

        {phase === "playing" && (
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>
            Drag or tap a tile next to the gap to slide it.
          </div>
        )}
      </div>

      {phase === "won" && victory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,27,46,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div style={{ position: "relative" }}>
            <Confetti show={phase === "won"} />
            <div
              style={{
                width: 300,
                maxWidth: "84vw",
                background: "#fff",
                borderRadius: 26,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 6px 10px rgba(91,42,80,0.18)",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>Solved! 🏆</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginTop: 4 }}>
                Level {level} — the picture is back in order.
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 20, marginBottom: 22 }}>
                <ResultBox label="TIME" value={fmt(victory.timeMs)} isBest={victory.newBestTime} />
                <ResultBox label="MOVES" value={String(victory.moves)} isBest={victory.newBestMoves} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={beginRound}
                  style={{
                    background: COLORS.acrylic,
                    color: COLORS.pinkDeep,
                    fontWeight: 800,
                    fontSize: 14,
                    border: `1.5px solid ${COLORS.acrylicBorder}`,
                    borderRadius: 999,
                    padding: "14px 18px",
                    cursor: "pointer",
                  }}
                >
                  Replay
                </button>
                {level < MAX_LEVEL ? (
                  <button
                    onClick={goToNextLevel}
                    style={{
                      background: COLORS.pink,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 14,
                      border: "none",
                      borderRadius: 999,
                      padding: "14px 22px",
                      cursor: "pointer",
                    }}
                  >
                    Next Level →
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    style={{
                      background: COLORS.pink,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 14,
                      border: "none",
                      borderRadius: 999,
                      padding: "14px 22px",
                      cursor: "pointer",
                    }}
                  >
                    All Levels Done 🎉
                  </button>
                )}
              </div>
              <button
                onClick={handleReset}
                style={{
                  marginTop: 12,
                  background: "transparent",
                  color: COLORS.inkSoft,
                  fontWeight: 700,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Choose a different level
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.acrylic,
        borderRadius: 12,
        border: `1.5px solid ${COLORS.acrylicBorder}`,
        padding: "8px 0",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.inkSoft, letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.ink, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.pinkDeep, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function ResultBox({ label, value, isBest }) {
  return (
    <div
      style={{
        minWidth: 100,
        padding: "10px 14px",
        background: COLORS.bg1,
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.inkSoft, letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginTop: 2 }}>{value}</div>
      {isBest && <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.pinkDeep, marginTop: 4 }}>NEW BEST</div>}
    </div>
  );
}


function PianoScreen({onBack}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column",backgroundColor:"#7b6ff2"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 16px",backgroundColor:"rgba(0,0,0,0.15)",flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.25)",
          border:"none",borderRadius:R.md,color:"#fff",fontSize:13,fontWeight:700,
          padding:"7px 14px",cursor:"pointer"}}>← GameHub</button>
        <span style={{color:"#fff",fontWeight:700,fontFamily:FONT_DISPLAY,fontSize:15}}>Alphabet Piano</span>
        <span style={{width:80}}/>
      </div>
      <iframe title="Alphabet Piano" srcDoc={MEMORYHUB_PIANO_HTML} style={{flex:1,width:"100%",border:"none"}}/>
    </div>
  );
}

const TABS=[
  {id:"notify",icon:"🔔",lbl:"Notify"},
  {id:"alam",icon:"⏰",lbl:"Alarm"},
  {id:"gamehub",icon:"🎮",lbl:"GameHub"},
];

function BottomNav({active,onSelect}){
  const blue=active!=="gamehub";
  const accent=blue?"#2f6bf0":"#ff6b6b";
  return(
    <div style={{
      position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:480,background:"#ffffff",borderTop:blue?"1px solid #d9e8fb":"1px solid #f0dfc0",
      borderRadius:blue?"22px 22px 0 0":0,boxShadow:blue?"0 -6px 22px rgba(47,107,240,.10)":"none",
      display:"flex",zIndex:100,padding:"8px 0 26px",
    }}>
      {TABS.map(t=>{
        const isActive=active===t.id;
        return(
          <button key={t.id} onClick={()=>onSelect(t.id)} style={{
            flex:1,background:"none",border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:4,
            padding:"8px 4px 4px",position:"relative",
          }}>
            {isActive&&<div style={{position:"absolute",top:0,left:"30%",right:"30%",height:2,backgroundColor:accent}}/>}
            <span style={{fontSize:20,filter:isActive?"none":"grayscale(1)",opacity:isActive?1:0.35,transition:"opacity 0.2s"}}>{t.icon}</span>
            <span style={{fontSize:9.5,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
              fontFamily:"'Poppins',sans-serif",color:isActive?accent:(blue?"#9fb2d1":"#c4b8d8"),transition:"color 0.2s"}}>{t.lbl}</span>
          </button>
        );
      })}
    </div>
  );
}

// Mounts Reminder Hub's self-contained engine (constants, state, vanilla-DOM
// screen builders) into a plain div. The engine is injected as a literal
// <script> tag exactly once; after that, switching tabs just calls the
// engine's own render() again — same as the original standalone app did.
function RemindMeContainer({activeTab,onNavHiddenChange}){
  const containerRef=useRef(null);

  useEffect(()=>{
    // Inject RemindMe's scoped stylesheet once, ever (survives tab switches
    // since RemindMeContainer may unmount/remount as you change tabs).
    if(!document.getElementById("rm-styles")){
      const style=document.createElement("style");
      style.id="rm-styles";
      style.textContent=REMINDME_CSS;
      document.head.appendChild(style);
    }
    // Guarded so a stray render() from the engine's background interval
    // (it keeps polling for due reminders/alarms even while this component
    // is unmounted, same as the original standalone app did) never calls
    // setState on an unmounted React tree.
    let live=true;
    window.__rmSetNavHidden=(hidden)=>{if(live)onNavHiddenChange(hidden);};
    // Inject RemindMe's engine script exactly once globally. We can't rely
    // on a React ref for this check — RemindMeContainer unmounts when you
    // switch to the GameHub tab, which would reset any local ref, but the
    // injected <script>'s top-level `const`/`let` declarations are real
    // globals and cannot be redeclared without throwing.
    if(!window.__rmEngineLoaded){
      window.__rmEngineLoaded=true;
      const script=document.createElement("script");
      script.id="rm-engine";
      script.textContent=REMINDME_ENGINE_JS;
      document.body.appendChild(script);
    } else if(window.__rmEngine){
      // Engine already exists from a previous mount — just re-render into
      // the freshly-created #rm-root div.
      window.__rmEngine.render();
    }
    return ()=>{live=false;};
  },[]);

  // When the shared nav switches to notify/alam/dailry, tell the engine
  // which internal tab to show.
  useEffect(()=>{
    if(window.__rmGoToTab)window.__rmGoToTab(activeTab);
  },[activeTab]);

  return <div id="rm-container"><div id="rm-root" ref={containerRef}/></div>;
}

export default function App(){
  const [activeTab,setActiveTab]=useState("notify");
  const [ghNavHidden,setGhNavHidden]=useState(false);
  const [rmNavHidden,setRmNavHidden]=useState(false);

  const navHidden=activeTab==="gamehub"?ghNavHidden:rmNavHidden;

  return(
    <div style={{position:"relative",maxWidth:480,margin:"0 auto",minHeight:"100vh"}}>
      {activeTab==="gamehub"
        ? <GameHubApp onNavHiddenChange={setGhNavHidden}/>
        : <RemindMeContainer activeTab={activeTab} onNavHiddenChange={setRmNavHidden}/>}
      {!navHidden&&<BottomNav active={activeTab} onSelect={setActiveTab}/>}
    </div>
  );
}


// ── HUB ───────────────────────────────────────────────────────────────────
function HubScreen({onNav,online,soundOn,toggleSound}){
  return(
    <div style={{minHeight:"100vh",backgroundColor:C.bg,fontFamily:"'Inter',system-ui,sans-serif",padding:"0 20px 110px"}}>

      {/* Top bar with sound + stats */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:20,paddingBottom:4}}>
        <p style={{margin:0,fontSize:10.5,fontWeight:700,color:C.sub,letterSpacing:2.2,textTransform:"uppercase"}}>GameHub</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={toggleSound} title={soundOn?"Sound On":"Sound Off"} style={{
            background:soundOn?C.purple+"18":"none",
            border:`1px solid ${soundOn?C.purple+"55":C.borderSoft}`,
            borderRadius:R.md,color:soundOn?C.purple:C.muted,
            fontSize:15,padding:"6px 12px",cursor:"pointer",transition:"all 0.2s",
            opacity:soundOn?1:0.45
          }}>🎵</button>
          <button onClick={()=>onNav("stats")} title="My Stats" style={{
            background:"none",border:`1px solid ${C.borderSoft}`,
            borderRadius:R.md,color:C.sub,
            fontSize:15,padding:"6px 12px",cursor:"pointer"
          }}>📊</button>
        </div>
      </div>

      {/* Hero title */}
      <div style={{textAlign:"center",paddingTop:20,paddingBottom:26}}>
        <h1 style={{margin:0,fontSize:40,fontWeight:800,fontFamily:FONT_DISPLAY,letterSpacing:-0.5,lineHeight:1}}>
          <span style={{color:C.accent}}>Game</span><span style={{color:C.glow}}>Hub</span>
        </h1>
        <p style={{margin:"8px 0 0",color:C.sub,fontSize:13.5,fontWeight:500}}>Two games. One goal — train your brain! 🎉</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:480,margin:"0 auto"}}>
        <GameCard icon="⬜" title="MemoryGrid" desc="25 levels of glow, vanish & recall — boxes, numbers, symbols and sequences." tags={["25 Levels","5 Lives"]} accent={C.glow} onClick={()=>onNav("memorygrid")}/>
        <GameCard icon="🧩" title="BrainDash" desc="Biology, GK, Physics & Speed — 1500 questions, works offline, fresh shuffle every game!" tags={["4 Sections","1500 Questions","Offline"]} accent={C.purple} onClick={()=>onNav("braindash")}/>
        <GameCard icon="🎹" title="Alphabet Piano" desc="Turn text into melody — tap letters or type to play." tags={["Fun Tool"]} accent={C.accent} onClick={()=>onNav("piano")}/>
        <GameCard icon="📏" title="Ruler Puzzle" desc="Slide tiles back into order on a 2-row sliding strip, just like the classic ruler toy." tags={["10 Levels","Sliding Puzzle"]} accent={C.pink||C.purple} onClick={()=>onNav("ruler")}/>
      </div>

    </div>
  );
}
function GameCard({icon,title,desc,tags,accent,onClick,dimmed}){
  const [pr,setPr]=useState(false);
  return(
    <div onClick={onClick} onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{position:"relative",backgroundColor:C.card,border:`2px solid ${C.border}`,borderRadius:R.xl,
        padding:16,display:"flex",alignItems:"center",gap:14,overflow:"hidden",cursor:"pointer",
        opacity:dimmed?0.55:1,
        transform:pr?"scale(0.97)":"scale(1)",transition:"transform 0.1s,opacity 0.15s",boxShadow:`0 6px 0 ${C.border}`}}>
      <div style={{width:54,height:54,borderRadius:R.lg,backgroundColor:accent+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:28}}>{icon}</span>
      </div>
      <div style={{flex:1}}>
        <p style={{margin:"0 0 4px",fontWeight:700,fontFamily:FONT_DISPLAY,fontSize:18,color:C.text,letterSpacing:0}}>{title}</p>
        <p style={{margin:0,color:C.sub,fontSize:12,lineHeight:"17px"}}>{desc}</p>
        <div style={{display:"flex",gap:6,marginTop:9}}>
          {tags.map(t=><span key={t} style={{backgroundColor:accent+"1f",borderRadius:R.pill,padding:"3px 10px",color:accent,fontSize:10,fontWeight:700}}>{t}</span>)}
        </div>
      </div>
      <span style={{color:accent,fontSize:20,fontWeight:700}}>›</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BRAINDASH — 4 sections, all API-powered, no repeats per section per session
// ════════════════════════════════════════════════════════════════════════════

// ── Hardcoded Question Banks ─────────────────────────────────────────────
// Biology: 100 basic + 150 medium + 250 hard = 500 questions
// GK:      100 basic + 150 medium + 250 hard = 500 questions
// Total: 1000 questions — no API, works fully offline
const BIO_BASIC=[{"q":"How many bones are in the adult human body?","opts":["206","208","204","210"],"ans":0},{"q":"What is the largest organ in the human body?","opts":["Liver","Skin","Heart","Lungs"],"ans":1},{"q":"How many chambers does the human heart have?","opts":["2","3","4","5"],"ans":2},{"q":"What do we call the tube that carries food from mouth to stomach?","opts":["Trachea","Esophagus","Intestine","Bronchus"],"ans":1},{"q":"Which organ pumps blood throughout the body?","opts":["Lungs","Liver","Kidney","Heart"],"ans":3},{"q":"How many layers does human skin have?","opts":["2","3","4","5"],"ans":1},{"q":"What is the smallest bone in the human body?","opts":["Stapes","Femur","Tibia","Radius"],"ans":0},{"q":"Which organ filters blood and removes waste?","opts":["Heart","Lungs","Kidney","Liver"],"ans":2},{"q":"How many teeth does a healthy adult have?","opts":["28","30","32","34"],"ans":2},{"q":"What is the powerhouse of the cell?","opts":["Nucleus","Ribosome","Mitochondria","Vacuole"],"ans":2},{"q":"Which blood cells carry oxygen?","opts":["White blood cells","Platelets","Red blood cells","Plasma"],"ans":2},{"q":"What is the largest bone in the human body?","opts":["Humerus","Femur","Tibia","Radius"],"ans":1},{"q":"How many lungs does a human have?","opts":["1","2","3","4"],"ans":1},{"q":"What organ controls breathing and heartbeat automatically?","opts":["Cerebrum","Cerebellum","Brain stem","Spinal cord"],"ans":2},{"q":"Which part of the eye controls how much light enters?","opts":["Retina","Cornea","Iris","Lens"],"ans":2},{"q":"What is the normal human body temperature in Celsius?","opts":["35\u00b0C","36\u00b0C","37\u00b0C","38\u00b0C"],"ans":2},{"q":"How many senses does the human body have?","opts":["3","4","5","6"],"ans":2},{"q":"Which organ produces bile to digest fat?","opts":["Pancreas","Stomach","Kidney","Liver"],"ans":3},{"q":"What do we call the fluid that carries blood cells?","opts":["Serum","Plasma","Lymph","Water"],"ans":1},{"q":"Which part of the brain controls balance?","opts":["Cerebrum","Cerebellum","Hippocampus","Thalamus"],"ans":1},{"q":"How many kidneys does a human body have?","opts":["1","2","3","4"],"ans":1},{"q":"What is the medical term for the kneecap?","opts":["Patella","Femur","Tibia","Fibula"],"ans":0},{"q":"Which vitamin is produced when skin is exposed to sunlight?","opts":["Vitamin A","Vitamin B","Vitamin C","Vitamin D"],"ans":3},{"q":"What is the function of white blood cells?","opts":["Carry oxygen","Fight infection","Clot blood","Digest food"],"ans":1},{"q":"Which organ is responsible for thinking and memory?","opts":["Heart","Lungs","Brain","Kidney"],"ans":2},{"q":"What do we call the windpipe?","opts":["Esophagus","Trachea","Bronchus","Larynx"],"ans":1},{"q":"How many vertebrae are in the human spine?","opts":["26","33","40","45"],"ans":1},{"q":"Which part of the cell contains DNA?","opts":["Mitochondria","Ribosome","Nucleus","Cell wall"],"ans":2},{"q":"What is the average number of times a human heart beats per minute?","opts":["50","60","72","90"],"ans":2},{"q":"Which organ produces insulin?","opts":["Liver","Kidney","Pancreas","Stomach"],"ans":2},{"q":"What connects muscles to bones?","opts":["Ligaments","Tendons","Cartilage","Nerves"],"ans":1},{"q":"What connects bones to bones?","opts":["Tendons","Ligaments","Cartilage","Muscles"],"ans":1},{"q":"Which part of the eye detects light?","opts":["Cornea","Iris","Pupil","Retina"],"ans":3},{"q":"What is the outer layer of skin called?","opts":["Dermis","Epidermis","Hypodermis","Subcutis"],"ans":1},{"q":"How many pairs of ribs does a human have?","opts":["10","11","12","13"],"ans":2},{"q":"Which organ stores bile?","opts":["Liver","Pancreas","Gallbladder","Kidney"],"ans":2},{"q":"What is the function of platelets?","opts":["Carry oxygen","Fight infection","Help blood clot","Digest food"],"ans":2},{"q":"Which part of the body produces red blood cells?","opts":["Liver","Heart","Bone marrow","Spleen"],"ans":2},{"q":"What is the scientific name for the voice box?","opts":["Trachea","Pharynx","Larynx","Bronchus"],"ans":2},{"q":"How many muscles are in the human body approximately?","opts":["300","450","600","750"],"ans":2},{"q":"Which sense organ detects smell?","opts":["Eyes","Ears","Nose","Tongue"],"ans":2},{"q":"What is the average human brain weight?","opts":["1 kg","1.4 kg","2 kg","2.5 kg"],"ans":1},{"q":"Which organ removes carbon dioxide from the blood?","opts":["Heart","Kidney","Liver","Lungs"],"ans":3},{"q":"What type of blood vessel carries blood away from the heart?","opts":["Vein","Artery","Capillary","Lymph vessel"],"ans":1},{"q":"What type of blood vessel carries blood to the heart?","opts":["Artery","Vein","Capillary","Aorta"],"ans":1},{"q":"Which finger has no tendon for independent movement?","opts":["Index","Middle","Ring","Pinky"],"ans":2},{"q":"What is the hardest substance in the human body?","opts":["Bone","Cartilage","Tooth enamel","Nail"],"ans":2},{"q":"How many lobes does the right lung have?","opts":["2","3","4","5"],"ans":1},{"q":"What is the main function of the stomach?","opts":["Filter blood","Digest food","Store bile","Pump blood"],"ans":1},{"q":"Which gland is called the master gland of the body?","opts":["Thyroid","Adrenal","Pituitary","Pancreas"],"ans":2},{"q":"What covers and protects the ends of bones at joints?","opts":["Tendons","Ligaments","Cartilage","Muscles"],"ans":2},{"q":"How many pairs of cranial nerves does the human brain have?","opts":["10","12","14","16"],"ans":1},{"q":"Which part of the digestive system absorbs most nutrients?","opts":["Stomach","Large intestine","Small intestine","Esophagus"],"ans":2},{"q":"What is the average lifespan of a red blood cell?","opts":["30 days","60 days","120 days","180 days"],"ans":2},{"q":"Which organ is both an endocrine and exocrine gland?","opts":["Thyroid","Adrenal","Liver","Pancreas"],"ans":3},{"q":"What percentage of the human body is water?","opts":["40%","50%","60%","70%"],"ans":2},{"q":"Which vitamin helps blood clotting?","opts":["Vitamin A","Vitamin C","Vitamin D","Vitamin K"],"ans":3},{"q":"What is the colored part of the eye called?","opts":["Pupil","Iris","Cornea","Retina"],"ans":1},{"q":"Which blood type is the universal donor?","opts":["A","B","AB","O"],"ans":3},{"q":"What is the function of the eardrum?","opts":["Balance","Detect sound vibrations","Produce earwax","Filter sound"],"ans":1},{"q":"Which system controls voluntary movements?","opts":["Autonomic nervous system","Somatic nervous system","Endocrine system","Lymphatic system"],"ans":1},{"q":"What is the main sugar found in the blood?","opts":["Fructose","Sucrose","Glucose","Lactose"],"ans":2},{"q":"Which gland produces thyroid hormones?","opts":["Pituitary","Adrenal","Thyroid","Pancreas"],"ans":2},{"q":"How long is the small intestine approximately?","opts":["3 metres","6 metres","9 metres","12 metres"],"ans":1},{"q":"Which muscle is the hardest working muscle in the body?","opts":["Bicep","Quadricep","Heart","Diaphragm"],"ans":2},{"q":"What is the function of the diaphragm?","opts":["Digest food","Help breathing","Filter blood","Pump blood"],"ans":1},{"q":"Which part of the brain controls emotions?","opts":["Cerebellum","Brain stem","Limbic system","Thalamus"],"ans":2},{"q":"What covers the outside of a bone?","opts":["Cartilage","Periosteum","Endosteum","Marrow"],"ans":1},{"q":"How many chromosomes does a normal human cell have?","opts":["23","44","46","48"],"ans":2},{"q":"Which organ is responsible for detoxifying the blood?","opts":["Kidney","Spleen","Liver","Pancreas"],"ans":2},{"q":"What is the name of the process by which cells divide?","opts":["Meiosis","Mitosis","Osmosis","Diffusion"],"ans":1},{"q":"Which blood group is the universal recipient?","opts":["A","B","O","AB"],"ans":3},{"q":"What is the name of the cell that transmits nerve signals?","opts":["Neuron","Nephron","Nematode","Nucleon"],"ans":0},{"q":"Which mineral is most important for strong bones?","opts":["Iron","Calcium","Potassium","Sodium"],"ans":1},{"q":"What is the name of the hormone that regulates sleep?","opts":["Adrenaline","Insulin","Melatonin","Cortisol"],"ans":2},{"q":"Which part of the digestive system removes water from waste?","opts":["Small intestine","Stomach","Large intestine","Esophagus"],"ans":2},{"q":"What is the name of the protective fluid around the brain?","opts":["Blood","Plasma","Cerebrospinal fluid","Lymph"],"ans":2},{"q":"Which sense is most closely linked to memory?","opts":["Sight","Hearing","Touch","Smell"],"ans":3},{"q":"What is the name of the longest nerve in the human body?","opts":["Femoral nerve","Vagus nerve","Sciatic nerve","Radial nerve"],"ans":2},{"q":"Which organ produces the hormone adrenaline?","opts":["Thyroid","Pituitary","Adrenal gland","Pancreas"],"ans":2},{"q":"What is the normal resting heart rate for adults?","opts":["40-50","60-100","100-120","120-140"],"ans":1},{"q":"Which part of the tooth is visible above the gum?","opts":["Root","Pulp","Crown","Dentin"],"ans":2},{"q":"What is the name of the membrane that surrounds the heart?","opts":["Pleura","Pericardium","Peritoneum","Meninges"],"ans":1},{"q":"Which cells in the pancreas produce insulin?","opts":["Alpha cells","Beta cells","Delta cells","Gamma cells"],"ans":1},{"q":"What is the main function of red blood cells?","opts":["Fight infection","Carry oxygen","Clot blood","Produce antibodies"],"ans":1},{"q":"Which part of the brain is responsible for language?","opts":["Frontal lobe","Parietal lobe","Temporal lobe","Occipital lobe"],"ans":2},{"q":"What is the name of the tube connecting the kidney to the bladder?","opts":["Urethra","Ureter","Renal artery","Renal vein"],"ans":1},{"q":"Which mineral helps carry oxygen in red blood cells?","opts":["Calcium","Potassium","Iron","Zinc"],"ans":2},{"q":"What is the name of the process of breathing in?","opts":["Expiration","Inspiration","Respiration","Ventilation"],"ans":1},{"q":"Which gland in the neck regulates metabolism?","opts":["Pituitary","Adrenal","Thyroid","Pineal"],"ans":2},{"q":"What is the name of the protein in red blood cells that carries oxygen?","opts":["Myoglobin","Hemoglobin","Collagen","Keratin"],"ans":1},{"q":"Which part of the nervous system controls the fight or flight response?","opts":["Parasympathetic","Somatic","Sympathetic","Enteric"],"ans":2},{"q":"What is the function of the spleen?","opts":["Produce insulin","Filter blood and recycle red blood cells","Digest fat","Produce bile"],"ans":1},{"q":"Which layer of skin contains hair follicles and sweat glands?","opts":["Epidermis","Dermis","Hypodermis","Subcutis"],"ans":1},{"q":"What is the name of the joint between the skull bones?","opts":["Hinge joint","Ball and socket","Suture","Pivot joint"],"ans":2},{"q":"Which organ produces the hormone estrogen in females?","opts":["Uterus","Ovary","Pituitary","Adrenal gland"],"ans":1},{"q":"What is the medical term for the shoulder blade?","opts":["Clavicle","Scapula","Humerus","Sternum"],"ans":1},{"q":"Which part of the eye focuses light onto the retina?","opts":["Cornea","Iris","Pupil","Lens"],"ans":3},{"q":"What is the name of the tube that carries urine from the bladder out of the body?","opts":["Ureter","Urethra","Renal vein","Vas deferens"],"ans":1},{"q":"Which part of the ear converts sound vibrations into nerve signals?","opts":["Eardrum","Ossicles","Semicircular canal","Cochlea"],"ans":3}];
const BIO_MEDIUM=[{"q":"What is the name of the process by which plants make food using sunlight?","opts":["Respiration","Photosynthesis","Fermentation","Digestion"],"ans":1},{"q":"Which part of the cell is responsible for protein synthesis?","opts":["Nucleus","Mitochondria","Ribosome","Golgi body"],"ans":2},{"q":"What is the name of the hormone that regulates blood sugar levels?","opts":["Adrenaline","Glucagon","Insulin","Cortisol"],"ans":2},{"q":"Which type of muscle is found in the heart?","opts":["Skeletal","Smooth","Cardiac","Striated"],"ans":2},{"q":"What is the name of the process by which the kidney filters blood?","opts":["Dialysis","Filtration","Absorption","Secretion"],"ans":1},{"q":"Which part of the neuron receives signals from other neurons?","opts":["Axon","Dendrite","Myelin sheath","Synapse"],"ans":1},{"q":"What is the name of the fluid inside cells?","opts":["Extracellular fluid","Interstitial fluid","Cytoplasm","Plasma"],"ans":2},{"q":"Which type of immunity is present from birth?","opts":["Acquired immunity","Active immunity","Innate immunity","Passive immunity"],"ans":2},{"q":"What is the name of the enzyme that breaks down starch in saliva?","opts":["Pepsin","Lipase","Amylase","Protease"],"ans":2},{"q":"Which part of the brain regulates body temperature?","opts":["Cerebrum","Cerebellum","Hypothalamus","Thalamus"],"ans":2},{"q":"What is the name of the pigment that gives skin its color?","opts":["Keratin","Collagen","Melanin","Hemoglobin"],"ans":2},{"q":"Which type of cell division produces gametes?","opts":["Mitosis","Binary fission","Meiosis","Budding"],"ans":2},{"q":"What is the name of the protective covering of nerve fibers?","opts":["Axon","Dendrite","Myelin sheath","Synapse"],"ans":2},{"q":"Which organ produces the hormone testosterone?","opts":["Adrenal gland","Pituitary","Testes","Thyroid"],"ans":2},{"q":"What is the name of the process by which cells use oxygen to produce energy?","opts":["Photosynthesis","Fermentation","Anaerobic respiration","Aerobic respiration"],"ans":3},{"q":"Which part of the eye is responsible for color vision?","opts":["Rods","Cones","Cornea","Optic nerve"],"ans":1},{"q":"What is the name of the joint that allows rotation?","opts":["Hinge joint","Ball and socket","Pivot joint","Gliding joint"],"ans":2},{"q":"Which protein gives skin and hair their strength?","opts":["Collagen","Melanin","Keratin","Elastin"],"ans":2},{"q":"What is the name of the process by which water moves through a cell membrane?","opts":["Diffusion","Active transport","Osmosis","Filtration"],"ans":2},{"q":"Which part of the digestive system produces digestive enzymes?","opts":["Liver","Gallbladder","Pancreas","Stomach"],"ans":2},{"q":"What is the name of the hormone produced by the adrenal gland in stress?","opts":["Insulin","Melatonin","Adrenaline","Estrogen"],"ans":2},{"q":"Which type of blood vessel has the thinnest walls?","opts":["Arteries","Veins","Capillaries","Venules"],"ans":2},{"q":"What is the name of the process by which cells engulf foreign particles?","opts":["Pinocytosis","Exocytosis","Phagocytosis","Endocytosis"],"ans":2},{"q":"Which part of the cell controls what enters and exits?","opts":["Cell wall","Nucleus","Cell membrane","Cytoplasm"],"ans":2},{"q":"What is the name of the junction between two neurons?","opts":["Axon","Dendrite","Synapse","Node of Ranvier"],"ans":2},{"q":"Which organ is primarily responsible for immune function?","opts":["Liver","Spleen","Thymus","Kidney"],"ans":2},{"q":"What is the name of the protein that makes up hair and nails?","opts":["Collagen","Elastin","Keratin","Actin"],"ans":2},{"q":"Which part of the brain processes visual information?","opts":["Frontal lobe","Temporal lobe","Parietal lobe","Occipital lobe"],"ans":3},{"q":"What is the name of the chemical that transmits signals across a synapse?","opts":["Hormone","Enzyme","Neurotransmitter","Antibody"],"ans":2},{"q":"Which type of joint allows the most movement?","opts":["Hinge joint","Pivot joint","Ball and socket","Gliding joint"],"ans":2},{"q":"What is the name of the process by which the body maintains a stable internal environment?","opts":["Metabolism","Homeostasis","Regulation","Adaptation"],"ans":1},{"q":"Which part of the kidney filters blood?","opts":["Renal pelvis","Ureter","Nephron","Renal cortex"],"ans":2},{"q":"What is the name of the enzyme that breaks down proteins in the stomach?","opts":["Amylase","Lipase","Pepsin","Trypsin"],"ans":2},{"q":"Which type of muscle is found in the walls of blood vessels?","opts":["Cardiac","Skeletal","Smooth","Striated"],"ans":2},{"q":"What is the name of the process by which red blood cells are produced?","opts":["Hematopoiesis","Erythropoiesis","Leukopoiesis","Thrombopoiesis"],"ans":1},{"q":"Which part of the nervous system controls digestion automatically?","opts":["Somatic nervous system","Sympathetic nervous system","Parasympathetic nervous system","Central nervous system"],"ans":2},{"q":"What is the name of the membrane that surrounds the lungs?","opts":["Pericardium","Peritoneum","Pleura","Meninges"],"ans":2},{"q":"Which hormone is responsible for regulating calcium levels in the blood?","opts":["Insulin","Parathyroid hormone","Cortisol","Aldosterone"],"ans":1},{"q":"What is the name of the white of the eye?","opts":["Cornea","Iris","Sclera","Choroid"],"ans":2},{"q":"Which part of the tooth lies below the gum?","opts":["Crown","Enamel","Dentin","Root"],"ans":3},{"q":"What is the name of the main artery that carries blood from the heart?","opts":["Pulmonary artery","Coronary artery","Aorta","Carotid artery"],"ans":2},{"q":"Which type of cell produces antibodies?","opts":["T cells","B cells","Natural killer cells","Macrophages"],"ans":1},{"q":"What is the name of the process by which the liver breaks down alcohol?","opts":["Oxidation","Reduction","Metabolism","Detoxification"],"ans":3},{"q":"Which part of the ear is responsible for balance?","opts":["Cochlea","Eardrum","Semicircular canals","Ossicles"],"ans":2},{"q":"What is the name of the hormone that causes the fight or flight response?","opts":["Cortisol","Insulin","Adrenaline","Glucagon"],"ans":2},{"q":"Which part of the brain controls speech production?","opts":["Wernicke's area","Broca's area","Cerebellum","Thalamus"],"ans":1},{"q":"What is the name of the process by which cells make proteins?","opts":["Transcription","Translation","Replication","Mutation"],"ans":1},{"q":"Which type of immunity is gained after vaccination?","opts":["Innate immunity","Natural passive immunity","Artificial active immunity","Natural active immunity"],"ans":2},{"q":"What is the name of the main protein in connective tissue?","opts":["Keratin","Elastin","Actin","Collagen"],"ans":3},{"q":"Which part of the cell is responsible for packaging and shipping proteins?","opts":["Mitochondria","Ribosome","Golgi apparatus","Endoplasmic reticulum"],"ans":2},{"q":"What is the name of the pigment in red blood cells?","opts":["Myoglobin","Melanin","Hemoglobin","Bilirubin"],"ans":2},{"q":"Which organ is responsible for producing lymphocytes?","opts":["Liver","Spleen","Bone marrow","Thymus"],"ans":2},{"q":"What is the name of the fatty layer under the skin?","opts":["Dermis","Epidermis","Subcutaneous tissue","Periosteum"],"ans":2},{"q":"Which part of the spinal cord contains motor neurons?","opts":["Dorsal horn","Ventral horn","Central canal","White matter"],"ans":1},{"q":"What is the name of the process by which DNA is copied?","opts":["Transcription","Translation","Replication","Mutation"],"ans":2},{"q":"Which hormone stimulates the production of red blood cells?","opts":["Insulin","Erythropoietin","Thyroxine","Aldosterone"],"ans":1},{"q":"What is the name of the layer of the eye that contains blood vessels?","opts":["Retina","Sclera","Cornea","Choroid"],"ans":3},{"q":"Which part of the brain is responsible for long-term memory?","opts":["Amygdala","Hypothalamus","Hippocampus","Thalamus"],"ans":2},{"q":"What is the name of the enzyme that breaks down fat?","opts":["Amylase","Pepsin","Protease","Lipase"],"ans":3},{"q":"Which type of muscle contraction does not change muscle length?","opts":["Isotonic","Isometric","Isokinetic","Eccentric"],"ans":1},{"q":"What is the name of the process by which bones are formed?","opts":["Ossification","Calcification","Mineralization","Osteogenesis"],"ans":0},{"q":"Which part of the cell contains the genetic material?","opts":["Mitochondria","Ribosome","Nucleus","Cytoplasm"],"ans":2},{"q":"What is the name of the hormone produced by the pineal gland?","opts":["Insulin","Cortisol","Melatonin","Adrenaline"],"ans":2},{"q":"Which organ produces the hormone glucagon?","opts":["Liver","Thyroid","Adrenal gland","Pancreas"],"ans":3},{"q":"What is the name of the fluid in the inner ear?","opts":["Perilymph","Endolymph","Cerebrospinal fluid","Synovial fluid"],"ans":1},{"q":"Which type of nerve fiber transmits pain signals quickly?","opts":["A-beta fibers","C fibers","A-delta fibers","B fibers"],"ans":2},{"q":"What is the name of the protective membrane around the brain?","opts":["Pleura","Pericardium","Meninges","Peritoneum"],"ans":2},{"q":"Which part of the respiratory system warms and filters air?","opts":["Trachea","Bronchi","Nasal cavity","Larynx"],"ans":2},{"q":"What is the name of the valve between the left ventricle and aorta?","opts":["Tricuspid","Mitral","Pulmonary","Aortic"],"ans":3},{"q":"Which immune cells directly kill infected cells?","opts":["B cells","Helper T cells","Cytotoxic T cells","Macrophages"],"ans":2},{"q":"What is the name of the fingerlike projections in the small intestine?","opts":["Cilia","Microvilli","Villi","Rugae"],"ans":2},{"q":"Which part of the kidney produces urine?","opts":["Renal pelvis","Ureter","Loop of Henle","Nephron"],"ans":3},{"q":"What is the name of the process by which the body breaks down glucose without oxygen?","opts":["Aerobic respiration","Photosynthesis","Anaerobic respiration","Fermentation"],"ans":2},{"q":"Which vitamin is essential for vision in dim light?","opts":["Vitamin B","Vitamin C","Vitamin A","Vitamin E"],"ans":2},{"q":"What is the name of the joint fluid that reduces friction?","opts":["Plasma","Lymph","Synovial fluid","Interstitial fluid"],"ans":2},{"q":"Which part of the brain controls hunger and thirst?","opts":["Cerebellum","Thalamus","Hypothalamus","Amygdala"],"ans":2},{"q":"What is the name of the air sacs in the lungs?","opts":["Bronchi","Bronchioles","Alveoli","Pleura"],"ans":2},{"q":"Which hormone controls the rate of metabolism?","opts":["Insulin","Adrenaline","Thyroxine","Cortisol"],"ans":2},{"q":"What is the name of the outermost layer of the heart?","opts":["Endocardium","Myocardium","Pericardium","Epicardium"],"ans":3},{"q":"Which part of the eye adjusts to focus on near and far objects?","opts":["Cornea","Iris","Retina","Lens"],"ans":3},{"q":"What is the name of the node that initiates the heartbeat?","opts":["AV node","Bundle of His","Sinoatrial node","Purkinje fibers"],"ans":2},{"q":"Which type of cartilage is found in the ear and nose?","opts":["Hyaline cartilage","Fibrocartilage","Elastic cartilage","Articular cartilage"],"ans":2},{"q":"What is the name of the process of swallowing?","opts":["Mastication","Deglutition","Peristalsis","Absorption"],"ans":1},{"q":"Which organ stores glycogen as an energy reserve?","opts":["Kidney","Muscle and liver","Pancreas","Spleen"],"ans":1},{"q":"What is the name of the hormone that causes uterine contractions during childbirth?","opts":["Estrogen","Progesterone","Oxytocin","Prolactin"],"ans":2},{"q":"Which part of the nervous system controls the pupils?","opts":["Somatic nervous system","Sympathetic nervous system","Enteric nervous system","Central nervous system"],"ans":1},{"q":"What is the name of the bony cavity that houses the eye?","opts":["Orbit","Socket","Fossa","Sinus"],"ans":0},{"q":"Which protein in muscle is responsible for contraction?","opts":["Collagen","Keratin","Actin and myosin","Elastin"],"ans":2},{"q":"What is the name of the process by which the body absorbs nutrients into the blood?","opts":["Digestion","Absorption","Metabolism","Filtration"],"ans":1},{"q":"Which part of the brain connects the two hemispheres?","opts":["Thalamus","Corpus callosum","Cerebellum","Brain stem"],"ans":1},{"q":"What is the name of the hormone that promotes milk production?","opts":["Oxytocin","Estrogen","Prolactin","Progesterone"],"ans":2},{"q":"Which type of bone marrow produces blood cells?","opts":["Yellow marrow","Red marrow","Both types","Neither type"],"ans":1},{"q":"What is the name of the small intestine's first section?","opts":["Jejunum","Ileum","Duodenum","Cecum"],"ans":2},{"q":"Which sense organ detects changes in body position?","opts":["Eyes","Ears","Proprioceptors","Skin"],"ans":2},{"q":"What is the name of the process by which a wound heals?","opts":["Inflammation","Regeneration","Repair","Hemostasis then repair"],"ans":3},{"q":"Which part of the brain is responsible for decision making?","opts":["Occipital lobe","Parietal lobe","Temporal lobe","Prefrontal cortex"],"ans":3},{"q":"What is the name of the chemical that causes inflammation?","opts":["Antibody","Antigen","Histamine","Interferon"],"ans":2},{"q":"Which type of cell in the nervous system supports and protects neurons?","opts":["Schwann cells","Glial cells","Motor neurons","Interneurons"],"ans":1},{"q":"What is the name of the process by which a fertilized egg implants in the uterus?","opts":["Fertilization","Implantation","Gestation","Ovulation"],"ans":1},{"q":"What is the name of the valve that prevents backflow from the aorta into the left ventricle?","opts":["Mitral valve","Tricuspid valve","Pulmonary valve","Aortic valve"],"ans":3},{"q":"What is the name of the process by which plants lose water through their leaves?","opts":["Transpiration","Evaporation","Respiration","Absorption"],"ans":0},{"q":"Which organelle is responsible for photosynthesis in plant cells?","opts":["Mitochondria","Ribosome","Chloroplast","Vacuole"],"ans":2},{"q":"What is the name of the sugar produced during photosynthesis?","opts":["Fructose","Sucrose","Glucose","Lactose"],"ans":2},{"q":"Which gas do plants absorb during photosynthesis?","opts":["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"],"ans":2},{"q":"What is the name of the green pigment in plants?","opts":["Melanin","Chlorophyll","Carotene","Xanthophyll"],"ans":1},{"q":"Which part of the plant absorbs water from the soil?","opts":["Stem","Leaves","Flowers","Roots"],"ans":3},{"q":"What is the name of the tiny pores on leaves through which gases exchange?","opts":["Stomata","Lenticels","Guard cells","Vascular bundles"],"ans":0},{"q":"Which kingdom do mushrooms belong to?","opts":["Plantae","Animalia","Protista","Fungi"],"ans":3},{"q":"What is the name of the male reproductive part of a flower?","opts":["Pistil","Carpel","Stamen","Sepal"],"ans":2},{"q":"Which part of the flower becomes the fruit?","opts":["Sepal","Petal","Stamen","Ovary"],"ans":3},{"q":"What is the name of the female reproductive part of a flower?","opts":["Stamen","Anther","Pistil","Filament"],"ans":2},{"q":"Which type of reproduction involves only one parent?","opts":["Sexual","Asexual","Binary fission","Budding"],"ans":1},{"q":"What is the name of the process by which seeds germinate?","opts":["Pollination","Fertilization","Germination","Dispersal"],"ans":2},{"q":"Which vitamin is found in citrus fruits?","opts":["Vitamin A","Vitamin B","Vitamin C","Vitamin D"],"ans":2},{"q":"What is the name of the tissue that transports water in plants?","opts":["Phloem","Cambium","Xylem","Epidermis"],"ans":2},{"q":"Which tissue transports food in plants?","opts":["Xylem","Cambium","Epidermis","Phloem"],"ans":3},{"q":"What is the name of the process where fungi break down dead matter?","opts":["Photosynthesis","Decomposition","Respiration","Fermentation"],"ans":1},{"q":"Which animal group has a backbone?","opts":["Invertebrates","Arthropods","Vertebrates","Molluscs"],"ans":2},{"q":"What is the name of the process by which caterpillars change into butterflies?","opts":["Metamorphosis","Evolution","Adaptation","Mutation"],"ans":0},{"q":"Which type of animal is cold-blooded?","opts":["Mammals","Birds","Reptiles","All of these"],"ans":2},{"q":"What is the name of the largest land animal?","opts":["Giraffe","Rhinoceros","Hippopotamus","African elephant"],"ans":3},{"q":"Which bird cannot fly?","opts":["Eagle","Parrot","Penguin","Sparrow"],"ans":2},{"q":"What is the name of the hardest part of a tooth?","opts":["Dentin","Pulp","Enamel","Cementum"],"ans":2},{"q":"Which part of the plant cell is not found in animal cells?","opts":["Nucleus","Cell wall","Mitochondria","Ribosome"],"ans":1},{"q":"What is the name of the large vacuole found in plant cells?","opts":["Lysosome","Central vacuole","Plastid","Tonoplast"],"ans":1},{"q":"Which process releases energy from glucose in cells?","opts":["Photosynthesis","Transpiration","Cellular respiration","Fermentation"],"ans":2},{"q":"What is the name of the sugar found in milk?","opts":["Glucose","Fructose","Sucrose","Lactose"],"ans":3},{"q":"Which organ in the body produces bile?","opts":["Kidney","Gallbladder","Pancreas","Liver"],"ans":3},{"q":"What is the name of the longest part of the digestive system?","opts":["Stomach","Large intestine","Esophagus","Small intestine"],"ans":3},{"q":"Which blood type is considered the universal recipient?","opts":["A","B","O","AB"],"ans":3},{"q":"What is the name of the protein that gives hair its color?","opts":["Keratin","Collagen","Melanin","Elastin"],"ans":2},{"q":"Which organ controls the body's water balance?","opts":["Liver","Heart","Lung","Kidney"],"ans":3},{"q":"What is the name of the fluid that lubricates joints?","opts":["Plasma","Lymph","Synovial fluid","Cerebrospinal fluid"],"ans":2},{"q":"Which part of the eye is responsible for color detection?","opts":["Rods","Cones","Cornea","Iris"],"ans":1},{"q":"What is the name of the smallest unit of life?","opts":["Tissue","Organ","Cell","Molecule"],"ans":2},{"q":"Which gas is released during photosynthesis?","opts":["Carbon dioxide","Nitrogen","Hydrogen","Oxygen"],"ans":3},{"q":"What is the name of the blood vessel that carries blood to the lungs?","opts":["Aorta","Pulmonary artery","Coronary artery","Carotid artery"],"ans":1},{"q":"Which mineral is essential for making hemoglobin?","opts":["Calcium","Iron","Potassium","Zinc"],"ans":1},{"q":"What is the name of the process by which organisms produce offspring?","opts":["Respiration","Reproduction","Metabolism","Excretion"],"ans":1},{"q":"Which part of the brain controls voluntary movements?","opts":["Cerebellum","Brain stem","Cerebrum","Hypothalamus"],"ans":2},{"q":"What is the name of the network of nerves outside the brain and spinal cord?","opts":["Central nervous system","Autonomic nervous system","Peripheral nervous system","Somatic nervous system"],"ans":2},{"q":"Which organ produces the hormone thyroxine?","opts":["Pituitary gland","Adrenal gland","Thyroid gland","Pancreas"],"ans":2},{"q":"What is the name of the process by which food is broken down into nutrients?","opts":["Absorption","Digestion","Excretion","Metabolism"],"ans":1},{"q":"Which type of muscle is under voluntary control?","opts":["Cardiac muscle","Smooth muscle","Skeletal muscle","Involuntary muscle"],"ans":2},{"q":"What is the name of the largest gland in the human body?","opts":["Pancreas","Thyroid","Liver","Spleen"],"ans":2},{"q":"Which cell type is responsible for the immune memory?","opts":["Red blood cells","Platelets","Memory lymphocytes","Neutrophils"],"ans":2},{"q":"What is the name of the condition where blood sugar is too high?","opts":["Hypoglycemia","Hypertension","Hyperglycemia","Hypothyroidism"],"ans":2},{"q":"Which vitamin helps in blood clotting?","opts":["Vitamin A","Vitamin C","Vitamin E","Vitamin K"],"ans":3},{"q":"What is the name of the tough fibrous tissue covering bones?","opts":["Endosteum","Cartilage","Periosteum","Ligament"],"ans":2},{"q":"Which part of the neuron carries impulses away from the cell body?","opts":["Dendrite","Axon","Myelin sheath","Synapse"],"ans":1}];
const BIO_HARD=[{"q":"What is the name of the enzyme that unwinds DNA during replication?","opts":["DNA polymerase","RNA polymerase","Helicase","Ligase"],"ans":2},{"q":"Which part of the sarcomere shortens during muscle contraction?","opts":["A band","I band","H zone","M line"],"ans":1},{"q":"What is the name of the process by which mRNA is made from DNA?","opts":["Translation","Replication","Transcription","Splicing"],"ans":2},{"q":"Which type of hypersensitivity reaction involves IgE antibodies?","opts":["Type II","Type III","Type I","Type IV"],"ans":2},{"q":"What is the name of the gap between the myelin sheaths on a nerve fiber?","opts":["Synapse","Node of Ranvier","Axon hillock","Schwann cell"],"ans":1},{"q":"Which complement pathway is activated by antibody-antigen complexes?","opts":["Alternative pathway","Lectin pathway","Classical pathway","Terminal pathway"],"ans":2},{"q":"What is the name of the enzyme that joins Okazaki fragments during DNA replication?","opts":["Helicase","DNA polymerase","Primase","DNA ligase"],"ans":3},{"q":"Which part of the nephron reabsorbs the most water?","opts":["Loop of Henle","Proximal convoluted tubule","Distal convoluted tubule","Collecting duct"],"ans":1},{"q":"What is the name of the process by which tRNA brings amino acids to the ribosome?","opts":["Transcription","Replication","Translation","Splicing"],"ans":2},{"q":"Which ion is primarily responsible for the resting membrane potential?","opts":["Sodium","Calcium","Chloride","Potassium"],"ans":3},{"q":"What is the name of the protein complex that degrades misfolded proteins?","opts":["Lysosome","Ribosome","Proteasome","Peroxisome"],"ans":2},{"q":"Which type of collagen is found in hyaline cartilage?","opts":["Type I","Type II","Type III","Type IV"],"ans":1},{"q":"What is the name of the process by which neurons increase their sensitivity?","opts":["Habituation","Sensitization","Potentiation","Facilitation"],"ans":1},{"q":"Which enzyme converts angiotensin I to angiotensin II?","opts":["Renin","ACE","Aldosterone","Vasopressin"],"ans":1},{"q":"What is the name of the lipid bilayer component that regulates membrane fluidity?","opts":["Phospholipid","Cholesterol","Glycolipid","Protein"],"ans":1},{"q":"Which cells in the retina are responsible for night vision?","opts":["Cones","Rods","Bipolar cells","Ganglion cells"],"ans":1},{"q":"What is the name of the mechanism by which glucose enters cells without energy?","opts":["Active transport","Facilitated diffusion","Simple diffusion","Endocytosis"],"ans":1},{"q":"Which part of the cell cycle involves DNA replication?","opts":["G1 phase","S phase","G2 phase","M phase"],"ans":1},{"q":"What is the name of the specialized junction between heart muscle cells?","opts":["Tight junction","Gap junction","Desmosome","Intercalated disc"],"ans":3},{"q":"Which enzyme converts pyruvate to acetyl-CoA?","opts":["Pyruvate kinase","Pyruvate dehydrogenase","Lactate dehydrogenase","Phosphofructokinase"],"ans":1},{"q":"What is the name of the process by which bone remodels itself?","opts":["Ossification","Calcification","Osteoclast-osteoblast cycle","Mineralization"],"ans":2},{"q":"Which hormone inhibits the release of growth hormone?","opts":["GHRH","Somatostatin","IGF-1","Ghrelin"],"ans":1},{"q":"What is the name of the layer of the retina that contains photoreceptors?","opts":["Inner nuclear layer","Outer nuclear layer","Ganglion cell layer","Photoreceptor layer"],"ans":3},{"q":"Which part of the kidney produces erythropoietin?","opts":["Glomerulus","Proximal tubule","Peritubular capillaries","Interstitial cells"],"ans":3},{"q":"What is the name of the protein that regulates the cell cycle?","opts":["Actin","Cyclin","Tubulin","Laminin"],"ans":1},{"q":"Which type of receptor detects muscle stretch?","opts":["Golgi tendon organ","Muscle spindle","Free nerve ending","Meissner's corpuscle"],"ans":1},{"q":"What is the name of the process by which cells take in large particles?","opts":["Pinocytosis","Receptor-mediated endocytosis","Phagocytosis","Exocytosis"],"ans":2},{"q":"Which cytokine is primarily responsible for fever?","opts":["IL-4","IL-10","IL-1","IL-6"],"ans":2},{"q":"What is the name of the enzyme that synthesizes ATP in mitochondria?","opts":["ATPase","ATP synthase","Cytochrome c","NADH dehydrogenase"],"ans":1},{"q":"Which part of the brain is responsible for procedural memory?","opts":["Hippocampus","Amygdala","Basal ganglia","Cerebellum"],"ans":3},{"q":"What is the name of the process by which genetic information flows from DNA to protein?","opts":["Replication","Central dogma","Mutation","Epigenetics"],"ans":1},{"q":"Which type of hypoxia occurs when blood flow is reduced?","opts":["Hypoxic hypoxia","Anemic hypoxia","Stagnant hypoxia","Histotoxic hypoxia"],"ans":2},{"q":"What is the name of the protein that anchors the cytoskeleton to the cell membrane?","opts":["Spectrin","Ankyrin","Dystrophin","Talin"],"ans":1},{"q":"Which ion channel opens during the upstroke of an action potential?","opts":["Potassium","Calcium","Sodium","Chloride"],"ans":2},{"q":"What is the name of the process by which the immune system learns to tolerate self-antigens?","opts":["Clonal selection","Clonal deletion","Clonal expansion","Somatic mutation"],"ans":1},{"q":"Which enzyme is deficient in phenylketonuria?","opts":["Tyrosinase","Phenylalanine hydroxylase","Homogentisate oxidase","Fumarylacetoacetase"],"ans":1},{"q":"What is the name of the specialized capillaries in the kidney?","opts":["Sinusoids","Fenestrated capillaries","Glomerulus","Vasa recta"],"ans":2},{"q":"Which protein forms the thick filament in muscle?","opts":["Actin","Troponin","Tropomyosin","Myosin"],"ans":3},{"q":"What is the name of the membrane potential at which an action potential is triggered?","opts":["Resting potential","Threshold potential","Equilibrium potential","Reversal potential"],"ans":1},{"q":"Which part of the adrenal gland produces cortisol?","opts":["Adrenal medulla","Zona glomerulosa","Zona fasciculata","Zona reticularis"],"ans":2},{"q":"What is the name of the process by which T cells mature?","opts":["B cell maturation","Thymic education","Clonal selection","Somatic hypermutation"],"ans":1},{"q":"Which receptor type mediates the slow depolarizing effect of acetylcholine?","opts":["Nicotinic receptor","GABA receptor","Muscarinic receptor","NMDA receptor"],"ans":2},{"q":"What is the name of the process by which stem cells differentiate?","opts":["Proliferation","Differentiation","Apoptosis","Senescence"],"ans":1},{"q":"Which molecule acts as the final electron acceptor in oxidative phosphorylation?","opts":["NAD+","FAD","Oxygen","Carbon dioxide"],"ans":2},{"q":"What is the name of the protective protein that coats viruses?","opts":["Capsule","Capsid","Envelope","Pili"],"ans":1},{"q":"Which part of the neuromuscular junction releases acetylcholine?","opts":["Motor end plate","Synaptic cleft","Presynaptic terminal","Postsynaptic membrane"],"ans":2},{"q":"What is the name of the enzyme that repairs DNA mismatches?","opts":["DNA polymerase","Helicase","Mismatch repair enzyme","Topoisomerase"],"ans":2},{"q":"Which hormone is released by the posterior pituitary?","opts":["Growth hormone","FSH","ADH and oxytocin","TSH"],"ans":2},{"q":"What is the name of the process by which cells undergo programmed death?","opts":["Necrosis","Autophagy","Apoptosis","Senescence"],"ans":2},{"q":"Which part of the immune system provides the first line of cellular defense?","opts":["B cells","Helper T cells","Natural killer cells","Cytotoxic T cells"],"ans":2},{"q":"What is the name of the specialized region of the axon where action potentials are initiated?","opts":["Axon terminal","Dendrite","Axon hillock","Node of Ranvier"],"ans":2},{"q":"Which enzyme converts fibrinogen to fibrin during clotting?","opts":["Plasmin","Thrombin","Factor X","Prothrombin"],"ans":1},{"q":"What is the name of the mechanism that prevents the immune system from attacking self-tissues?","opts":["Immune suppression","Self-tolerance","Passive immunity","Clonal anergy"],"ans":1},{"q":"Which part of the brain integrates sensory information and relays it to the cortex?","opts":["Hypothalamus","Cerebellum","Thalamus","Basal ganglia"],"ans":2},{"q":"What is the name of the process by which excess glucose is stored as glycogen?","opts":["Glycolysis","Gluconeogenesis","Glycogenolysis","Glycogenesis"],"ans":3},{"q":"Which type of receptor is involved in long-term potentiation?","opts":["AMPA receptor","GABA receptor","NMDA receptor","Nicotinic receptor"],"ans":2},{"q":"What is the name of the specialized endothelium of brain capillaries?","opts":["Glomerulus","Blood-brain barrier","Choroid plexus","Arachnoid mater"],"ans":1},{"q":"Which molecule carries electrons in the electron transport chain?","opts":["ATP","ADP","NADH","Acetyl-CoA"],"ans":2},{"q":"What is the name of the process by which proteins are targeted to lysosomes?","opts":["Signal peptide targeting","Mannose-6-phosphate pathway","Ubiquitin-proteasome pathway","Autophagy"],"ans":1},{"q":"Which hormone stimulates the secretion of cortisol?","opts":["TSH","FSH","ACTH","LH"],"ans":2},{"q":"What is the name of the enzyme responsible for RNA synthesis?","opts":["DNA polymerase","Helicase","RNA polymerase","Ligase"],"ans":2},{"q":"Which type of muscle fiber has high mitochondrial content and is resistant to fatigue?","opts":["Type IIb","Type IIa","Type I","Type IIx"],"ans":2},{"q":"What is the name of the protein that binds oxygen in muscle cells?","opts":["Hemoglobin","Myoglobin","Transferrin","Ferritin"],"ans":1},{"q":"Which part of the kidney regulates sodium reabsorption under aldosterone?","opts":["Proximal convoluted tubule","Loop of Henle","Distal convoluted tubule","Glomerulus"],"ans":2},{"q":"What is the name of the process by which the immune system generates diversity in antibodies?","opts":["Clonal selection","VDJ recombination","Somatic hypermutation","Class switching"],"ans":1},{"q":"Which enzyme breaks down the neurotransmitter acetylcholine in the synapse?","opts":["Monoamine oxidase","Acetylcholinesterase","Catechol-O-methyltransferase","Cholinesterase"],"ans":1},{"q":"What is the name of the process by which cells respond to extracellular signals?","opts":["Signal transduction","Gene expression","Protein synthesis","Membrane transport"],"ans":0},{"q":"Which part of the chromosome contains the centromere?","opts":["Telomere","Chromatid","Primary constriction","Satellite"],"ans":2},{"q":"What is the name of the hormone that promotes sodium retention in the kidneys?","opts":["ADH","Cortisol","Aldosterone","Atrial natriuretic peptide"],"ans":2},{"q":"Which type of RNA carries genetic information from DNA to the ribosome?","opts":["tRNA","rRNA","mRNA","snRNA"],"ans":2},{"q":"What is the name of the process by which the gut microbiome influences immunity?","opts":["Dysbiosis","Microbiome-immune axis","Colonization resistance","Mucosal immunity"],"ans":1},{"q":"Which cells in the liver are responsible for detoxification?","opts":["Kupffer cells","Stellate cells","Hepatocytes","Sinusoidal cells"],"ans":2},{"q":"What is the name of the protein complex that reads mRNA and synthesizes proteins?","opts":["Spliceosome","Proteasome","Ribosome","Centrosome"],"ans":2},{"q":"Which part of the autonomic nervous system uses norepinephrine as its primary neurotransmitter?","opts":["Parasympathetic","Enteric","Somatic","Sympathetic"],"ans":3},{"q":"What is the name of the process by which cells regulate gene expression through DNA methylation?","opts":["Mutation","Epigenetics","Transcription","Translation"],"ans":1},{"q":"Which receptor type is responsible for detecting high-threshold mechanical stimuli?","opts":["Meissner's corpuscle","Pacinian corpuscle","Nociceptor","Ruffini ending"],"ans":2},{"q":"What is the name of the hormone that opposes insulin's effects?","opts":["Cortisol","Aldosterone","Glucagon","Epinephrine"],"ans":2},{"q":"Which part of the brain is responsible for regulating circadian rhythms?","opts":["Pineal gland","Suprachiasmatic nucleus","Hypothalamus","Amygdala"],"ans":1},{"q":"What is the name of the enzyme that removes RNA primers during DNA replication?","opts":["DNA polymerase I","DNA polymerase III","RNase H","Helicase"],"ans":0},{"q":"Which molecule is the primary energy currency of the cell?","opts":["NADH","FADH2","ATP","GTP"],"ans":2},{"q":"What is the name of the process by which mature mRNA is processed from pre-mRNA?","opts":["Transcription","RNA splicing","Translation","Polyadenylation"],"ans":1},{"q":"Which type of immunity is transferred from mother to child through breast milk?","opts":["Active immunity","Natural active immunity","Passive immunity","Artificial immunity"],"ans":2},{"q":"What is the name of the protein that forms the nuclear pore complex?","opts":["Lamin","Nucleoporin","Histone","Chromatin"],"ans":1},{"q":"Which part of the brain mediates the emotional response to fear?","opts":["Hippocampus","Thalamus","Amygdala","Prefrontal cortex"],"ans":2},{"q":"What is the name of the process by which cells move along a chemical gradient?","opts":["Chemotaxis","Phototaxis","Osmosis","Diffusion"],"ans":0},{"q":"Which enzyme catalyzes the first step of glycolysis?","opts":["Phosphofructokinase","Aldolase","Hexokinase","Pyruvate kinase"],"ans":2},{"q":"What is the name of the specialized cell junction that prevents leakage between epithelial cells?","opts":["Gap junction","Desmosome","Tight junction","Adherens junction"],"ans":2},{"q":"Which part of the immune system is responsible for immunological memory?","opts":["Innate immunity","Natural killer cells","Memory B and T cells","Complement system"],"ans":2},{"q":"What is the name of the process by which the heart muscle is electrically stimulated?","opts":["Automaticity","Excitation-contraction coupling","Depolarization","Action potential propagation"],"ans":1},{"q":"Which protein forms the thin filament in muscle and regulates contraction?","opts":["Myosin","Titin","Actin","Nebulin"],"ans":2},{"q":"What is the name of the hormone that regulates water reabsorption in the kidney?","opts":["Aldosterone","Cortisol","ANP","ADH"],"ans":3},{"q":"Which enzyme is responsible for adding telomeric DNA to chromosomes?","opts":["DNA polymerase","Helicase","Telomerase","Ligase"],"ans":2},{"q":"What is the name of the specialized cells in the liver that phagocytose pathogens?","opts":["Hepatocytes","Stellate cells","Kupffer cells","Cholangiocytes"],"ans":2},{"q":"Which part of the cell cycle is paused at the G1 checkpoint if DNA is damaged?","opts":["S phase","G2 phase","M phase","G1 phase"],"ans":3},{"q":"What is the name of the process by which nerve cells regenerate after injury in the peripheral nervous system?","opts":["Wallerian degeneration","Axon sprouting","Peripheral nerve regeneration","Schwann cell proliferation"],"ans":2},{"q":"Which type of receptor detects temperature changes in the skin?","opts":["Mechanoreceptor","Photoreceptor","Nociceptor","Thermoreceptor"],"ans":3},{"q":"What is the name of the protein that acts as the molecular motor in cilia and flagella?","opts":["Myosin","Kinesin","Dynein","Actin"],"ans":2},{"q":"Which part of the immune complement system forms the membrane attack complex?","opts":["C3","C4","C1","C5-C9"],"ans":3},{"q":"What is the name of the process by which cholesterol is synthesized in the liver?","opts":["Beta-oxidation","Lipogenesis","Cholesterol synthesis","Mevalonate pathway"],"ans":3},{"q":"Which hormone from the hypothalamus stimulates the release of FSH and LH?","opts":["TRH","CRH","GnRH","GHRH"],"ans":2},{"q":"What is the name of the specialized receptor that detects blood oxygen levels?","opts":["Baroreceptor","Osmoreceptor","Chemoreceptor","Proprioceptor"],"ans":2},{"q":"Which enzyme is deficient in Tay-Sachs disease?","opts":["Glucocerebrosidase","Hexosaminidase A","Sphingomyelinase","Alpha-galactosidase"],"ans":1},{"q":"What is the name of the process by which differentiated cells revert to a stem cell state?","opts":["Dedifferentiation","Transdifferentiation","Reprogramming","Metaplasia"],"ans":2},{"q":"Which part of the kidney has the highest osmolarity?","opts":["Cortex","Outer medulla","Inner medulla","Glomerulus"],"ans":2},{"q":"What is the name of the protein that regulates the opening of ion channels by binding to second messengers?","opts":["Ligand-gated channel","Voltage-gated channel","G protein-coupled receptor","Cyclic nucleotide-gated channel"],"ans":3},{"q":"Which type of leukocyte releases histamine during allergic reactions?","opts":["Neutrophil","Eosinophil","Basophil","Monocyte"],"ans":2},{"q":"What is the name of the process by which a gene is silenced by small RNA molecules?","opts":["Methylation","RNA interference","Acetylation","Alternative splicing"],"ans":1},{"q":"Which part of the sarcomere remains constant in length during muscle contraction?","opts":["I band","H zone","A band","Sarcomere length"],"ans":2},{"q":"What is the name of the enzyme that catalyzes the conversion of carbon dioxide and water to carbonic acid in red blood cells?","opts":["Carbonic anhydrase","Catalase","Carbonicase","Carboxy transferase"],"ans":0},{"q":"Which receptor type mediates the inhibitory effects of GABA in the brain?","opts":["NMDA receptor","AMPA receptor","GABA-A receptor","Muscarinic receptor"],"ans":2},{"q":"What is the name of the specialized structure that anchors the spindle fibers to chromosomes during cell division?","opts":["Centromere","Kinetochore","Centriole","Telomere"],"ans":1},{"q":"Which molecule acts as the universal amino group donor in transamination reactions?","opts":["Glutamate","Aspartate","Alanine","Glutamine"],"ans":0},{"q":"What is the name of the process by which macrophages present antigens to T cells?","opts":["Phagocytosis","Antigen presentation","Clonal selection","Opsonization"],"ans":1},{"q":"Which part of the respiratory chain accepts electrons from both NADH and FADH2?","opts":["Complex I","Complex II","Coenzyme Q","Complex III"],"ans":2},{"q":"What is the name of the hormone that inhibits gastric acid secretion?","opts":["Gastrin","Secretin","Cholecystokinin","Somatostatin"],"ans":3},{"q":"Which enzyme removes supercoils ahead of the replication fork?","opts":["Helicase","DNA gyrase","Primase","Ligase"],"ans":1},{"q":"What is the name of the specialized cell that produces myelin in the central nervous system?","opts":["Schwann cell","Astrocyte","Oligodendrocyte","Microglia"],"ans":2},{"q":"Which type of feedback mechanism regulates most hormone levels in the body?","opts":["Positive feedback","Negative feedback","Neural feedback","Paracrine feedback"],"ans":1},{"q":"What is the name of the process by which the liver converts amino acids to glucose?","opts":["Glycogenolysis","Glycogenesis","Gluconeogenesis","Glycolysis"],"ans":2},{"q":"Which part of the immune system is responsible for producing large quantities of antibodies rapidly?","opts":["Memory B cells","Plasma cells","Helper T cells","Dendritic cells"],"ans":1},{"q":"What is the name of the protein that protects telomeres from degradation?","opts":["Histone","Shelterin","Cohesin","Condensin"],"ans":1},{"q":"Which enzyme catalyzes the rate-limiting step of the citric acid cycle?","opts":["Citrate synthase","Isocitrate dehydrogenase","Alpha-ketoglutarate dehydrogenase","Succinate dehydrogenase"],"ans":1},{"q":"What is the name of the process by which a single stem cell gives rise to all blood cell types?","opts":["Erythropoiesis","Leukopoiesis","Hematopoiesis","Thrombopoiesis"],"ans":2},{"q":"Which part of the neuron is covered by the myelin sheath?","opts":["Cell body","Dendrites","Axon","Axon terminal"],"ans":2},{"q":"What is the name of the immune cell that bridges innate and adaptive immunity?","opts":["Macrophage","Natural killer cell","Dendritic cell","Neutrophil"],"ans":2},{"q":"Which molecule is the immediate precursor to ATP in oxidative phosphorylation?","opts":["NADH","ADP","Acetyl-CoA","Pyruvate"],"ans":1},{"q":"What is the name of the specialized junction that allows electrical coupling between heart cells?","opts":["Tight junction","Desmosome","Gap junction","Adherens junction"],"ans":2},{"q":"Which part of the kidney is impermeable to water in the absence of ADH?","opts":["Proximal convoluted tubule","Descending loop of Henle","Ascending loop of Henle","Collecting duct"],"ans":3},{"q":"What is the name of the process by which a virus enters a host cell?","opts":["Replication","Transcription","Viral entry","Budding"],"ans":2},{"q":"Which type of RNA molecule has enzymatic activity?","opts":["mRNA","tRNA","rRNA","Ribozyme"],"ans":3},{"q":"What is the name of the protein complex that condenses chromatin during cell division?","opts":["Cohesin","Condensin","Shelterin","Nucleosome"],"ans":1},{"q":"Which part of the immune system forms the mucosal barrier against pathogens?","opts":["IgG","IgM","IgA","IgE"],"ans":2},{"q":"What is the name of the process by which red blood cells are broken down?","opts":["Erythropoiesis","Hemolysis","Hematopoiesis","Lysis"],"ans":1},{"q":"Which enzyme is responsible for the final step of cholesterol synthesis?","opts":["HMG-CoA reductase","Squalene synthase","Lanosterol synthase","7-dehydrocholesterol reductase"],"ans":3},{"q":"What is the name of the specialized receptor on T cells that recognizes antigens?","opts":["B cell receptor","Toll-like receptor","T cell receptor","Fc receptor"],"ans":2},{"q":"Which part of the mitochondria is the site of oxidative phosphorylation?","opts":["Outer membrane","Intermembrane space","Inner membrane","Matrix"],"ans":2},{"q":"What is the name of the process by which inactive pro-enzymes are activated?","opts":["Denaturation","Zymogen activation","Allosteric regulation","Competitive inhibition"],"ans":1},{"q":"Which molecule acts as a cofactor for carboxylation reactions?","opts":["Thiamine","Riboflavin","Biotin","Niacin"],"ans":2},{"q":"What is the name of the type of mutation that changes one amino acid to another?","opts":["Frameshift","Nonsense","Silent","Missense"],"ans":3},{"q":"Which part of the brain contains the reward center?","opts":["Amygdala","Hippocampus","Nucleus accumbens","Thalamus"],"ans":2},{"q":"What is the name of the process by which the liver converts ammonia to urea?","opts":["Krebs cycle","Urea cycle","Beta-oxidation","Gluconeogenesis"],"ans":1},{"q":"Which enzyme is responsible for the initial step of fatty acid oxidation?","opts":["Fatty acid synthase","Acyl-CoA dehydrogenase","Thiolase","Enoyl-CoA hydratase"],"ans":1},{"q":"What is the name of the membrane receptor that binds growth factors?","opts":["G protein-coupled receptor","Nuclear receptor","Ion channel","Receptor tyrosine kinase"],"ans":3},{"q":"Which part of the complement system marks pathogens for phagocytosis?","opts":["C1q","C3b","C5a","MAC"],"ans":1},{"q":"Which transcription factor is known as the master regulator of adipogenesis?","opts":["MyoD","GATA-1","PPAR\u03b3","Myf5"],"ans":2},{"q":"What is the name of the enzyme that catalyzes the first committed step of cholesterol biosynthesis?","opts":["Squalene synthase","HMG-CoA reductase","Acetyl-CoA carboxylase","Fatty acid synthase"],"ans":1},{"q":"Which signaling pathway is activated by the binding of Wnt to Frizzled receptors?","opts":["MAPK pathway","JAK-STAT pathway","PI3K-Akt pathway","Beta-catenin pathway"],"ans":3},{"q":"What is the name of the specialized macrophage found in the brain?","opts":["Kupffer cell","Langerhans cell","Osteoclast","Microglia"],"ans":3},{"q":"Which enzyme catalyzes the conversion of homocysteine to methionine?","opts":["Cystathionine synthase","Methionine synthase","MTHFR","Transcobalamin"],"ans":1},{"q":"What is the name of the protein complex that anchors integrin to the actin cytoskeleton?","opts":["Talin-vinculin complex","Spectrin-ankyrin","Dystrophin complex","Ezrin-radixin-moesin"],"ans":0},{"q":"What is the name of the protein that forms the structure of hair?","opts":["Collagen","Elastin","Melanin","Keratin"],"ans":3},{"q":"Which type of blood vessel returns blood to the heart?","opts":["Arteries","Capillaries","Venules","Veins"],"ans":3},{"q":"What is the name of the enzyme in saliva that begins starch digestion?","opts":["Pepsin","Lipase","Amylase","Protease"],"ans":2},{"q":"Which part of the brain regulates hunger and satiety?","opts":["Cerebellum","Thalamus","Amygdala","Hypothalamus"],"ans":3},{"q":"What is the name of the fatty substance that forms the myelin sheath?","opts":["Cholesterol","Keratin","Myelin","Lecithin"],"ans":2},{"q":"Which organ is most affected by cirrhosis?","opts":["Kidney","Lung","Heart","Liver"],"ans":3},{"q":"What is the name of the process by which plants convert light energy to chemical energy?","opts":["Respiration","Transpiration","Photosynthesis","Fermentation"],"ans":2},{"q":"Which part of the immune system produces antibodies?","opts":["T lymphocytes","Natural killer cells","B lymphocytes","Macrophages"],"ans":2},{"q":"What is the name of the protective covering of the eye?","opts":["Iris","Sclera","Cornea","Conjunctiva"],"ans":3},{"q":"Which gland is located at the base of the brain?","opts":["Thyroid","Adrenal","Pituitary","Pineal"],"ans":2},{"q":"What is the name of the process of removing metabolic waste from the body?","opts":["Digestion","Absorption","Excretion","Secretion"],"ans":2},{"q":"Which part of the cell contains the genetic information?","opts":["Cytoplasm","Cell membrane","Nucleus","Mitochondria"],"ans":2},{"q":"What is the name of the hormone that regulates the menstrual cycle?","opts":["Insulin","Thyroxine","Estrogen","Adrenaline"],"ans":2},{"q":"Which organ converts ammonia to urea?","opts":["Kidney","Spleen","Pancreas","Liver"],"ans":3},{"q":"What is the name of the basic structural unit of the nervous system?","opts":["Nephron","Neuron","Sarcomere","Axon"],"ans":1},{"q":"Which vitamin deficiency causes night blindness?","opts":["Vitamin B","Vitamin C","Vitamin A","Vitamin D"],"ans":2},{"q":"What is the name of the process by which water enters plant roots?","opts":["Transpiration","Translocation","Osmosis","Diffusion"],"ans":2},{"q":"Which part of the blood plasma contains antibodies?","opts":["Albumin","Fibrinogen","Globulin","Transferrin"],"ans":2},{"q":"What is the name of the fluid found inside the eye?","opts":["Synovial fluid","Aqueous humor","Cerebrospinal fluid","Vitreous humor"],"ans":1},{"q":"Which organ is primarily responsible for detoxifying drugs?","opts":["Kidney","Spleen","Liver","Lung"],"ans":2},{"q":"What is the name of the protein that carries oxygen in muscle cells?","opts":["Hemoglobin","Transferrin","Myoglobin","Ferritin"],"ans":2},{"q":"Which type of cell division produces sex cells?","opts":["Mitosis","Binary fission","Meiosis","Budding"],"ans":2},{"q":"What is the name of the chemical messenger that travels through the bloodstream?","opts":["Neurotransmitter","Enzyme","Hormone","Antibody"],"ans":2},{"q":"Which part of the human ear converts vibrations to nerve signals?","opts":["Eardrum","Semicircular canal","Ossicles","Cochlea"],"ans":3},{"q":"What is the name of the genetic material found in all living cells?","opts":["RNA","ATP","DNA","ADP"],"ans":2},{"q":"Which organ regulates body temperature?","opts":["Liver","Heart","Brain","Kidney"],"ans":2},{"q":"What is the name of the fluid that fills the space between cells?","opts":["Plasma","Lymph","Interstitial fluid","Cytoplasm"],"ans":2},{"q":"Which type of organism can make its own food?","opts":["Heterotroph","Consumer","Autotroph","Decomposer"],"ans":2},{"q":"What is the name of the watery fluid that surrounds the fetus?","opts":["Plasma","Lymph","Amniotic fluid","Cerebrospinal fluid"],"ans":2},{"q":"Which part of the skin contains melanocytes?","opts":["Hypodermis","Dermis","Both layers","Epidermis"],"ans":3},{"q":"What is the name of the process by which bacteria cause infection?","opts":["Mutation","Pathogenesis","Adaptation","Fermentation"],"ans":1},{"q":"Which organ in the body has the highest regenerative capacity?","opts":["Heart","Brain","Kidney","Liver"],"ans":3},{"q":"What is the name of the protective protein coat of a virus?","opts":["Cell wall","Capsid","Envelope","Flagella"],"ans":1},{"q":"Which structure connects the two hemispheres of the brain?","opts":["Thalamus","Corpus callosum","Brain stem","Cerebellum"],"ans":1},{"q":"What is the name of the process where DNA makes a copy of itself?","opts":["Transcription","Translation","Replication","Mutation"],"ans":2},{"q":"Which part of the digestive system is responsible for absorbing water?","opts":["Small intestine","Stomach","Esophagus","Large intestine"],"ans":3},{"q":"What is the name of the hormone that promotes milk production after childbirth?","opts":["Estrogen","Oxytocin","Progesterone","Prolactin"],"ans":3},{"q":"Which blood component is responsible for oxygen transport?","opts":["Plasma","Platelets","White blood cells","Red blood cells"],"ans":3},{"q":"What is the name of the tissue that lines the inside of the heart?","opts":["Myocardium","Pericardium","Endocardium","Epicardium"],"ans":2},{"q":"Which vitamin is produced by the body upon exposure to sunlight?","opts":["Vitamin A","Vitamin B12","Vitamin C","Vitamin D"],"ans":3},{"q":"What is the name of the network of vessels that carry lymph?","opts":["Cardiovascular system","Nervous system","Lymphatic system","Endocrine system"],"ans":2},{"q":"Which type of muscle is found in the walls of the intestines?","opts":["Cardiac","Skeletal","Voluntary","Smooth"],"ans":3},{"q":"What is the name of the process by which cells engulf and destroy pathogens?","opts":["Endocytosis","Exocytosis","Phagocytosis","Pinocytosis"],"ans":2},{"q":"Which part of the blood helps in wound healing?","opts":["Red blood cells","White blood cells","Plasma","Platelets"],"ans":3},{"q":"What is the name of the organ that produces testosterone in males?","opts":["Adrenal gland","Prostate gland","Pituitary gland","Testes"],"ans":3},{"q":"Which process converts nitrogen gas into usable forms for plants?","opts":["Nitrogen fixation","Denitrification","Nitrification","Ammonification"],"ans":0},{"q":"What is the name of the hardest bone in the human body?","opts":["Femur","Tibia","Jawbone","Temporal bone"],"ans":2},{"q":"Which organ is responsible for regulating blood pressure?","opts":["Liver","Lung","Heart and kidney","Brain"],"ans":2},{"q":"What is the name of the substance that makes up plant cell walls?","opts":["Starch","Cellulose","Chitin","Pectin"],"ans":1},{"q":"Which type of immunity is received through vaccination?","opts":["Natural passive","Artificial passive","Natural active","Artificial active"],"ans":3},{"q":"What is the name of the substance that makes fungal cell walls?","opts":["Cellulose","Chitin","Peptidoglycan","Lignin"],"ans":1},{"q":"Which part of the plant stores food?","opts":["Root","Stem","Flower","Leaf"],"ans":0},{"q":"What is the name of the process where organisms break down food to release energy?","opts":["Photosynthesis","Transpiration","Cellular respiration","Fermentation"],"ans":2},{"q":"Which organelle is known as the cell's recycling center?","opts":["Ribosome","Golgi apparatus","Lysosome","Vacuole"],"ans":2},{"q":"What is the name of the protein that transports oxygen in blood?","opts":["Myoglobin","Albumin","Hemoglobin","Globulin"],"ans":2},{"q":"Which type of blood cell fights bacterial infections?","opts":["Red blood cells","Platelets","Neutrophils","Lymphocytes"],"ans":2},{"q":"What is the name of the tube that connects the throat to the stomach?","opts":["Trachea","Bronchus","Esophagus","Larynx"],"ans":2},{"q":"Which organ produces digestive enzymes and insulin?","opts":["Liver","Gallbladder","Stomach","Pancreas"],"ans":3},{"q":"What is the name of the basic unit of heredity?","opts":["Chromosome","DNA","Gene","Allele"],"ans":2},{"q":"Which part of the cell membrane controls what passes in and out?","opts":["Phospholipid bilayer","Cholesterol","Membrane proteins","Glycoproteins"],"ans":0},{"q":"What is the name of the process by which plants drop their leaves in autumn?","opts":["Senescence","Abscission","Dormancy","Vernalization"],"ans":1},{"q":"Which sense is detected by the olfactory nerve?","opts":["Taste","Touch","Sight","Smell"],"ans":3},{"q":"What is the name of the longest bone in the human arm?","opts":["Radius","Ulna","Humerus","Clavicle"],"ans":2},{"q":"Which vitamin helps the body absorb calcium?","opts":["Vitamin A","Vitamin B","Vitamin C","Vitamin D"],"ans":3},{"q":"What is the name of the condition where red blood cells are deficient in hemoglobin?","opts":["Leukemia","Thalassemia","Anemia","Hemophilia"],"ans":2},{"q":"Which organ produces lymphocytes that mature into T cells?","opts":["Spleen","Bone marrow","Lymph nodes","Thymus"],"ans":3},{"q":"What is the name of the protective sheath around nerve fibers?","opts":["Axon","Dendrite","Myelin sheath","Synapse"],"ans":2},{"q":"Which part of the kidney produces urine?","opts":["Renal cortex","Renal medulla","Nephron","Renal pelvis"],"ans":2},{"q":"What is the name of the hormone that lowers blood sugar?","opts":["Glucagon","Cortisol","Adrenaline","Insulin"],"ans":3},{"q":"Which process moves molecules from high concentration to low concentration?","opts":["Active transport","Osmosis","Endocytosis","Diffusion"],"ans":3},{"q":"What is the name of the fluid that fills the space inside cells?","opts":["Plasma","Cytoplasm","Lymph","Interstitial fluid"],"ans":1},{"q":"Which part of the brain stem controls breathing rate?","opts":["Midbrain","Pons","Medulla oblongata","Cerebellum"],"ans":2},{"q":"What is the name of the tiny blood vessels where gas exchange occurs?","opts":["Arterioles","Venules","Capillaries","Sinusoids"],"ans":2},{"q":"Which hormone is called the love hormone?","opts":["Dopamine","Serotonin","Oxytocin","Endorphin"],"ans":2},{"q":"What is the name of the bony structure that protects the brain?","opts":["Vertebrae","Sternum","Skull","Ribs"],"ans":2},{"q":"Which part of the ear maintains balance?","opts":["Cochlea","Eardrum","Ossicles","Semicircular canals"],"ans":3},{"q":"What is the name of the process where mRNA is read to make proteins?","opts":["Replication","Transcription","Translation","Mutation"],"ans":2},{"q":"Which organ is responsible for producing bile salts?","opts":["Gallbladder","Pancreas","Stomach","Liver"],"ans":3},{"q":"What is the name of the chemical reaction that releases energy in cells?","opts":["Anabolism","Catabolism","Metabolism","Biosynthesis"],"ans":1},{"q":"Which part of the cell determines what the cell looks like and does?","opts":["Cell membrane","Cytoplasm","Nucleus","Mitochondria"],"ans":2},{"q":"What is the name of the process where body cells multiply?","opts":["Meiosis","Mitosis","Osmosis","Diffusion"],"ans":1},{"q":"Which type of muscle tissue is striated and involuntary?","opts":["Skeletal muscle","Smooth muscle","Cardiac muscle","All of these"],"ans":2},{"q":"What is the name of the three tiny bones in the ear?","opts":["Cochlea","Semicircular canals","Ossicles","Auditory nerves"],"ans":2},{"q":"Which blood component carries nutrients and waste products?","opts":["Red blood cells","White blood cells","Platelets","Plasma"],"ans":3},{"q":"What is the name of the structure that prevents food from entering the windpipe?","opts":["Epiglottis","Uvula","Pharynx","Larynx"],"ans":0},{"q":"Which part of the brain processes hearing?","opts":["Frontal lobe","Occipital lobe","Parietal lobe","Temporal lobe"],"ans":3},{"q":"What is the name of the fatty acid that the brain needs most?","opts":["Linoleic acid","Arachidonic acid","DHA (Docosahexaenoic acid)","EPA"],"ans":2},{"q":"Which organ is removed during a splenectomy?","opts":["Liver","Gallbladder","Appendix","Spleen"],"ans":3},{"q":"What is the name of the condition where the heart cannot pump enough blood?","opts":["Heart attack","Arrhythmia","Heart failure","Angina"],"ans":2},{"q":"Which part of the nervous system controls the heart rate automatically?","opts":["Somatic nervous system","Central nervous system","Autonomic nervous system","Peripheral nervous system"],"ans":2},{"q":"What is the name of the process where unused neural connections are eliminated?","opts":["Neurogenesis","Synaptic plasticity","Synaptic pruning","Myelination"],"ans":2},{"q":"Which type of immunity does a baby get from its mother's milk?","opts":["Active immunity","Artificial immunity","Cellular immunity","Passive immunity"],"ans":3},{"q":"What is the name of the colorless fluid that flows through the lymphatic system?","opts":["Plasma","Blood","Lymph","Serum"],"ans":2},{"q":"Which part of the digestive system is the appendix attached to?","opts":["Small intestine","Stomach","Rectum","Large intestine"],"ans":3},{"q":"What is the name of the hormone produced when you exercise that makes you feel good?","opts":["Cortisol","Adrenaline","Insulin","Endorphin"],"ans":3},{"q":"Which organ controls the body's circadian rhythm?","opts":["Pituitary gland","Hypothalamus","Pineal gland","Thalamus"],"ans":2},{"q":"What is the name of the protein that gives red blood cells their shape?","opts":["Actin","Spectrin","Myosin","Tubulin"],"ans":1},{"q":"Which part of the brain is associated with emotional responses?","opts":["Cerebellum","Thalamus","Amygdala","Hippocampus"],"ans":2},{"q":"What is the name of the layer of tissue that lines blood vessels?","opts":["Epithelium","Endothelium","Mesothelium","Endocardium"],"ans":1},{"q":"Which gland is located just below the larynx and regulates metabolism?","opts":["Thymus","Parathyroid","Adrenal","Thyroid"],"ans":3}];
const GK_BASIC=[{"q":"How many continents are there on Earth?","opts":["5","6","7","8"],"ans":2},{"q":"How many oceans are there on Earth?","opts":["3","4","5","6"],"ans":2},{"q":"What is the largest country in the world by area?","opts":["China","USA","Canada","Russia"],"ans":3},{"q":"How many countries are there in the world?","opts":["185","195","205","215"],"ans":1},{"q":"What is the capital of India?","opts":["Mumbai","Chennai","New Delhi","Kolkata"],"ans":2},{"q":"Which is the largest planet in our solar system?","opts":["Saturn","Neptune","Jupiter","Uranus"],"ans":2},{"q":"How many days are there in a leap year?","opts":["364","365","366","367"],"ans":2},{"q":"What is the tallest mountain in the world?","opts":["K2","Kangchenjunga","Lhotse","Mount Everest"],"ans":3},{"q":"Which is the longest river in the world?","opts":["Amazon","Congo","Mississippi","Nile"],"ans":3},{"q":"How many planets are there in our solar system?","opts":["7","8","9","10"],"ans":1},{"q":"What is the capital of France?","opts":["Lyon","Marseille","Paris","Nice"],"ans":2},{"q":"Which country has the largest population in the world?","opts":["USA","Russia","India","China"],"ans":3},{"q":"What is the smallest country in the world?","opts":["Monaco","San Marino","Liechtenstein","Vatican City"],"ans":3},{"q":"Which animal is known as the king of the jungle?","opts":["Tiger","Elephant","Lion","Leopard"],"ans":2},{"q":"How many hours are there in a day?","opts":["12","18","24","36"],"ans":2},{"q":"What is the capital of the United States?","opts":["New York","Los Angeles","Chicago","Washington D.C."],"ans":3},{"q":"Which is the largest ocean in the world?","opts":["Atlantic","Indian","Arctic","Pacific"],"ans":3},{"q":"How many weeks are there in a year?","opts":["48","50","52","54"],"ans":2},{"q":"What is the nearest planet to the Sun?","opts":["Venus","Mars","Mercury","Earth"],"ans":2},{"q":"Which country is known as the Land of the Rising Sun?","opts":["China","South Korea","Japan","Thailand"],"ans":2},{"q":"What is the capital of Australia?","opts":["Sydney","Melbourne","Brisbane","Canberra"],"ans":3},{"q":"Which is the longest wall in the world?","opts":["Hadrian's Wall","Great Wall of China","Berlin Wall","Aurelian Wall"],"ans":1},{"q":"How many stars are on the flag of the United States?","opts":["48","50","52","54"],"ans":1},{"q":"What is the currency of Japan?","opts":["Won","Yuan","Yen","Ringgit"],"ans":2},{"q":"Which bird is the national symbol of the USA?","opts":["Eagle","Bald Eagle","Falcon","Hawk"],"ans":1},{"q":"What is the capital of China?","opts":["Shanghai","Guangzhou","Shenzhen","Beijing"],"ans":3},{"q":"Which planet is known as the Red Planet?","opts":["Jupiter","Venus","Mars","Saturn"],"ans":2},{"q":"How many sides does a hexagon have?","opts":["5","6","7","8"],"ans":1},{"q":"What is the capital of the United Kingdom?","opts":["Manchester","Birmingham","Edinburgh","London"],"ans":3},{"q":"Which country is the Eiffel Tower located in?","opts":["Italy","Germany","France","Spain"],"ans":2},{"q":"What is the largest desert in the world?","opts":["Gobi","Sahara","Antarctic Desert","Arabian"],"ans":2},{"q":"How many minutes are there in an hour?","opts":["30","45","60","90"],"ans":2},{"q":"Which is the smallest continent?","opts":["Europe","Antarctica","Australia","South America"],"ans":2},{"q":"What is the capital of Brazil?","opts":["Rio de Janeiro","S\u00e3o Paulo","Salvador","Bras\u00edlia"],"ans":3},{"q":"Which country invented football (soccer)?","opts":["Brazil","Spain","Germany","England"],"ans":3},{"q":"How many colors are in a rainbow?","opts":["5","6","7","8"],"ans":2},{"q":"What is the currency of India?","opts":["Dollar","Pound","Euro","Rupee"],"ans":3},{"q":"Which planet is closest to Earth?","opts":["Mars","Jupiter","Venus","Mercury"],"ans":2},{"q":"What is the national flower of India?","opts":["Rose","Jasmine","Lotus","Sunflower"],"ans":2},{"q":"How many seconds are in a minute?","opts":["30","45","60","90"],"ans":2},{"q":"Which country is home to the Amazon rainforest?","opts":["Colombia","Peru","Venezuela","Brazil"],"ans":3},{"q":"What is the capital of Germany?","opts":["Munich","Hamburg","Frankfurt","Berlin"],"ans":3},{"q":"Which is the fastest land animal?","opts":["Lion","Leopard","Cheetah","Horse"],"ans":2},{"q":"How many months are in a year?","opts":["10","11","12","13"],"ans":2},{"q":"What is the currency of the United Kingdom?","opts":["Euro","Dollar","Pound Sterling","Franc"],"ans":2},{"q":"Which country is the Taj Mahal located in?","opts":["Pakistan","Bangladesh","Nepal","India"],"ans":3},{"q":"What is the largest continent by area?","opts":["Africa","North America","Europe","Asia"],"ans":3},{"q":"Which is the deepest ocean in the world?","opts":["Atlantic","Indian","Arctic","Pacific"],"ans":3},{"q":"How many days are there in the month of February in a non-leap year?","opts":["27","28","29","30"],"ans":1},{"q":"What is the capital of Canada?","opts":["Toronto","Vancouver","Montreal","Ottawa"],"ans":3},{"q":"Which country has the largest area of forest?","opts":["Canada","China","Brazil","Russia"],"ans":3},{"q":"What is the national animal of India?","opts":["Lion","Elephant","Bengal Tiger","Peacock"],"ans":2},{"q":"How many zeros are in one million?","opts":["4","5","6","7"],"ans":2},{"q":"Which planet has rings around it?","opts":["Jupiter","Uranus","Neptune","Saturn"],"ans":3},{"q":"What is the capital of Japan?","opts":["Osaka","Kyoto","Hiroshima","Tokyo"],"ans":3},{"q":"Which is the highest waterfall in the world?","opts":["Niagara Falls","Victoria Falls","Angel Falls","Iguazu Falls"],"ans":2},{"q":"How many bones are in a newborn baby?","opts":["206","270","300","350"],"ans":1},{"q":"What is the currency of the European Union?","opts":["Pound","Dollar","Franc","Euro"],"ans":3},{"q":"Which country is known as the land of kangaroos?","opts":["New Zealand","South Africa","Australia","Brazil"],"ans":2},{"q":"What is the capital of Russia?","opts":["St. Petersburg","Kiev","Minsk","Moscow"],"ans":3},{"q":"Which is the longest river in Asia?","opts":["Mekong","Huang He","Yangtze","Indus"],"ans":2},{"q":"How many days are in the month of April?","opts":["28","29","30","31"],"ans":2},{"q":"What is the national bird of India?","opts":["Eagle","Parrot","Peacock","Sparrow"],"ans":2},{"q":"Which country has the most gold medals in Olympic history?","opts":["China","Russia","Germany","United States"],"ans":3},{"q":"What is the capital of Italy?","opts":["Milan","Naples","Venice","Rome"],"ans":3},{"q":"Which is the lightest metal?","opts":["Aluminum","Titanium","Lithium","Magnesium"],"ans":2},{"q":"How many teeth does an adult shark have on average?","opts":["50","100","200","300"],"ans":2},{"q":"What is the currency of China?","opts":["Yen","Won","Ringgit","Yuan"],"ans":3},{"q":"Which country is home to the Great Barrier Reef?","opts":["New Zealand","Fiji","Indonesia","Australia"],"ans":3},{"q":"What is the national fruit of India?","opts":["Banana","Papaya","Guava","Mango"],"ans":3},{"q":"How many players are in a cricket team?","opts":["9","10","11","12"],"ans":2},{"q":"Which is the largest mammal on Earth?","opts":["Elephant","Giraffe","Blue Whale","Hippopotamus"],"ans":2},{"q":"What is the capital of Spain?","opts":["Barcelona","Seville","Valencia","Madrid"],"ans":3},{"q":"Which continent has the most countries?","opts":["Asia","Europe","South America","Africa"],"ans":3},{"q":"How many players are on a football (soccer) team?","opts":["9","10","11","12"],"ans":2},{"q":"What is the hardest natural substance on Earth?","opts":["Gold","Iron","Diamond","Quartz"],"ans":2},{"q":"Which is the most spoken language in the world?","opts":["English","Hindi","Spanish","Mandarin Chinese"],"ans":3},{"q":"How many time zones does Russia have?","opts":["9","11","13","15"],"ans":1},{"q":"What is the capital of South Africa?","opts":["Cape Town only","Johannesburg","Pretoria (executive)","Durban"],"ans":2},{"q":"Which country has the most natural lakes?","opts":["Russia","USA","China","Canada"],"ans":3},{"q":"What is the national game of India?","opts":["Cricket","Football","Hockey","Kabaddi"],"ans":2},{"q":"Which planet takes the longest to orbit the Sun?","opts":["Saturn","Uranus","Jupiter","Neptune"],"ans":3},{"q":"How many letters are in the English alphabet?","opts":["24","25","26","27"],"ans":2},{"q":"What is the capital of Egypt?","opts":["Alexandria","Luxor","Giza","Cairo"],"ans":3},{"q":"Which country is famous for the Pyramids?","opts":["Sudan","Libya","Morocco","Egypt"],"ans":3},{"q":"How many sides does a triangle have?","opts":["2","3","4","5"],"ans":1},{"q":"What is the largest lake in the world?","opts":["Lake Baikal","Lake Superior","Caspian Sea","Lake Victoria"],"ans":2},{"q":"Which country has the longest coastline?","opts":["Russia","Australia","Norway","Canada"],"ans":3},{"q":"What is the capital of Mexico?","opts":["Guadalajara","Monterrey","Puebla","Mexico City"],"ans":3},{"q":"Which is the coldest continent on Earth?","opts":["Arctic","Europe","Antarctica","Asia"],"ans":2},{"q":"How many zeros are in one billion?","opts":["6","7","8","9"],"ans":3},{"q":"What is the currency of the United States?","opts":["Pound","Euro","Yen","Dollar"],"ans":3},{"q":"Which country is known as the Land of Tulips?","opts":["Belgium","Germany","Denmark","Netherlands"],"ans":3},{"q":"What is the tallest animal in the world?","opts":["Elephant","Camel","Giraffe","Ostrich"],"ans":2},{"q":"How many rings does the Olympic symbol have?","opts":["3","4","5","6"],"ans":2},{"q":"What is the capital of Argentina?","opts":["Montevideo","Santiago","Lima","Buenos Aires"],"ans":3},{"q":"Which is the most densely populated country in the world?","opts":["Bangladesh","India","Monaco","Singapore"],"ans":2},{"q":"Which country has the highest mountain peak in Africa?","opts":["Kenya","Ethiopia","Uganda","Tanzania"],"ans":3},{"q":"How many players are in a basketball team on court?","opts":["4","5","6","7"],"ans":1},{"q":"What is the capital of South Korea?","opts":["Busan","Incheon","Daegu","Seoul"],"ans":3}];
const GK_MEDIUM=[{"q":"Which country was the first to give women the right to vote?","opts":["USA","UK","Australia","New Zealand"],"ans":3},{"q":"What is the chemical symbol for gold?","opts":["Go","Gd","Au","Ag"],"ans":2},{"q":"Which planet has the most moons?","opts":["Jupiter","Saturn","Uranus","Neptune"],"ans":1},{"q":"Who painted the Mona Lisa?","opts":["Michelangelo","Raphael","Leonardo da Vinci","Botticelli"],"ans":2},{"q":"What is the speed of light in a vacuum?","opts":["200,000 km/s","250,000 km/s","300,000 km/s","350,000 km/s"],"ans":2},{"q":"Which country has the most UNESCO World Heritage Sites?","opts":["China","Italy","France","Spain"],"ans":1},{"q":"What is the chemical formula for water?","opts":["HO","H2O","H2O2","H3O"],"ans":1},{"q":"Who wrote Romeo and Juliet?","opts":["Charles Dickens","Jane Austen","William Shakespeare","Mark Twain"],"ans":2},{"q":"Which is the largest rainforest in the world?","opts":["Congo","Daintree","Amazon","Borneo"],"ans":2},{"q":"What is the atomic number of carbon?","opts":["4","6","8","12"],"ans":1},{"q":"Which country is the origin of the Olympic Games?","opts":["Italy","Rome","Egypt","Greece"],"ans":3},{"q":"What is the largest organ in the world (animal)?","opts":["Blue whale liver","Elephant skin","Blue whale skin","Giant squid eye"],"ans":2},{"q":"Who invented the telephone?","opts":["Thomas Edison","Nikola Tesla","Alexander Graham Bell","Guglielmo Marconi"],"ans":2},{"q":"Which country has the highest number of Internet users?","opts":["USA","India","China","Japan"],"ans":2},{"q":"What is the chemical symbol for iron?","opts":["Ir","Fe","In","Fr"],"ans":1},{"q":"Which Shakespeare play features the character Hamlet?","opts":["Macbeth","King Lear","Othello","Hamlet"],"ans":3},{"q":"What is the boiling point of water in Celsius?","opts":["90\u00b0C","95\u00b0C","100\u00b0C","105\u00b0C"],"ans":2},{"q":"Who discovered penicillin?","opts":["Louis Pasteur","Joseph Lister","Alexander Fleming","Robert Koch"],"ans":2},{"q":"Which country has the longest river in Asia?","opts":["India","Russia","China","Bangladesh"],"ans":2},{"q":"What is the chemical symbol for sodium?","opts":["So","Sa","Sd","Na"],"ans":3},{"q":"Who was the first person to walk on the Moon?","opts":["Buzz Aldrin","Yuri Gagarin","John Glenn","Neil Armstrong"],"ans":3},{"q":"Which country has the most islands?","opts":["Indonesia","Philippines","Japan","Sweden"],"ans":3},{"q":"What is the freezing point of water in Fahrenheit?","opts":["0\u00b0F","16\u00b0F","32\u00b0F","40\u00b0F"],"ans":2},{"q":"Who invented the light bulb?","opts":["Alexander Graham Bell","Nikola Tesla","Thomas Edison","Benjamin Franklin"],"ans":2},{"q":"Which is the largest island in the world?","opts":["Borneo","New Guinea","Baffin Island","Greenland"],"ans":3},{"q":"What is the chemical symbol for oxygen?","opts":["Ox","O2","O","Om"],"ans":2},{"q":"Who wrote the theory of relativity?","opts":["Isaac Newton","Niels Bohr","Max Planck","Albert Einstein"],"ans":3},{"q":"Which country was the first to land on the Moon?","opts":["Russia","China","UK","USA"],"ans":3},{"q":"What is the largest country in South America?","opts":["Argentina","Colombia","Peru","Brazil"],"ans":3},{"q":"Who invented the World Wide Web?","opts":["Bill Gates","Steve Jobs","Mark Zuckerberg","Tim Berners-Lee"],"ans":3},{"q":"Which country has the most volcanoes?","opts":["Japan","USA","Mexico","Indonesia"],"ans":3},{"q":"What is the chemical symbol for silver?","opts":["Si","Sv","Ag","Sl"],"ans":2},{"q":"Who was the first woman to win a Nobel Prize?","opts":["Rosalind Franklin","Dorothy Hodgkin","Marie Curie","Lise Meitner"],"ans":2},{"q":"Which is the world's oldest civilization?","opts":["Egyptian","Chinese","Indus Valley","Mesopotamian"],"ans":3},{"q":"What is the chemical symbol for potassium?","opts":["Po","Pt","K","Kt"],"ans":2},{"q":"Who wrote the Harry Potter series?","opts":["Roald Dahl","C.S. Lewis","Tolkien","J.K. Rowling"],"ans":3},{"q":"Which country has the highest per capita income?","opts":["USA","Norway","Qatar","Luxembourg"],"ans":3},{"q":"What is the largest organ system in the human body?","opts":["Muscular","Skeletal","Nervous","Integumentary"],"ans":3},{"q":"Who painted the Sistine Chapel ceiling?","opts":["Leonardo da Vinci","Raphael","Michelangelo","Caravaggio"],"ans":2},{"q":"Which country is the largest producer of coffee in the world?","opts":["Colombia","Vietnam","Ethiopia","Brazil"],"ans":3},{"q":"What is the chemical symbol for copper?","opts":["Co","Cp","Cu","Cr"],"ans":2},{"q":"Who invented the airplane?","opts":["Henry Ford","Nikola Tesla","Leonardo da Vinci","Wright Brothers"],"ans":3},{"q":"Which country has the most spoken languages?","opts":["India","China","Papua New Guinea","Nigeria"],"ans":2},{"q":"What is the largest volcano on Earth?","opts":["Kilauea","Vesuvius","Mount Etna","Mauna Loa"],"ans":3},{"q":"Who wrote 'Pride and Prejudice'?","opts":["Charlotte Bront\u00eb","Emily Bront\u00eb","George Eliot","Jane Austen"],"ans":3},{"q":"Which country is the world's largest producer of rice?","opts":["India","Thailand","Vietnam","China"],"ans":3},{"q":"What is the chemical formula for salt?","opts":["NaCl","KCl","CaCl2","MgCl2"],"ans":0},{"q":"Who discovered gravity?","opts":["Albert Einstein","Galileo Galilei","Isaac Newton","Johannes Kepler"],"ans":2},{"q":"Which country has the most billionaires?","opts":["China","India","Germany","USA"],"ans":3},{"q":"What is the rarest element on Earth?","opts":["Francium","Astatine","Oganesson","Tennessine"],"ans":1},{"q":"Who was the first Indian to win the Nobel Prize?","opts":["Amartya Sen","C.V. Raman","Rabindranath Tagore","Mother Teresa"],"ans":2},{"q":"Which is the world's most visited tourist attraction?","opts":["Eiffel Tower","Great Wall of China","Colosseum","The Louvre"],"ans":3},{"q":"What is the chemical symbol for nitrogen?","opts":["Ni","Na","N","Ng"],"ans":2},{"q":"Who invented the steam engine?","opts":["James Watt","Thomas Newcomen","George Stephenson","Richard Trevithick"],"ans":0},{"q":"Which country has the most forest cover as a percentage of its area?","opts":["Brazil","Russia","Finland","Suriname"],"ans":3},{"q":"What is the distance from the Earth to the Moon?","opts":["284,000 km","384,000 km","484,000 km","584,000 km"],"ans":1},{"q":"Who wrote 'The Origin of Species'?","opts":["Gregor Mendel","Louis Pasteur","Alfred Russel Wallace","Charles Darwin"],"ans":3},{"q":"Which country has the oldest continuously inhabited city?","opts":["Iraq","Iran","Syria","Egypt"],"ans":2},{"q":"What is the largest river in India?","opts":["Brahmaputra","Krishna","Godavari","Ganga"],"ans":3},{"q":"Who is known as the Father of Modern Physics?","opts":["Isaac Newton","Niels Bohr","Max Planck","Albert Einstein"],"ans":3},{"q":"Which country has the most natural wonders?","opts":["USA","Brazil","China","Australia"],"ans":3},{"q":"What is the chemical symbol for helium?","opts":["Hi","Hl","He","Hm"],"ans":2},{"q":"Who was the first President of the USA?","opts":["Abraham Lincoln","Thomas Jefferson","John Adams","George Washington"],"ans":3},{"q":"Which country produces the most diamonds?","opts":["South Africa","Botswana","Angola","Russia"],"ans":3},{"q":"What is the distance from Earth to the Sun?","opts":["100 million km","150 million km","200 million km","250 million km"],"ans":1},{"q":"Who invented the radio?","opts":["Thomas Edison","Nikola Tesla","Heinrich Hertz","Guglielmo Marconi"],"ans":3},{"q":"Which country is the world's largest producer of wheat?","opts":["USA","India","Russia","China"],"ans":3},{"q":"What is the speed of sound in air?","opts":["233 m/s","343 m/s","443 m/s","543 m/s"],"ans":1},{"q":"Who wrote 'War and Peace'?","opts":["Fyodor Dostoevsky","Anton Chekhov","Leo Tolstoy","Ivan Turgenev"],"ans":2},{"q":"Which country has the most UNESCO Intangible Cultural Heritage elements?","opts":["India","Japan","France","China"],"ans":3},{"q":"What is the chemical symbol for calcium?","opts":["Ca","Cl","Cm","Co"],"ans":0},{"q":"Who discovered the structure of DNA?","opts":["Gregor Mendel","Louis Pasteur","Watson and Crick","Rosalind Franklin"],"ans":2},{"q":"Which country has the highest literacy rate?","opts":["Finland","Norway","Japan","Andorra"],"ans":3},{"q":"What is the largest city in the world by population?","opts":["Mumbai","Beijing","Shanghai","Tokyo"],"ans":3},{"q":"Who was the first Prime Minister of India?","opts":["Sardar Patel","B.R. Ambedkar","Mahatma Gandhi","Jawaharlal Nehru"],"ans":3},{"q":"Which country has the longest train network?","opts":["Russia","China","India","USA"],"ans":3},{"q":"What is the largest pyramid in the world?","opts":["Pyramid of Khufu","Pyramid of Khafre","Great Pyramid of Cholula","Step Pyramid"],"ans":2},{"q":"Who invented the printing press?","opts":["Leonardo da Vinci","Galileo Galilei","Johannes Gutenberg","Isaac Newton"],"ans":2},{"q":"Which country has the most rivers?","opts":["Brazil","Russia","China","USA"],"ans":1},{"q":"What is the chemical symbol for lead?","opts":["Le","Ld","Pb","Pl"],"ans":2},{"q":"Who wrote 'The Alchemist'?","opts":["Gabriel Garc\u00eda M\u00e1rquez","Jorge Luis Borges","Isabel Allende","Paulo Coelho"],"ans":3},{"q":"Which country has the most satellites in orbit?","opts":["Russia","China","Europe","USA"],"ans":3},{"q":"What is the boiling point of water in Fahrenheit?","opts":["212\u00b0F","200\u00b0F","220\u00b0F","232\u00b0F"],"ans":0},{"q":"Who was the first person to reach the South Pole?","opts":["Robert Falcon Scott","Ernest Shackleton","Roald Amundsen","Edmund Hillary"],"ans":2},{"q":"Which country is the world's largest producer of tea?","opts":["India","Sri Lanka","Kenya","China"],"ans":3},{"q":"What is the chemical formula for carbon dioxide?","opts":["CO","CO2","C2O","CO3"],"ans":1},{"q":"Who invented the microscope?","opts":["Galileo Galilei","Robert Hooke","Antonie van Leeuwenhoek","Hans Janssen"],"ans":2},{"q":"Which country has the most ancient ruins?","opts":["Mexico","Egypt","China","Greece"],"ans":1},{"q":"What is the largest bird in the world?","opts":["Emu","Rhea","Cassowary","Ostrich"],"ans":3},{"q":"Who wrote 'The Jungle Book'?","opts":["Roald Dahl","Rudyard Kipling","Lewis Carroll","R.L. Stevenson"],"ans":1},{"q":"Which country has the most temples?","opts":["China","Japan","India","Thailand"],"ans":2},{"q":"What is the chemical symbol for zinc?","opts":["Zc","Zi","Zn","Ze"],"ans":2},{"q":"Who is known as the Father of the Nation in India?","opts":["Jawaharlal Nehru","Sardar Patel","Subhas Chandra Bose","Mahatma Gandhi"],"ans":3},{"q":"Which country won the first FIFA World Cup?","opts":["Brazil","Argentina","Italy","Uruguay"],"ans":3},{"q":"What is the largest spider in the world?","opts":["Black Widow","Bird-eating spider","Funnel Web","Goliath Birdeater"],"ans":3},{"q":"Who wrote 'Adventures of Huckleberry Finn'?","opts":["Ernest Hemingway","F. Scott Fitzgerald","John Steinbeck","Mark Twain"],"ans":3},{"q":"Who wrote 'Don Quixote'?","opts":["Lope de Vega","Francisco de Quevedo","Miguel de Cervantes","Calder\u00f3n de la Barca"],"ans":2},{"q":"Which country has the most Formula 1 World Championship titles?","opts":["Brazil","Germany","UK","Multiple tied"],"ans":1},{"q":"What is the name of the world's largest flower?","opts":["Titan Arum","Rafflesia arnoldii","Victoria amazonica","Puya raimondii"],"ans":1},{"q":"Who invented the telescope?","opts":["Galileo Galilei","Isaac Newton","Hans Lippershey","Johannes Kepler"],"ans":2},{"q":"Which country is home to the Great Wall?","opts":["Japan","India","China","Korea"],"ans":2},{"q":"What is the capital of Pakistan?","opts":["Lahore","Karachi","Peshawar","Islamabad"],"ans":3},{"q":"Which planet is known as the Morning Star?","opts":["Mars","Jupiter","Venus","Mercury"],"ans":2},{"q":"What is the official language of Brazil?","opts":["Spanish","English","French","Portuguese"],"ans":3},{"q":"Which country has the most time zones?","opts":["USA","China","Russia","France"],"ans":3},{"q":"What is the capital of Turkey?","opts":["Istanbul","Izmir","Bursa","Ankara"],"ans":3},{"q":"Which river flows through Egypt?","opts":["Congo","Nile","Niger","Zambezi"],"ans":1},{"q":"What is the smallest planet in the solar system?","opts":["Venus","Mars","Pluto","Mercury"],"ans":3},{"q":"Which country is the birthplace of democracy?","opts":["Rome","Egypt","Persia","Greece"],"ans":3},{"q":"What is the capital of Saudi Arabia?","opts":["Mecca","Medina","Jeddah","Riyadh"],"ans":3},{"q":"Which mountain range separates Europe from Asia?","opts":["Alps","Himalayas","Andes","Ural Mountains"],"ans":3},{"q":"What is the longest river in Europe?","opts":["Rhine","Danube","Thames","Volga"],"ans":3},{"q":"Which country is known as the Land of Fire and Ice?","opts":["Norway","Greenland","Finland","Iceland"],"ans":3},{"q":"What is the capital of Nigeria?","opts":["Lagos","Kano","Ibadan","Abuja"],"ans":3},{"q":"Which desert is the largest cold desert in the world?","opts":["Sahara","Arabian","Gobi","Antarctic"],"ans":3},{"q":"What is the capital of Ukraine?","opts":["Lviv","Odessa","Kharkiv","Kyiv"],"ans":3},{"q":"Which country has the most official languages?","opts":["India","Switzerland","Belgium","South Africa"],"ans":3},{"q":"What is the highest waterfall in Asia?","opts":["Jog Falls","Nohkalikai Falls","Dudhsagar","Kunchikal Falls"],"ans":3},{"q":"Which continent has the most countries?","opts":["Asia","Europe","South America","Africa"],"ans":3},{"q":"What is the capital of Indonesia?","opts":["Surabaya","Bandung","Medan","Jakarta"],"ans":3},{"q":"Which country has the most UNESCO World Heritage Sites?","opts":["Spain","China","France","Italy"],"ans":3},{"q":"What is the longest mountain range in the world?","opts":["Himalayas","Rockies","Alps","Andes"],"ans":3},{"q":"Which country is called the Rainbow Nation?","opts":["Kenya","Nigeria","Ethiopia","South Africa"],"ans":3},{"q":"What is the capital of Iran?","opts":["Isfahan","Shiraz","Mashhad","Tehran"],"ans":3},{"q":"Which sea is the saltiest in the world?","opts":["Red Sea","Caspian Sea","Mediterranean Sea","Dead Sea"],"ans":3},{"q":"What is the national language of China?","opts":["Cantonese","Shanghainese","Wu","Mandarin"],"ans":3},{"q":"Which country is called the Pearl of the Orient?","opts":["Japan","Thailand","Vietnam","Philippines"],"ans":3},{"q":"What is the capital of Poland?","opts":["Krakow","Gdansk","Wroclaw","Warsaw"],"ans":3},{"q":"Which ocean is the smallest in the world?","opts":["Southern","Indian","Atlantic","Arctic"],"ans":3},{"q":"What is the capital of Sweden?","opts":["Gothenburg","Malmo","Uppsala","Stockholm"],"ans":3},{"q":"Which country has the most pyramids?","opts":["Egypt","Mexico","Peru","Sudan"],"ans":3},{"q":"What is the capital of Greece?","opts":["Thessaloniki","Patras","Heraklion","Athens"],"ans":3},{"q":"Which is the highest plateau in the world?","opts":["Colorado Plateau","Deccan Plateau","Mongolian Plateau","Tibetan Plateau"],"ans":3},{"q":"What is the capital of the Netherlands?","opts":["Rotterdam","The Hague","Utrecht","Amsterdam"],"ans":3},{"q":"Which country invented paper?","opts":["Japan","India","Egypt","China"],"ans":3},{"q":"What is the capital of Portugal?","opts":["Porto","Braga","Coimbra","Lisbon"],"ans":3},{"q":"Which is the world's largest bay?","opts":["Hudson Bay","Bay of Biscay","Gulf of Mexico","Bay of Bengal"],"ans":3},{"q":"What is the capital of Switzerland?","opts":["Zurich","Geneva","Basel","Bern"],"ans":3},{"q":"Which country has the most natural hot springs?","opts":["Iceland","New Zealand","Japan","USA"],"ans":2},{"q":"What is the capital of Austria?","opts":["Graz","Salzburg","Linz","Vienna"],"ans":3},{"q":"Which country is the largest producer of oil in the world?","opts":["Iran","Russia","Saudi Arabia","USA"],"ans":3},{"q":"What is the capital of Belgium?","opts":["Antwerp","Ghent","Bruges","Brussels"],"ans":3},{"q":"Which country has the longest border with China?","opts":["India","Russia","Mongolia","Kazakhstan"],"ans":1},{"q":"What is the capital of Norway?","opts":["Bergen","Stavanger","Trondheim","Oslo"],"ans":3},{"q":"Which country has the most volcanoes?","opts":["Japan","Philippines","Iceland","Indonesia"],"ans":3},{"q":"What is the capital of Denmark?","opts":["Aarhus","Odense","Aalborg","Copenhagen"],"ans":3},{"q":"Which country is known as the Cradle of Civilization?","opts":["Egypt","Iran","India","Iraq"],"ans":3},{"q":"What is the capital of Finland?","opts":["Tampere","Turku","Espoo","Helsinki"],"ans":3},{"q":"Which country has the most mountains?","opts":["China","Nepal","Pakistan","Switzerland"],"ans":0},{"q":"What is the capital of Czech Republic?","opts":["Brno","Ostrava","Plzen","Prague"],"ans":3}];
const GK_HARD=[{"q":"Which country has the highest number of nuclear power plants?","opts":["Russia","France","China","USA"],"ans":3},{"q":"What is the name of the longest mountain range in the world?","opts":["Himalayas","Rockies","Alps","Andes"],"ans":3},{"q":"Who was the first person to circumnavigate the globe?","opts":["Christopher Columbus","Vasco da Gama","James Cook","Ferdinand Magellan"],"ans":3},{"q":"Which element has the highest melting point?","opts":["Iron","Platinum","Osmium","Tungsten"],"ans":3},{"q":"What is the name of the world's oldest university?","opts":["Oxford","Bologna","Cambridge","Al-Qarawiyyin"],"ans":3},{"q":"Which country has the most active volcanoes?","opts":["Japan","Iceland","Philippines","Indonesia"],"ans":3},{"q":"Who developed the first successful vaccine?","opts":["Louis Pasteur","Alexander Fleming","Edward Jenner","Robert Koch"],"ans":2},{"q":"What is the name of the deepest point in the ocean?","opts":["Puerto Rico Trench","Java Trench","Mariana Trench","Philippine Trench"],"ans":2},{"q":"Which country has the most Nobel Prize winners?","opts":["UK","Germany","France","USA"],"ans":3},{"q":"What is the name of the currency used before the Euro in Germany?","opts":["Schilling","Franc","Lira","Deutsche Mark"],"ans":3},{"q":"Who was the first person to break the sound barrier?","opts":["Charles Lindbergh","Amelia Earhart","Chuck Yeager","Neil Armstrong"],"ans":2},{"q":"Which country has the most languages spoken?","opts":["India","Nigeria","Papua New Guinea","Indonesia"],"ans":2},{"q":"What is the name of the world's largest coral reef system?","opts":["Mesoamerican Reef","Red Sea Coral Reef","New Caledonia Barrier Reef","Great Barrier Reef"],"ans":3},{"q":"Who was the first woman to fly solo across the Atlantic?","opts":["Bessie Coleman","Harriet Quimby","Jacqueline Cochran","Amelia Earhart"],"ans":3},{"q":"Which country has the world's oldest parliament?","opts":["UK","Denmark","Iceland","Sweden"],"ans":2},{"q":"What is the name of the boundary between Earth's crust and mantle?","opts":["Conrad discontinuity","Lehmann discontinuity","Gutenberg discontinuity","Mohorovi\u010di\u0107 discontinuity"],"ans":3},{"q":"Who discovered the neutron?","opts":["Ernest Rutherford","Niels Bohr","J.J. Thomson","James Chadwick"],"ans":3},{"q":"Which country has the most ancient written records?","opts":["Egypt","China","Iraq","India"],"ans":2},{"q":"What is the name of the world's first space station?","opts":["Skylab","Mir","Salyut 1","ISS"],"ans":2},{"q":"Who was the first person to reach the North Pole?","opts":["Roald Amundsen","Ernest Shackleton","Robert Peary","Frederick Cook"],"ans":2},{"q":"Which country has the most freshwater resources?","opts":["Canada","China","Russia","Brazil"],"ans":3},{"q":"What is the name of the longest railway in the world?","opts":["Canadian Pacific Railway","Trans-Siberian Railway","Indian Railways","Union Pacific Railway"],"ans":1},{"q":"Who invented the periodic table?","opts":["Antoine Lavoisier","John Dalton","Dmitri Mendeleev","Henry Moseley"],"ans":2},{"q":"Which country has the largest army in the world?","opts":["USA","Russia","India","China"],"ans":3},{"q":"What is the name of the first artificial satellite launched into space?","opts":["Explorer 1","Vanguard 1","Sputnik 1","Luna 1"],"ans":2},{"q":"Who was the youngest person to win the Nobel Peace Prize?","opts":["Greta Thunberg","Rigoberta Mench\u00fa","Nadia Murad","Malala Yousafzai"],"ans":3},{"q":"Which country has the highest mountain range outside the Himalayas?","opts":["Argentina","Nepal","Pakistan","China"],"ans":0},{"q":"What is the name of the process that formed the Earth's Moon?","opts":["Capture theory","Fission theory","Binary accretion","Giant impact hypothesis"],"ans":3},{"q":"Who wrote the first computer algorithm?","opts":["Charles Babbage","Alan Turing","Ada Lovelace","John von Neumann"],"ans":2},{"q":"Which country has the most World Heritage Sites related to cultural heritage?","opts":["China","France","Italy","Spain"],"ans":2},{"q":"What is the name of the world's largest cave?","opts":["Mammoth Cave","Krubera Cave","Lechuguilla Cave","Son Doong Cave"],"ans":3},{"q":"Who discovered the electron?","opts":["Ernest Rutherford","Niels Bohr","J.J. Thomson","James Chadwick"],"ans":2},{"q":"Which country was the first to industrialize?","opts":["France","Germany","USA","United Kingdom"],"ans":3},{"q":"What is the name of the largest moon of Saturn?","opts":["Rhea","Dione","Titan","Enceladus"],"ans":2},{"q":"Who was the first Secretary-General of the United Nations?","opts":["Dag Hammarskj\u00f6ld","Trygve Lie","U Thant","Kurt Waldheim"],"ans":1},{"q":"Which country has the most ancient pyramids?","opts":["Mexico","Egypt","Peru","Sudan"],"ans":3},{"q":"What is the name of the chemical element with atomic number 79?","opts":["Platinum","Silver","Gold","Mercury"],"ans":2},{"q":"Who was the first person to propose the heliocentric model of the solar system?","opts":["Galileo Galilei","Johannes Kepler","Tycho Brahe","Nicolaus Copernicus"],"ans":3},{"q":"Which country has the most coastline including islands?","opts":["Norway","Russia","Canada","Indonesia"],"ans":2},{"q":"What is the name of the world's oldest known writing system?","opts":["Egyptian hieroglyphics","Chinese characters","Indus script","Sumerian cuneiform"],"ans":3},{"q":"Who proposed the Big Bang Theory?","opts":["Edwin Hubble","Fred Hoyle","Georges Lema\u00eetre","Stephen Hawking"],"ans":2},{"q":"Which country has the most national parks?","opts":["Canada","Australia","Brazil","USA"],"ans":3},{"q":"What is the name of the tectonic plate that India sits on?","opts":["Eurasian Plate","Pacific Plate","Australian Plate","Indo-Australian Plate"],"ans":3},{"q":"Who was the first person to split the atom?","opts":["Niels Bohr","Ernest Rutherford","James Chadwick","Enrico Fermi"],"ans":1},{"q":"Which country has the most ancient temples?","opts":["China","Greece","Egypt","India"],"ans":3},{"q":"What is the name of the world's largest tropical wetland?","opts":["Everglades","Okavango Delta","Sundarbans","Pantanal"],"ans":3},{"q":"Who invented the internet protocol TCP/IP?","opts":["Tim Berners-Lee","Bill Gates","Vint Cerf and Bob Kahn","Claude Shannon"],"ans":2},{"q":"Which country has the world's largest gold reserves?","opts":["China","Russia","Germany","USA"],"ans":3},{"q":"What is the name of the fault line that runs through California?","opts":["Cascadia subduction zone","Hayward Fault","Andreas Fault","San Andreas Fault"],"ans":3},{"q":"Who first proposed the theory of continental drift?","opts":["Charles Darwin","Alfred Wegener","Alexander von Humboldt","James Hutton"],"ans":1},{"q":"Which country has the oldest written constitution still in use?","opts":["France","UK","India","USA"],"ans":3},{"q":"What is the name of the world's most active geyser?","opts":["Old Faithful","Strokkur","Steamboat Geyser","Castle Geyser"],"ans":2},{"q":"Who discovered the law of universal gravitation before Newton?","opts":["Galileo Galilei","Robert Hooke","Johannes Kepler","Tycho Brahe"],"ans":1},{"q":"Which country has the most ancient cities still inhabited?","opts":["China","Iraq","Iran","Syria"],"ans":1},{"q":"What is the name of the first human genome project completed?","opts":["Human Genome Initiative","Genome 2000","Human Genome Project","DNA Mapping Project"],"ans":2},{"q":"Who first calculated the circumference of the Earth?","opts":["Aristotle","Pythagoras","Ptolemy","Eratosthenes"],"ans":3},{"q":"Which country has the most diversity of animal species?","opts":["Brazil","Australia","Colombia","Indonesia"],"ans":0},{"q":"What is the name of the world's largest salt flat?","opts":["Bonneville Salt Flats","Rann of Kutch","Chott el Djerid","Salar de Uyuni"],"ans":3},{"q":"Who developed quantum mechanics?","opts":["Albert Einstein","Max Planck","Niels Bohr","Werner Heisenberg"],"ans":1},{"q":"Which country has the largest petroleum reserves?","opts":["Saudi Arabia","Russia","Iran","Venezuela"],"ans":3},{"q":"What is the name of the world's deepest lake?","opts":["Lake Tanganyika","Lake Superior","Caspian Sea","Lake Baikal"],"ans":3},{"q":"Who was the first person to describe blood circulation?","opts":["Galen","Andreas Vesalius","William Harvey","Ibn al-Nafis"],"ans":2},{"q":"Which country has the most ancient astronomical observatories?","opts":["Egypt","UK","India","China"],"ans":3},{"q":"What is the name of the world's largest delta?","opts":["Nile Delta","Mississippi Delta","Mekong Delta","Ganges-Brahmaputra Delta"],"ans":3},{"q":"Who first proposed the existence of black holes?","opts":["Albert Einstein","John Michell","Stephen Hawking","Karl Schwarzschild"],"ans":1},{"q":"Which country has the most biodiversity hotspots?","opts":["Australia","Brazil","China","India"],"ans":1},{"q":"What is the name of the world's largest mangrove forest?","opts":["Everglades","Sundarbans","Daintree","Congo mangroves"],"ans":1},{"q":"Who invented calculus independently alongside Leibniz?","opts":["Galileo Galilei","Blaise Pascal","Ren\u00e9 Descartes","Isaac Newton"],"ans":3},{"q":"Which country has the most recorded earthquakes per year?","opts":["China","USA","Indonesia","Japan"],"ans":3},{"q":"What is the name of the world's oldest known cave paintings?","opts":["Altamira","Lascaux","Chauvet Cave","Cueva de El Castillo"],"ans":2},{"q":"Who was the first to map the human brain regions?","opts":["Sigmund Freud","Paul Broca","Santiago Ram\u00f3n y Cajal","Franz Joseph Gall"],"ans":3},{"q":"Which country has the most ancient trade routes passing through it?","opts":["China","India","Iran","Iraq"],"ans":2},{"q":"What is the name of the deepest point on land?","opts":["Death Valley","Qattara Depression","Dead Sea shoreline","Bentley Subglacial Trench"],"ans":3},{"q":"Who discovered the X-ray?","opts":["Marie Curie","Henri Becquerel","Wilhelm R\u00f6ntgen","Max von Laue"],"ans":2},{"q":"Which country has the largest underground cave system?","opts":["USA","France","China","Vietnam"],"ans":0},{"q":"What is the name of the world's oldest living organism?","opts":["Giant Sequoia","Bristlecone Pine","Pando Aspen Colony","Creosote Bush"],"ans":1},{"q":"Who proposed the uncertainty principle?","opts":["Niels Bohr","Albert Einstein","Erwin Schr\u00f6dinger","Werner Heisenberg"],"ans":3},{"q":"Which country has the most ancient astronomical texts?","opts":["Egypt","Greece","India","Babylon"],"ans":3},{"q":"What is the name of the world's longest cave system?","opts":["Lechuguilla Cave","Optymistychna Cave","Sistema Ox Bel Ha","Mammoth Cave"],"ans":3},{"q":"Who first isolated radium?","opts":["Henri Becquerel","Ernest Rutherford","Marie and Pierre Curie","Antoine Lavoisier"],"ans":2},{"q":"Which country has the most ancient trade laws?","opts":["China","Egypt","Greece","Mesopotamia"],"ans":3},{"q":"What is the name of the smallest planet in the solar system?","opts":["Mars","Pluto","Venus","Mercury"],"ans":3},{"q":"Who developed the first theory of evolution before Darwin?","opts":["Carl Linnaeus","Georges-Louis Leclerc","Georges Cuvier","Jean-Baptiste Lamarck"],"ans":3},{"q":"Which country has the most recorded tsunamis in history?","opts":["Indonesia","Philippines","Chile","Japan"],"ans":3},{"q":"What is the name of the world's fastest wind ever recorded?","opts":["Typhoon Nancy","Hurricane Camille","Oklahoma Tornado","Barrow Island Cyclone"],"ans":3},{"q":"Who discovered the proton?","opts":["James Chadwick","Niels Bohr","Ernest Rutherford","J.J. Thomson"],"ans":2},{"q":"Which country has the most ancient medical texts?","opts":["Greece","China","Egypt","India"],"ans":2},{"q":"What is the name of the world's largest hot desert?","opts":["Arabian Desert","Gobi Desert","Australian Desert","Sahara Desert"],"ans":3},{"q":"Who first proposed that the atom has a nucleus?","opts":["J.J. Thomson","Niels Bohr","Ernest Rutherford","James Chadwick"],"ans":2},{"q":"Which country has the most recorded meteor impacts?","opts":["Canada","Russia","Australia","USA"],"ans":1},{"q":"What is the name of the element discovered by India?","opts":["Berkelium","Curium","Nihonium","Nihonium"],"ans":2},{"q":"Who invented the transistor?","opts":["John Bardeen alone","William Shockley alone","Bardeen, Brattain and Shockley","Lee De Forest"],"ans":2},{"q":"Which country has the most ancient navigation techniques?","opts":["China","Greece","Arab countries","Polynesia"],"ans":3},{"q":"What is the name of the world's highest navigable lake?","opts":["Lake Baikal","Crater Lake","Lake Titicaca","Dead Sea"],"ans":2},{"q":"Who first described the laws of thermodynamics?","opts":["James Joule","Lord Kelvin","Rudolf Clausius","Sadi Carnot"],"ans":3},{"q":"Which country has the most ancient herbal medicine traditions?","opts":["Egypt","India","Greece","China"],"ans":3},{"q":"What is the name of the world's largest gold mine?","opts":["Grasberg Mine","Muruntau Mine","Super Pit","South Deep"],"ans":1},{"q":"Who first proposed the existence of antimatter?","opts":["Albert Einstein","Niels Bohr","Werner Heisenberg","Paul Dirac"],"ans":3},{"q":"Which country has the most ancient mathematical texts?","opts":["Greece","Egypt","China","Babylon"],"ans":3},{"q":"What is the name of the world's largest coral atoll?","opts":["Aldabra","Lifou","Kiritimati","Lihou Reef"],"ans":2},{"q":"Who first proved that the Earth is round?","opts":["Galileo Galilei","Columbus","Eratosthenes","Pythagoras"],"ans":3},{"q":"Which country has the most ancient architectural wonders still standing?","opts":["Greece","China","Mexico","Egypt"],"ans":3},{"q":"What is the name of the world's most isolated island?","opts":["Easter Island","Tristan da Cunha","Bouvet Island","St Helena"],"ans":1},{"q":"Who invented the battery?","opts":["Michael Faraday","Thomas Edison","Benjamin Franklin","Alessandro Volta"],"ans":3},{"q":"Which country has the most ancient river civilizations?","opts":["China","India","Egypt","Iraq"],"ans":3},{"q":"What is the name of the world's largest impact crater?","opts":["Barringer Crater","Chicxulub Crater","Vredefort Dome","Sudbury Basin"],"ans":2},{"q":"Who first described the double helix structure of DNA?","opts":["Rosalind Franklin","Erwin Chargaff","Linus Pauling","Watson and Crick"],"ans":3},{"q":"Which country has the most ancient water management systems?","opts":["Egypt","Mesopotamia","India","China"],"ans":0},{"q":"What is the name of the world's largest hydroelectric dam?","opts":["Hoover Dam","Itaipu Dam","Robert-Bourassa","Three Gorges Dam"],"ans":3},{"q":"Who discovered the laws of planetary motion?","opts":["Galileo Galilei","Isaac Newton","Tycho Brahe","Johannes Kepler"],"ans":3},{"q":"Which country has the most ancient musical instruments discovered?","opts":["Greece","Egypt","Germany","China"],"ans":3},{"q":"What is the name of the world's oldest known recipe?","opts":["Egyptian beer","Babylonian stew","Sumerian beer","Roman bread"],"ans":2},{"q":"Who first proposed the concept of zero in mathematics?","opts":["Greeks","Indians","Arabs","Babylonians"],"ans":1},{"q":"Which country has the most ancient stone circles?","opts":["France","Ireland","Scotland","UK (England)"],"ans":3},{"q":"What is the name of the world's largest archipelago?","opts":["Philippines","Japan","Indonesia","Maldives"],"ans":2},{"q":"Who invented the telegraph?","opts":["Alexander Graham Bell","Samuel Morse","Nikola Tesla","Guglielmo Marconi"],"ans":1},{"q":"Which country has the most ancient pottery traditions?","opts":["Japan","Egypt","China","Mesopotamia"],"ans":0},{"q":"What is the name of the world's most abundant gas in the atmosphere?","opts":["Oxygen","Carbon dioxide","Argon","Nitrogen"],"ans":3},{"q":"Who first developed the concept of the atom?","opts":["Democritus","Aristotle","Plato","Leucippus"],"ans":0},{"q":"Which country has the most ancient philosophical traditions?","opts":["Greece","India","China","Egypt"],"ans":1},{"q":"What is the name of the world's smallest ocean?","opts":["Southern Ocean","Indian Ocean","Arctic Ocean","Atlantic Ocean"],"ans":2},{"q":"Who invented the compass?","opts":["Arabs","Indians","Chinese","Greeks"],"ans":2},{"q":"Which country has the most ancient trade coins?","opts":["Greece","China","Lydia (Turkey)","Persia"],"ans":2},{"q":"What is the name of the world's longest fjord?","opts":["Milford Sound","Geirangerfjord","Scoresby Sund","Sognefjord"],"ans":3},{"q":"Who first proposed the concept of natural selection independently of Darwin?","opts":["Thomas Huxley","Joseph Hooker","Alfred Russel Wallace","Ernst Haeckel"],"ans":2},{"q":"Which country has the most ancient silk production traditions?","opts":["India","Japan","Korea","China"],"ans":3},{"q":"What is the name of the world's deepest river?","opts":["Nile","Mississippi","Amazon","Congo"],"ans":3},{"q":"Who first described the circulation of blood in detail?","opts":["Galen","Andreas Vesalius","Ibn al-Nafis","William Harvey"],"ans":3},{"q":"Which country has the most ancient bronze age artifacts?","opts":["Greece","China","Iraq","Turkey"],"ans":1},{"q":"What is the name of the first country to abolish slavery?","opts":["UK","France","Haiti","USA"],"ans":2},{"q":"Who first mapped the ocean floor?","opts":["Jacques Cousteau","Robert Ballard","Marie Tharp","Sylvia Earle"],"ans":2},{"q":"Which country has the most ancient iron smelting traditions?","opts":["China","Turkey","India","Africa"],"ans":3},{"q":"What is the name of the world's most active earthquake zone?","opts":["Mid-Atlantic Ridge","Himalayan Belt","Alpine Belt","Pacific Ring of Fire"],"ans":3},{"q":"Who first proved that Earth orbits the Sun using mathematical proof?","opts":["Galileo Galilei","Tycho Brahe","Johannes Kepler","Nicolaus Copernicus"],"ans":2},{"q":"Which country has the most ancient legal codes?","opts":["Egypt","China","Greece","Mesopotamia"],"ans":3},{"q":"What is the name of the world's highest active volcano?","opts":["Cotopaxi","Mount Etna","Kilimanjaro","Ojos del Salado"],"ans":0},{"q":"Who invented the steam locomotive?","opts":["James Watt","George Stephenson","Richard Trevithick","Matthew Boulton"],"ans":2},{"q":"Which country has the most ancient paper-making traditions?","opts":["Egypt","India","Japan","China"],"ans":3},{"q":"What is the name of the world's longest submarine mountain range?","opts":["Andes","Himalayas","Mid-Atlantic Ridge","Mid-Ocean Ridge"],"ans":3},{"q":"Who first used antiseptic techniques in surgery?","opts":["Louis Pasteur","Robert Koch","Joseph Lister","Ignaz Semmelweis"],"ans":2},{"q":"Which country has the most ancient glass-making traditions?","opts":["Rome","Egypt","Mesopotamia","Greece"],"ans":1},{"q":"What is the name of the world's most linguistically diverse region?","opts":["Amazon Basin","Sub-Saharan Africa","South Asia","Papua New Guinea"],"ans":3},{"q":"Who first proposed the wave nature of light?","opts":["Isaac Newton","Thomas Young","Augustin-Jean Fresnel","Christiaan Huygens"],"ans":3},{"q":"Which country has the most ancient textile traditions?","opts":["Egypt","China","India","Peru"],"ans":2},{"q":"What is the name of the world's largest sand dune?","opts":["Cerro Blanco","Star Dune","Duna Federico Kirbus","Mega Dune"],"ans":2},{"q":"Who first classified living organisms into a systematic taxonomy?","opts":["Charles Darwin","Georges Cuvier","Carl Linnaeus","Aristotle"],"ans":2},{"q":"Which country has the most ancient silk road trading posts?","opts":["Afghanistan","Uzbekistan","China","Iran"],"ans":1},{"q":"What is the name of the world's oldest known written story?","opts":["Iliad","Mahabharata","Epic of Gilgamesh","Ramayana"],"ans":2},{"q":"Who first accurately described the optics of the human eye?","opts":["Euclid","Alhazen","Roger Bacon","Ren\u00e9 Descartes"],"ans":1},{"q":"Which country produced the world's first printed book?","opts":["Japan","Korea","China","Germany"],"ans":2},{"q":"Which country is called the Land of Smiles?","opts":["Japan","Vietnam","Cambodia","Thailand"],"ans":3},{"q":"What is the capital of Cambodia?","opts":["Siem Reap","Battambang","Sihanoukville","Phnom Penh"],"ans":3},{"q":"Which is the world's largest freshwater lake by volume?","opts":["Lake Superior","Caspian Sea","Lake Tanganyika","Lake Baikal"],"ans":3},{"q":"What is the capital of Laos?","opts":["Luang Prabang","Vientiane","Pakse","Savannakhet"],"ans":1},{"q":"Which country is known for the ancient city of Machu Picchu?","opts":["Bolivia","Ecuador","Colombia","Peru"],"ans":3},{"q":"What is the capital of Peru?","opts":["Cusco","Arequipa","Trujillo","Lima"],"ans":3},{"q":"Which is the world's driest place?","opts":["Sahara","Gobi","Death Valley","Atacama Desert"],"ans":3},{"q":"What is the capital of Chile?","opts":["Valparaiso","Concepcion","Antofagasta","Santiago"],"ans":3},{"q":"Which country has the world's longest coastline?","opts":["Australia","USA","Russia","Canada"],"ans":3},{"q":"What is the capital of Colombia?","opts":["Medellin","Cali","Barranquilla","Bogota"],"ans":3},{"q":"Which is the world's largest river delta?","opts":["Nile Delta","Mississippi Delta","Mekong Delta","Ganges-Brahmaputra Delta"],"ans":3},{"q":"What is the capital of Venezuela?","opts":["Maracaibo","Valencia","Barquisimeto","Caracas"],"ans":3},{"q":"Which country is known as the Land of Maple Leaf?","opts":["USA","Australia","New Zealand","Canada"],"ans":3},{"q":"What is the capital of New Zealand?","opts":["Auckland","Christchurch","Dunedin","Wellington"],"ans":3},{"q":"Which is the world's longest mountain range underwater?","opts":["Andes","Himalayas","Mid-Atlantic Ridge","Mid-Ocean Ridge"],"ans":3},{"q":"What is the capital of Ireland?","opts":["Cork","Limerick","Galway","Dublin"],"ans":3},{"q":"Which country has the most ancient cave paintings?","opts":["France","Spain","Italy","Indonesia"],"ans":0},{"q":"What is the capital of Scotland?","opts":["Glasgow","Aberdeen","Inverness","Edinburgh"],"ans":3},{"q":"Which is the world's longest river in South America?","opts":["Orinoco","Paraguay","Rio de la Plata","Amazon"],"ans":3},{"q":"What is the capital of Cuba?","opts":["Santiago","Havana","Camaguey","Holguin"],"ans":1},{"q":"Which country has the most ancient writing system still in use?","opts":["Egypt","India","China","Japan"],"ans":2},{"q":"What is the capital of Morocco?","opts":["Casablanca","Marrakech","Fez","Rabat"],"ans":3},{"q":"Which is the world's most visited country?","opts":["USA","Spain","China","France"],"ans":3},{"q":"What is the capital of Algeria?","opts":["Oran","Constantine","Annaba","Algiers"],"ans":3},{"q":"Which country is known as the Land of the Long White Cloud?","opts":["Australia","Iceland","Ireland","New Zealand"],"ans":3},{"q":"What is the capital of Kenya?","opts":["Mombasa","Kisumu","Nakuru","Nairobi"],"ans":3},{"q":"Which is the world's largest gorge?","opts":["Yarlung Tsangpo","Grand Canyon","Blyde River Canyon","Colca Canyon"],"ans":0},{"q":"What is the capital of Ethiopia?","opts":["Dire Dawa","Gondar","Mekelle","Addis Ababa"],"ans":3},{"q":"Which country has the most ancient trade routes?","opts":["Arabia","India","Persia","China"],"ans":3},{"q":"What is the capital of Tanzania?","opts":["Dar es Salaam","Mwanza","Arusha","Dodoma"],"ans":3},{"q":"Which is the world's largest saltwater lake?","opts":["Lake Baikal","Dead Sea","Aral Sea","Caspian Sea"],"ans":3},{"q":"What is the capital of Ghana?","opts":["Kumasi","Tamale","Cape Coast","Accra"],"ans":3},{"q":"Which country is the origin of chess?","opts":["China","Persia","Arabia","India"],"ans":3},{"q":"What is the capital of Senegal?","opts":["Dakar","Thies","Ziguinchor","Saint-Louis"],"ans":0},{"q":"Which is the world's longest river in Africa?","opts":["Congo","Niger","Zambezi","Nile"],"ans":3},{"q":"What is the capital of Ivory Coast?","opts":["Abidjan","Bouake","Yamoussoukro","San Pedro"],"ans":2},{"q":"Which country has the most ancient gold mines?","opts":["South Africa","Egypt","Ghana","Sudan"],"ans":1},{"q":"What is the capital of Cameroon?","opts":["Douala","Baffoussam","Garoua","Yaounde"],"ans":3},{"q":"Which is the world's highest unclimbed mountain?","opts":["K2","Kangchenjunga","Gangkhar Puensum","Annapurna"],"ans":2},{"q":"What is the capital of Angola?","opts":["Benguela","Huambo","Lobito","Luanda"],"ans":3},{"q":"Which country is known as the Roof of the World?","opts":["Nepal","Bhutan","Afghanistan","Tibet"],"ans":3},{"q":"What is the capital of Mozambique?","opts":["Beira","Nampula","Matola","Maputo"],"ans":3},{"q":"Which is the world's largest archipelago country?","opts":["Philippines","Japan","Maldives","Indonesia"],"ans":3},{"q":"What is the capital of Zambia?","opts":["Kitwe","Ndola","Livingstone","Lusaka"],"ans":3},{"q":"Which country has the most ancient astronomical knowledge?","opts":["Egypt","Greece","Mesopotamia","India"],"ans":2},{"q":"What is the capital of Zimbabwe?","opts":["Bulawayo","Mutare","Gweru","Harare"],"ans":3},{"q":"Which is the world's largest river island?","opts":["Marajo Island","Majuli","Bananal Island","Divar Island"],"ans":0},{"q":"What is the capital of Madagascar?","opts":["Toamasina","Mahajanga","Fianarantsoa","Antananarivo"],"ans":3},{"q":"Which country is the largest in Africa by area?","opts":["Democratic Republic of Congo","Sudan","Libya","Algeria"],"ans":3},{"q":"What is the capital of Botswana?","opts":["Francistown","Maun","Serowe","Gaborone"],"ans":3},{"q":"Which country has the most borders with other countries?","opts":["Brazil","Russia","Both China and Russia tie","China"],"ans":2},{"q":"What is the capital of Afghanistan?","opts":["Kandahar","Herat","Mazar-i-Sharif","Kabul"],"ans":3},{"q":"Which country is known as the Land of the Thunder Dragon?","opts":["Nepal","Tibet","Myanmar","Bhutan"],"ans":3},{"q":"What is the capital of Mongolia?","opts":["Darkhan","Erdenet","Choibalsan","Ulaanbaatar"],"ans":3},{"q":"Which is the world's largest peninsula?","opts":["Indian subcontinent","Iberian","Scandinavian","Arabian"],"ans":3},{"q":"What is the capital of Kazakhstan?","opts":["Almaty","Shymkent","Karaganda","Astana"],"ans":3},{"q":"Which country has the most ancient spice trade routes?","opts":["Arabia","India","Persia","China"],"ans":1},{"q":"What is the capital of Uzbekistan?","opts":["Samarkand","Bukhara","Namangan","Tashkent"],"ans":3},{"q":"Which is the world's largest river by discharge?","opts":["Nile","Congo","Mississippi","Amazon"],"ans":3},{"q":"What is the capital of Azerbaijan?","opts":["Ganja","Sumqayit","Lankaran","Baku"],"ans":3},{"q":"Which country is known for the ancient Silk Road?","opts":["India","Persia","Arabia","China"],"ans":3},{"q":"What is the capital of Georgia (country)?","opts":["Batumi","Kutaisi","Rustavi","Tbilisi"],"ans":3},{"q":"Which is the world's highest city?","opts":["Quito","Lhasa","Potosi","La Paz"],"ans":2},{"q":"What is the capital of Armenia?","opts":["Gyumri","Vanadzor","Vagharshapat","Yerevan"],"ans":3},{"q":"Which country has the most ancient citadels?","opts":["Iran","Turkey","Iraq","Syria"],"ans":0},{"q":"What is the capital of Tajikistan?","opts":["Khujand","Kulob","Konibodom","Dushanbe"],"ans":3},{"q":"Which is the world's longest border?","opts":["Russia-China","US-Mexico","Russia-Kazakhstan","US-Canada"],"ans":3},{"q":"What is the capital of Turkmenistan?","opts":["Turkmenbashi","Mary","Dashoguz","Ashgabat"],"ans":3},{"q":"Which country has the most ancient pottery?","opts":["China","Japan","Iran","Egypt"],"ans":0},{"q":"What is the capital of Kyrgyzstan?","opts":["Osh","Jalal-Abad","Karakol","Bishkek"],"ans":3},{"q":"Which is the world's largest country by number of time zones?","opts":["USA","China","Russia","France"],"ans":2},{"q":"What is the capital of Moldova?","opts":["Balti","Tiraspol","Cahul","Chisinau"],"ans":3},{"q":"Which country is known as the Gateway to Europe?","opts":["Poland","Hungary","Austria","Turkey"],"ans":3},{"q":"What is the capital of Belarus?","opts":["Vitebsk","Grodno","Gomel","Minsk"],"ans":3},{"q":"Which is the world's most northerly capital city?","opts":["Helsinki","Stockholm","Oslo","Reykjavik"],"ans":3},{"q":"What is the capital of Estonia?","opts":["Tartu","Narva","Parnu","Tallinn"],"ans":3},{"q":"Which country is known for the most ancient bronze artifacts?","opts":["Iraq","Iran","Turkey","China"],"ans":3},{"q":"What is the capital of Latvia?","opts":["Daugavpils","Jelgava","Jurmala","Riga"],"ans":3},{"q":"Which is the world's most southerly capital city?","opts":["Buenos Aires","Canberra","Cape Town","Wellington"],"ans":3},{"q":"What is the capital of Lithuania?","opts":["Kaunas","Klaipeda","Siauliai","Vilnius"],"ans":3},{"q":"Which country has the most ancient legal traditions?","opts":["Greece","Egypt","Rome","Mesopotamia"],"ans":3},{"q":"What is the capital of Albania?","opts":["Durres","Shkoder","Vlore","Tirana"],"ans":3},{"q":"Which is the world's smallest continent?","opts":["Europe","Antarctica","South America","Australia"],"ans":3},{"q":"What is the capital of North Macedonia?","opts":["Bitola","Ohrid","Tetovo","Skopje"],"ans":3},{"q":"Which country has the most ancient textile traditions?","opts":["India","Egypt","China","Peru"],"ans":2},{"q":"What is the capital of Bosnia and Herzegovina?","opts":["Banja Luka","Mostar","Tuzla","Sarajevo"],"ans":3},{"q":"Which is the world's oldest democracy still functioning?","opts":["UK","USA","Iceland","Switzerland"],"ans":2},{"q":"What is the capital of Serbia?","opts":["Novi Sad","Nis","Kragujevac","Belgrade"],"ans":3},{"q":"Which country has the most ancient astronomical tables?","opts":["Egypt","Greece","China","Babylon"],"ans":3},{"q":"What is the capital of Montenegro?","opts":["Nik\u0161ic","Budva","Herceg Novi","Podgorica"],"ans":3},{"q":"Which is the world's largest country with only one time zone?","opts":["Brazil","Australia","India","China"],"ans":3},{"q":"What is the capital of Kosovo?","opts":["Prizren","Peja","Mitrovica","Pristina"],"ans":3},{"q":"Which country has the most ancient paper money?","opts":["Japan","Korea","India","China"],"ans":3},{"q":"What is the capital of Slovenia?","opts":["Maribor","Celje","Kranj","Ljubljana"],"ans":3},{"q":"Which is the world's most linguistically diverse country?","opts":["India","Nigeria","Indonesia","Papua New Guinea"],"ans":3},{"q":"What is the capital of Croatia?","opts":["Split","Rijeka","Osijek","Zagreb"],"ans":3},{"q":"Which country has the most ancient musical instruments?","opts":["Egypt","China","India","Mesopotamia"],"ans":3},{"q":"What is the capital of Slovakia?","opts":["Ko\u0161ice","Pre\u0161ov","Nitra","Bratislava"],"ans":3},{"q":"Which is the world's most visited city?","opts":["London","New York","Paris","Bangkok"],"ans":3},{"q":"What is the capital of North Korea?","opts":["Hamhung","Chongjin","Wonsan","Pyongyang"],"ans":3}];

const PHYSICS=[{"q": "What does Newton first law state?", "opts": ["Objects always move", "Objects at rest stay at rest unless acted upon", "Objects accelerate constantly", "Objects slow down naturally"], "ans": 1}, {"q": "What is Newton second law formula?", "opts": ["F = mv", "F = ma", "F = m/a", "F = a/m"], "ans": 1}, {"q": "What does Newton third law state?", "opts": ["Force equals mass times acceleration", "Every action has an equal and opposite reaction", "Objects resist motion", "Speed is constant"], "ans": 1}, {"q": "What is the unit of force?", "opts": ["Joule", "Watt", "Newton", "Pascal"], "ans": 2}, {"q": "What is inertia?", "opts": ["Tendency of object to resist change in motion", "Speed of object", "Force on object", "Mass of object"], "ans": 0}, {"q": "What is the formula for speed?", "opts": ["Speed = Time/Distance", "Speed = Distance x Time", "Speed = Distance/Time", "Speed = Mass/Time"], "ans": 2}, {"q": "What is SI unit of speed?", "opts": ["km/h", "m/s", "cm/s", "mph"], "ans": 1}, {"q": "How is velocity different from speed?", "opts": ["No difference", "Velocity has direction speed does not", "Speed has direction velocity does not", "Different units"], "ans": 1}, {"q": "What is formula for acceleration?", "opts": ["a=v/t", "a=(v-u)/t", "a=v*t", "a=u+v"], "ans": 1}, {"q": "What is SI unit of acceleration?", "opts": ["m/s", "m2/s", "m/s2", "km/s"], "ans": 2}, {"q": "Car goes 0 to 60 m/s in 10 s. What is acceleration?", "opts": ["600 m/s2", "0.6 m/s2", "6 m/s2", "60 m/s2"], "ans": 2}, {"q": "What is displacement?", "opts": ["Total path length", "Change in position with direction", "Speed times time", "None of these"], "ans": 1}, {"q": "Which quantity is a scalar?", "opts": ["Velocity", "Displacement", "Speed", "Force"], "ans": 2}, {"q": "Which quantity is a vector?", "opts": ["Speed", "Mass", "Temperature", "Acceleration"], "ans": 3}, {"q": "What is acceleration due to gravity on Earth?", "opts": ["9.8 m/s2", "8.9 m/s2", "10.8 m/s2", "6.7 m/s2"], "ans": 0}, {"q": "What is formula for gravitational force?", "opts": ["F=GMm/r", "F=GMm/r2", "F=Gm/r2", "F=GM/r"], "ans": 1}, {"q": "What is weight?", "opts": ["Same as mass", "Force due to gravity", "Volume", "Pressure"], "ans": 1}, {"q": "What is formula for weight?", "opts": ["W=m/g", "W=mg", "W=m+g", "W=m-g"], "ans": 1}, {"q": "On Moon your weight is?", "opts": ["Same as Earth", "6 times more", "6 times less", "Zero"], "ans": 2}, {"q": "What is free fall?", "opts": ["Falling with parachute", "Falling only under gravity no air resistance", "Falling slowly", "Controlled descent"], "ans": 1}, {"q": "Different mass objects dropped from same height land?", "opts": ["Heavier first", "Lighter first", "Same time", "Depends on shape"], "ans": 2}, {"q": "What is escape velocity of Earth?", "opts": ["7.9 km/s", "11.2 km/s", "9.8 km/s", "3 km/s"], "ans": 1}, {"q": "What is formula for work?", "opts": ["W=F/d", "W=F*d", "W=m*a", "W=F+d"], "ans": 1}, {"q": "What is SI unit of work?", "opts": ["Newton", "Watt", "Joule", "Pascal"], "ans": 2}, {"q": "What is kinetic energy?", "opts": ["Energy due to position", "Energy due to motion", "Energy due to temperature", "Stored energy"], "ans": 1}, {"q": "What is formula for kinetic energy?", "opts": ["KE=mv", "KE=0.5mv2", "KE=mv2", "KE=2mv2"], "ans": 1}, {"q": "What is formula for gravitational potential energy?", "opts": ["PE=mgh", "PE=mg/h", "PE=m/gh", "PE=gh/m"], "ans": 0}, {"q": "What is law of conservation of energy?", "opts": ["Energy can be created", "Energy can be destroyed", "Energy cannot be created or destroyed", "Energy always increases"], "ans": 2}, {"q": "What is power?", "opts": ["Force x distance", "Work done per unit time", "Energy x time", "Mass x acceleration"], "ans": 1}, {"q": "What is SI unit of power?", "opts": ["Joule", "Newton", "Pascal", "Watt"], "ans": 3}, {"q": "What is formula for pressure?", "opts": ["P=F*A", "P=F/A", "P=A/F", "P=F+A"], "ans": 1}, {"q": "What is SI unit of pressure?", "opts": ["Newton", "Joule", "Pascal", "Bar"], "ans": 2}, {"q": "What does Archimedes principle say?", "opts": ["Objects fall at same rate", "Buoyant force equals weight of fluid displaced", "Pressure increases with depth", "Fluids flow high to low"], "ans": 1}, {"q": "Pascal law says pressure in fluid is transmitted?", "opts": ["Upward only", "Downward only", "Equally in all directions", "Not transmitted"], "ans": 2}, {"q": "What happens to pressure deeper in water?", "opts": ["Decreases", "Stays same", "Increases", "Becomes zero"], "ans": 2}, {"q": "Speed of sound in air at room temperature?", "opts": ["300 m/s", "343 m/s", "150 m/s", "500 m/s"], "ans": 1}, {"q": "What is frequency?", "opts": ["Distance between waves", "Number of waves per second", "Speed of waves", "Height of waves"], "ans": 1}, {"q": "What is SI unit of frequency?", "opts": ["Meter", "Second", "Hertz", "Pascal"], "ans": 2}, {"q": "What is wavelength?", "opts": ["Height of wave", "Distance between two consecutive crests", "Speed of sound", "Frequency of wave"], "ans": 1}, {"q": "What is wave speed formula?", "opts": ["v=f/L", "v=f*L", "v=L/f", "v=f+L"], "ans": 1}, {"q": "What type of wave is sound?", "opts": ["Transverse", "Electromagnetic", "Longitudinal", "Surface"], "ans": 2}, {"q": "What is the Doppler effect?", "opts": ["Change in wave speed", "Change in frequency due to relative motion", "Change in amplitude", "Reflection of waves"], "ans": 1}, {"q": "What is ultrasound?", "opts": ["Very loud sound", "Sound above 20000 Hz", "Sound below 20 Hz", "Echo sound"], "ans": 1}, {"q": "What is speed of light in vacuum?", "opts": ["3x10^8 m/s", "3x10^6 m/s", "3x10^10 m/s", "3x10^4 m/s"], "ans": 0}, {"q": "What is law of reflection?", "opts": ["Angle of incidence equals refraction", "Angle of incidence equals angle of reflection", "Light bends entering new medium", "Light slows in denser medium"], "ans": 1}, {"q": "What is refraction?", "opts": ["Bending of light at interface of two media", "Reflection of light", "Absorption of light", "Scattering of light"], "ans": 0}, {"q": "What does a convex lens do?", "opts": ["Diverges light", "Converges light", "Reflects light", "Absorbs light"], "ans": 1}, {"q": "What does a concave lens do?", "opts": ["Converges light", "Diverges light", "No effect", "Absorbs light"], "ans": 1}, {"q": "Which mirror is used in vehicle rear view mirrors?", "opts": ["Plane", "Concave", "Convex", "Parabolic"], "ans": 2}, {"q": "Which mirror is used in torches and headlights?", "opts": ["Plane", "Convex", "Concave", "Cylindrical"], "ans": 2}, {"q": "What is Ohm law?", "opts": ["V=IR", "V=I/R", "V=I+R", "V=I-R"], "ans": 0}, {"q": "What is SI unit of electric current?", "opts": ["Volt", "Ohm", "Watt", "Ampere"], "ans": 3}, {"q": "What is SI unit of resistance?", "opts": ["Ampere", "Volt", "Ohm", "Watt"], "ans": 2}, {"q": "What is electric power formula?", "opts": ["P=V/I", "P=VI", "P=V+I", "P=V-I"], "ans": 1}, {"q": "Resistors in series: what happens to total resistance?", "opts": ["Decreases", "Increases", "Voltage same across each", "Current increases"], "ans": 1}, {"q": "Resistors in parallel: what happens to total resistance?", "opts": ["Increases", "Decreases", "Current same through each", "Voltage divides"], "ans": 1}, {"q": "Like poles of magnets do what?", "opts": ["Attract", "Repel", "No effect", "Neutralize"], "ans": 1}, {"q": "Unlike poles of magnets do what?", "opts": ["Repel", "Attract", "No effect", "Cancel"], "ans": 1}, {"q": "Who discovered electromagnetic induction?", "opts": ["Newton", "Einstein", "Faraday", "Maxwell"], "ans": 2}, {"q": "What is an electromagnet?", "opts": ["Permanent magnet", "Magnet created by electric current", "Natural magnet", "Chemical magnet"], "ans": 1}, {"q": "What is SI unit of temperature?", "opts": ["Celsius", "Fahrenheit", "Kelvin", "Rankine"], "ans": 2}, {"q": "Formula to convert Celsius to Kelvin?", "opts": ["K=C-273", "K=C+273", "K=C*273", "K=C/273"], "ans": 1}, {"q": "What is first law of thermodynamics?", "opts": ["Heat flows cold to hot", "Energy is conserved", "Entropy always increases", "Heat cannot do work"], "ans": 1}, {"q": "What is conduction?", "opts": ["Heat transfer through fluid movement", "Heat transfer through direct contact", "Heat transfer through radiation", "Heat transfer through space"], "ans": 1}, {"q": "What is convection?", "opts": ["Heat transfer through solids", "Through radiation", "Through fluid movement", "Through vacuum"], "ans": 2}, {"q": "What is radiation in heat transfer?", "opts": ["Through direct contact", "Through fluid", "Through electromagnetic waves", "Through gas"], "ans": 2}, {"q": "What is centripetal force?", "opts": ["Force pushing outward", "Force directed toward center", "Force along tangent", "Gravity alone"], "ans": 1}, {"q": "What is centripetal acceleration formula?", "opts": ["a=v/r", "a=v2/r", "a=vr", "a=r/v"], "ans": 1}, {"q": "What is angular velocity?", "opts": ["Linear speed", "Angle turned per unit time", "Distance per second", "Force per area"], "ans": 1}, {"q": "What keeps planets in orbit around Sun?", "opts": ["Magnetic force", "Gravity providing centripetal force", "Electric force", "Nuclear force"], "ans": 1}, {"q": "Geostationary satellites orbit at approximately?", "opts": ["200 km", "1000 km", "36000 km", "100 km"], "ans": 2}, {"q": "Who discovered the electron?", "opts": ["Rutherford", "Thomson", "Bohr", "Chadwick"], "ans": 1}, {"q": "Who discovered the neutron?", "opts": ["Bohr", "Thomson", "Rutherford", "Chadwick"], "ans": 3}, {"q": "What is radioactivity?", "opts": ["Emission of light", "Spontaneous emission of radiation from unstable nuclei", "Absorption of radiation", "Nuclear fusion"], "ans": 1}, {"q": "What is alpha radiation made of?", "opts": ["High energy electrons", "Helium nuclei", "Electromagnetic radiation", "Neutrons"], "ans": 1}, {"q": "What is half life?", "opts": ["Time for all atoms to decay", "Time for half atoms to decay", "Time for atom to split", "Time for fusion"], "ans": 1}, {"q": "What is nuclear fission?", "opts": ["Combining nuclei", "Splitting of heavy nucleus", "Emission of electrons", "Absorption of neutrons"], "ans": 1}, {"q": "What is nuclear fusion?", "opts": ["Splitting of nucleus", "Combining of light nuclei", "Radioactive decay", "Nuclear absorption"], "ans": 1}, {"q": "What is formula for momentum?", "opts": ["p=m/v", "p=mv", "p=m+v", "p=v/m"], "ans": 1}, {"q": "What is SI unit of momentum?", "opts": ["kg/m/s", "kg.m/s", "N/s", "J/s"], "ans": 1}, {"q": "What is conservation of momentum?", "opts": ["Momentum always increases", "Momentum always decreases", "Total momentum of isolated system is constant", "Momentum equals energy"], "ans": 2}, {"q": "What is torque?", "opts": ["Linear force", "Rotational force or moment of force", "Pressure", "Power"], "ans": 1}, {"q": "What is formula for torque?", "opts": ["T=F/r", "T=F*r", "T=r/F", "T=F+r"], "ans": 1}, {"q": "What is Hooke law?", "opts": ["F=ma", "Extension is proportional to applied force", "Pressure x volume is constant", "Energy is conserved"], "ans": 1}, {"q": "What is friction?", "opts": ["Force that helps motion", "Force that opposes motion between surfaces", "Force of gravity", "Magnetic force"], "ans": 1}, {"q": "What is photoelectric effect?", "opts": ["Emission of electrons when light hits metal", "Emission of light when heated", "Absorption of light", "Reflection of light"], "ans": 0}, {"q": "Who explained the photoelectric effect?", "opts": ["Newton", "Bohr", "Einstein", "Maxwell"], "ans": 2}, {"q": "What is a photon?", "opts": ["Particle of matter", "Quantum of electromagnetic radiation", "Type of atom", "Charged particle"], "ans": 1}, {"q": "What does E=mc2 represent?", "opts": ["Energy equals mass times speed", "Mass energy equivalence", "Momentum formula", "Kinetic energy formula"], "ans": 1}, {"q": "Who gave E=mc2?", "opts": ["Newton", "Bohr", "Faraday", "Einstein"], "ans": 3}, {"q": "What is Coulomb law formula?", "opts": ["F=kq1q2/r2", "F=kq1q2/r", "F=kq1q2*r2", "F=k/q1q2r2"], "ans": 0}, {"q": "What is SI unit of electric charge?", "opts": ["Ampere", "Volt", "Coulomb", "Ohm"], "ans": 2}, {"q": "What is Kirchhoff current law?", "opts": ["Sum of voltages in loop is zero", "Sum of currents at junction is zero", "Power is conserved", "Resistance increases with temperature"], "ans": 1}, {"q": "What is Kirchhoff voltage law?", "opts": ["Sum of currents at junction is zero", "Sum of EMFs equals sum of voltage drops", "Power equals voltage times current", "Resistance is constant"], "ans": 1}, {"q": "What is SI unit of capacitance?", "opts": ["Ohm", "Henry", "Farad", "Volt"], "ans": 2}, {"q": "What is Lenz law?", "opts": ["Induced current opposes the change causing it", "Induced current aids the change", "Current flows high to low potential", "Magnetic fields attract currents"], "ans": 0}, {"q": "What is a transformer used for?", "opts": ["Convert AC to DC", "Store electrical energy", "Step up or step down AC voltage", "Generate electricity"], "ans": 2}, {"q": "What is Snell law?", "opts": ["n1 sin a1 = n2 sin a2", "n1 cos a1 = n2 cos a2", "n1*a1 = n2*a2", "n1/a1 = n2/a2"], "ans": 0}, {"q": "What is refractive index?", "opts": ["Speed in medium / speed in vacuum", "Speed in vacuum / speed in medium", "Wavelength ratio", "Frequency ratio"], "ans": 1}, {"q": "What is a diode?", "opts": ["Allows current both directions", "Allows current one direction only", "Stores charge", "Amplifies signal"], "ans": 1}, {"q": "1 horsepower equals approximately?", "opts": ["746 W", "100 W", "1000 W", "500 W"], "ans": 0}, {"q": "What is buoyant force?", "opts": ["Weight of object", "Upward force exerted by fluid", "Downward pull of gravity", "Friction force"], "ans": 1}, {"q": "What is Young modulus?", "opts": ["Ratio of stress to strain", "Ratio of force to area", "Ratio of mass to volume", "Ratio of pressure to volume"], "ans": 0}, {"q": "What is Fleming left hand rule for?", "opts": ["Finding direction of induced EMF", "Finding direction of force on current in magnetic field", "Finding direction of current", "Finding direction of magnetic field"], "ans": 1}, {"q": "What is superconductivity?", "opts": ["Very high resistance at low temperature", "Zero electrical resistance at very low temperature", "Perfect magnetism", "High conductivity at high temperature"], "ans": 1}, {"q": "What is a transistor?", "opts": ["Energy storage device", "Semiconductor device to amplify or switch signals", "Light emitting device", "Magnetic device"], "ans": 1}, {"q": "What is absolute zero?", "opts": ["0 degrees C", "0 degrees F", "0 K", "100 K"], "ans": 2}, {"q": "What is specific heat capacity?", "opts": ["Heat needed to melt 1 kg", "Heat needed to raise 1 kg by 1 degree", "Total heat content", "Heat released on cooling"], "ans": 1}, {"q": "What is latent heat?", "opts": ["Heat during temperature change", "Heat during phase change without temperature change", "Total heat content", "Heat capacity"], "ans": 1}, {"q": "Best conductor of heat?", "opts": ["Wood", "Glass", "Air", "Metal"], "ans": 3}, {"q": "What is orbital velocity?", "opts": ["Speed to escape gravity", "Speed to stay in orbit", "Max speed of satellite", "Speed of light"], "ans": 1}, {"q": "What is Kepler first law?", "opts": ["Planets move in circles", "Planets move in elliptical orbits", "Planets move at constant speed", "Planets orbit in same plane"], "ans": 1}, {"q": "What is impulse?", "opts": ["Force only", "Change in momentum", "Mass only", "Velocity only"], "ans": 1}, {"q": "What is elastic limit?", "opts": ["Maximum compression", "Point beyond which material does not return to original shape", "Maximum speed", "Breaking point"], "ans": 1}, {"q": "What is a semiconductor?", "opts": ["Perfect conductor", "Perfect insulator", "Material with conductivity between conductor and insulator", "Superconductor"], "ans": 2}, {"q": "What causes a rainbow?", "opts": ["Reflection of light", "Dispersion of light by water droplets", "Absorption of light", "Refraction alone"], "ans": 1}, {"q": "What is total internal reflection?", "opts": ["Light reflects back inside denser medium", "Light refracts completely", "Light absorbs fully", "Light scatters"], "ans": 0}, {"q": "What is focal length of a lens?", "opts": ["Length of lens", "Distance from lens to focal point", "Width of lens", "Thickness of lens"], "ans": 1}, {"q": "What is formula for fluid pressure?", "opts": ["P=rgh", "P=rg/h", "P=gh/r", "P=mg"], "ans": 0}, {"q": "Which instrument measures atmospheric pressure?", "opts": ["Thermometer", "Barometer", "Manometer", "Hydrometer"], "ans": 1}, {"q": "What is 1 joule equal to?", "opts": ["1 N x 1 m", "1 N / 1 m", "1 kg x 1 m/s", "1 W x 1 s2"], "ans": 0}, {"q": "What is SI unit of inductance?", "opts": ["Farad", "Ohm", "Tesla", "Henry"], "ans": 3}, {"q": "What is SI unit of magnetic flux density?", "opts": ["Weber", "Tesla", "Gauss", "Ampere"], "ans": 1}, {"q": "Atmospheric pressure at sea level?", "opts": ["1 Bar", "101325 Pa", "1000 Pa", "100 Pa"], "ans": 1}, {"q": "What is resonance?", "opts": ["Absorption of sound", "Vibration at natural frequency", "Reflection of sound", "Refraction of sound"], "ans": 1}, {"q": "What is an echo?", "opts": ["Refraction of sound", "Reflection of sound", "Absorption of sound", "Diffraction of sound"], "ans": 1}, {"q": "What is formula for electric field?", "opts": ["E=F*q", "E=F/q", "E=q/F", "E=Fq2"], "ans": 1}, {"q": "What is a black body?", "opts": ["Black colored object", "Object that absorbs all radiation and emits maximum radiation", "Object that emits no radiation", "Object that reflects all light"], "ans": 1}, {"q": "What is the SI unit of length?", "opts": ["Kilogram", "Metre", "Square metre", "Newton"], "ans": 1}, {"q": "What is the SI unit of mass?", "opts": ["Kilogram", "Square metre", "Radian", "Kilogram per cubic metre"], "ans": 0}, {"q": "What is the SI unit of time?", "opts": ["Second", "Kelvin", "Kilogram", "Metre"], "ans": 0}, {"q": "What is the SI unit of volume?", "opts": ["Volt", "Pascal", "Square metre", "Cubic metre"], "ans": 3}, {"q": "What is the SI unit of area?", "opts": ["Metre", "Newton", "Joule", "Square metre"], "ans": 3}, {"q": "What is the SI unit of density?", "opts": ["Volt", "Kilogram per cubic metre", "Square metre", "Watt"], "ans": 1}, {"q": "What is the SI unit of energy?", "opts": ["Watt", "Cubic metre", "Joule", "Kilogram per cubic metre"], "ans": 2}, {"q": "What is the SI unit of electric potential (voltage)?", "opts": ["Candela", "Volt", "Hertz", "Kilogram"], "ans": 1}, {"q": "What is the SI unit of magnetic flux?", "opts": ["Weber", "Mole", "Kelvin", "Newton"], "ans": 0}, {"q": "What is the SI unit of luminous intensity?", "opts": ["Volt", "Candela", "Kilogram", "Watt"], "ans": 1}, {"q": "What is the SI unit of amount of substance?", "opts": ["Cubic metre", "Watt", "Square metre", "Mole"], "ans": 3}, {"q": "What is the SI unit of plane angle?", "opts": ["Kilogram per cubic metre", "Radian", "Kelvin", "Newton"], "ans": 1}, {"q": "Which of these is a state of matter?", "opts": ["Energy", "Solid", "Force", "Speed"], "ans": 1}, {"q": "Which of these is NOT a state of matter?", "opts": ["Solid", "Liquid", "Gas", "Force"], "ans": 3}, {"q": "What is matter?", "opts": ["Anything with mass and volume", "Only solid objects", "A type of energy", "A form of light"], "ans": 0}, {"q": "What is energy?", "opts": ["Ability to do work", "A type of force", "A unit of mass", "A state of matter"], "ans": 0}, {"q": "Which is a form of energy?", "opts": ["Weight", "Kinetic energy", "Density", "Volume"], "ans": 1}, {"q": "Which is a renewable energy source?", "opts": ["Coal", "Solar energy", "Petroleum", "Natural gas"], "ans": 1}, {"q": "Which is a non-renewable energy source?", "opts": ["Solar energy", "Wind energy", "Coal", "Hydropower"], "ans": 2}, {"q": "Which is a simple machine?", "opts": ["Lever", "Battery", "Magnet", "Wire"], "ans": 0}, {"q": "What does a lever help us do?", "opts": ["Lift heavy loads easily", "Store electricity", "Produce sound", "Generate heat"], "ans": 0}, {"q": "What is a pulley mainly used for?", "opts": ["Changing direction of force to lift loads", "Measuring temperature", "Producing light", "Storing charge"], "ans": 0}, {"q": "Mass is measured using which instrument?", "opts": ["Thermometer", "Beam balance", "Barometer", "Ammeter"], "ans": 1}, {"q": "Temperature is measured using which instrument?", "opts": ["Thermometer", "Voltmeter", "Ammeter", "Barometer"], "ans": 0}, {"q": "Time is measured using which instrument?", "opts": ["Clock", "Thermometer", "Barometer", "Voltmeter"], "ans": 0}, {"q": "Electric current is measured using which instrument?", "opts": ["Ammeter", "Thermometer", "Barometer", "Speedometer"], "ans": 0}, {"q": "Voltage is measured using which instrument?", "opts": ["Voltmeter", "Ammeter", "Thermometer", "Barometer"], "ans": 0}, {"q": "Speed of a vehicle is measured using which instrument?", "opts": ["Speedometer", "Barometer", "Thermometer", "Voltmeter"], "ans": 0}, {"q": "Atmospheric pressure is measured using which instrument?", "opts": ["Barometer", "Thermometer", "Ammeter", "Speedometer"], "ans": 0}, {"q": "What is mass?", "opts": ["Amount of matter in an object", "Force of gravity on object", "Speed of an object", "Volume of an object"], "ans": 0}, {"q": "Mass is measured in which unit?", "opts": ["Kilogram", "Newton", "Metre", "Second"], "ans": 0}, {"q": "Weight is measured in which unit?", "opts": ["Newton", "Kilogram", "Metre", "Litre"], "ans": 0}, {"q": "Does mass change on the Moon?", "opts": ["No, mass stays the same", "Yes, mass doubles", "Yes, mass becomes zero", "Mass always increases"], "ans": 0}, {"q": "Does weight change on the Moon?", "opts": ["Yes, weight becomes less", "No, weight stays the same", "Weight becomes zero", "Weight doubles"], "ans": 0}, {"q": "Which force pulls objects toward the Earth?", "opts": ["Gravity", "Friction", "Magnetism", "Tension"], "ans": 0}, {"q": "Does friction help us walk?", "opts": ["Yes", "No", "Only underwater", "Only in space"], "ans": 0}, {"q": "Which surface has more friction?", "opts": ["Rough surface", "Smooth surface", "Oily surface", "Icy surface"], "ans": 0}, {"q": "Which surface has less friction?", "opts": ["Icy surface", "Rough surface", "Sandy surface", "Rocky surface"], "ans": 0}, {"q": "What can reduce friction between two surfaces?", "opts": ["Lubricant (like oil)", "Sand", "Rough surface", "Rubber"], "ans": 0}, {"q": "Which of these is a good conductor of heat?", "opts": ["Metal", "Wood", "Plastic", "Rubber"], "ans": 0}, {"q": "Which of these is a poor conductor of heat (insulator)?", "opts": ["Wood", "Iron", "Copper", "Aluminium"], "ans": 0}, {"q": "Which of these is a good conductor of electricity?", "opts": ["Copper", "Rubber", "Wood", "Plastic"], "ans": 0}, {"q": "Which of these is an electrical insulator?", "opts": ["Rubber", "Copper", "Iron", "Aluminium"], "ans": 0}, {"q": "Which metal is commonly used in electrical wires?", "opts": ["Copper", "Wood", "Rubber", "Glass"], "ans": 0}, {"q": "What happens to most substances when heated?", "opts": ["They expand", "They shrink", "They vanish", "They freeze"], "ans": 0}, {"q": "What happens to most substances when cooled?", "opts": ["They contract", "They expand rapidly", "They vanish", "They melt"], "ans": 0}, {"q": "What is the process of a solid turning into a liquid called?", "opts": ["Melting", "Freezing", "Evaporation", "Condensation"], "ans": 0}, {"q": "What is the process of a liquid turning into a solid called?", "opts": ["Freezing", "Melting", "Boiling", "Evaporation"], "ans": 0}, {"q": "What is the process of a liquid turning into a gas called?", "opts": ["Evaporation", "Condensation", "Freezing", "Melting"], "ans": 0}, {"q": "What is the process of a gas turning into a liquid called?", "opts": ["Condensation", "Evaporation", "Melting", "Freezing"], "ans": 0}, {"q": "At what temperature does water freeze (in Celsius)?", "opts": ["0°C", "10°C", "100°C", "-10°C"], "ans": 0}, {"q": "At what temperature does water boil (in Celsius)?", "opts": ["100°C", "0°C", "50°C", "150°C"], "ans": 0}, {"q": "What is the normal human body temperature (in Celsius)?", "opts": ["37°C", "0°C", "100°C", "50°C"], "ans": 0}, {"q": "Which state of matter has a fixed shape and fixed volume?", "opts": ["Solid", "Liquid", "Gas", "Plasma"], "ans": 0}, {"q": "Which state of matter has no fixed shape but a fixed volume?", "opts": ["Liquid", "Solid", "Gas", "Plasma"], "ans": 0}, {"q": "Which state of matter has no fixed shape and no fixed volume?", "opts": ["Gas", "Solid", "Liquid", "Plasma"], "ans": 0}, {"q": "Sound cannot travel through which of these?", "opts": ["Vacuum (empty space)", "Air", "Water", "Solid"], "ans": 0}, {"q": "Sound travels fastest through which medium?", "opts": ["Solid", "Air", "Vacuum", "Gas"], "ans": 0}, {"q": "Light travels fastest through which medium?", "opts": ["Vacuum", "Water", "Glass", "Air"], "ans": 0}, {"q": "What do we call a source that produces its own light?", "opts": ["Luminous object", "Non-luminous object", "Transparent object", "Opaque object"], "ans": 0}, {"q": "What do we call an object that does not produce its own light?", "opts": ["Non-luminous object", "Luminous object", "Light source", "Bulb"], "ans": 0}, {"q": "Which of these is a natural source of light?", "opts": ["Sun", "Bulb", "Candle", "Torch"], "ans": 0}, {"q": "Which of these is an artificial source of light?", "opts": ["Bulb", "Sun", "Stars", "Lightning"], "ans": 0}, {"q": "Which of these material lets light pass through completely?", "opts": ["Transparent object", "Opaque object", "Translucent object", "Solid object"], "ans": 0}, {"q": "Which of these material blocks light completely?", "opts": ["Opaque object", "Transparent object", "Translucent object", "Glass"], "ans": 0}, {"q": "A shadow is formed when light is blocked by which object?", "opts": ["Opaque object", "Transparent object", "Air", "Water"], "ans": 0}, {"q": "What are the two poles of a magnet called?", "opts": ["North and South", "East and West", "Positive and Negative", "Up and Down"], "ans": 0}, {"q": "What happens when two like poles of magnets are brought close?", "opts": ["They repel", "They attract", "Nothing happens", "They stick permanently"], "ans": 0}, {"q": "What happens when two unlike poles of magnets are brought close?", "opts": ["They attract", "They repel", "Nothing happens", "They cancel out"], "ans": 0}, {"q": "Which of these materials is attracted by a magnet?", "opts": ["Iron", "Wood", "Plastic", "Rubber"], "ans": 0}, {"q": "Which of these materials is NOT attracted by a magnet?", "opts": ["Plastic", "Iron", "Steel", "Nickel"], "ans": 0}, {"q": "What is the region around a magnet where its force acts called?", "opts": ["Magnetic field", "Electric field", "Gravitational field", "Light field"], "ans": 0}, {"q": "Which device is used to detect direction using a magnet?", "opts": ["Compass", "Thermometer", "Barometer", "Voltmeter"], "ans": 0}, {"q": "What flows through a wire to make an electric current?", "opts": ["Electrons", "Protons", "Neutrons", "Atoms"], "ans": 0}, {"q": "What is a circuit with only one path for current called?", "opts": ["Series circuit", "Parallel circuit", "Open circuit", "Short circuit"], "ans": 0}, {"q": "What is a circuit with multiple paths for current called?", "opts": ["Parallel circuit", "Series circuit", "Broken circuit", "Dead circuit"], "ans": 0}, {"q": "What happens to a bulb if the circuit is broken?", "opts": ["It stops glowing", "It glows brighter", "It explodes", "Nothing changes"], "ans": 0}, {"q": "Which of these is a source of electrical energy?", "opts": ["Battery/cell", "Magnet", "Mirror", "Lens"], "ans": 0}, {"q": "What does a switch do in a circuit?", "opts": ["Turns the current on or off", "Increases voltage always", "Stores electricity", "Produces light directly"], "ans": 0}, {"q": "What is the flow of electric charge called?", "opts": ["Electric current", "Voltage", "Resistance", "Power"], "ans": 0}, {"q": "What opposes the flow of electric current in a wire?", "opts": ["Resistance", "Voltage", "Current", "Charge"], "ans": 0}, {"q": "Which of these can generate sound?", "opts": ["Vibrating object", "Still object", "Frozen object", "Empty space"], "ans": 0}, {"q": "What is pitch of a sound related to?", "opts": ["Frequency", "Loudness", "Distance", "Colour"], "ans": 0}, {"q": "What is loudness of a sound related to?", "opts": ["Amplitude", "Frequency alone", "Distance from Earth", "Colour"], "ans": 0}, {"q": "What do we call a sudden loss of hearing capacity due to loud sound?", "opts": ["Noise pollution effect", "Vision loss", "Taste loss", "Smell loss"], "ans": 0}, {"q": "Which of these describes an object at rest?", "opts": ["An object with zero speed", "An object moving fast", "An object falling freely", "An object spinning"], "ans": 0}, {"q": "What is the tendency of an object to remain in its state of rest or motion called?", "opts": ["Inertia", "Momentum", "Friction", "Gravity"], "ans": 0}, {"q": "A heavier object has more of what property compared to a lighter one?", "opts": ["Inertia", "Speed", "Light", "Sound"], "ans": 0}, {"q": "What happens to a ball thrown upward due to gravity?", "opts": ["It slows down and falls back", "It keeps going up forever", "It stays still in air", "It moves sideways"], "ans": 0}, {"q": "Which planet do we live on?", "opts": ["Earth", "Mars", "Venus", "Jupiter"], "ans": 0}, {"q": "What pulls a falling apple toward the ground?", "opts": ["Gravity", "Friction", "Magnetism", "Light"], "ans": 0}, {"q": "Which of these best describes 'work' in physics?", "opts": ["Force applied over a distance", "Just applying force", "Just moving", "Only lifting objects"], "ans": 0}, {"q": "If you push a wall and it doesn't move, is work done in physics terms?", "opts": ["No work is done", "Yes, a lot of work is done", "Work is doubled", "Work depends on color"], "ans": 0}, {"q": "What is needed for work to be done in physics?", "opts": ["Force and displacement", "Only force", "Only displacement", "Only time"], "ans": 0}, {"q": "Which quantity tells us how fast work is done?", "opts": ["Power", "Force", "Mass", "Volume"], "ans": 0}, {"q": "Which of these is a form of potential energy?", "opts": ["Energy stored in a stretched spring", "Energy of a moving car", "Sound energy", "Light energy"], "ans": 0}, {"q": "Which of these is a form of kinetic energy?", "opts": ["Energy of a moving ball", "Energy stored in a battery", "Energy stored in food", "Energy in a stretched rubber band"], "ans": 0}, {"q": "Water stored in a dam has which type of energy?", "opts": ["Potential energy", "Kinetic energy only", "Sound energy", "Light energy"], "ans": 0}, {"q": "A moving car has which type of energy?", "opts": ["Kinetic energy", "Potential energy only", "Chemical energy only", "Sound energy only"], "ans": 0}, {"q": "Which of these converts electrical energy into light energy?", "opts": ["Bulb", "Fan", "Motor", "Speaker"], "ans": 0}, {"q": "Which of these converts electrical energy into sound energy?", "opts": ["Speaker", "Bulb", "Heater", "Lens"], "ans": 0}, {"q": "Which of these converts electrical energy into heat energy?", "opts": ["Electric heater", "Speaker", "Bulb (mostly light)", "Fan (mostly motion)"], "ans": 0}, {"q": "Which of these converts electrical energy into motion?", "opts": ["Electric motor/fan", "Bulb", "Heater", "Battery"], "ans": 0}, {"q": "Which of these is an example of chemical energy?", "opts": ["Energy stored in food", "Energy of sound", "Energy of light", "Energy of motion"], "ans": 0}, {"q": "Plants get energy for photosynthesis mainly from?", "opts": ["Sunlight", "Wind", "Water alone", "Soil alone"], "ans": 0}, {"q": "What do we call the path of a wave that moves up and down?", "opts": ["Transverse wave", "Longitudinal wave", "Sound wave only", "Light wave only"], "ans": 0}, {"q": "What do we call a wave that moves back and forth in the same direction as travel?", "opts": ["Longitudinal wave", "Transverse wave", "Light wave", "Electromagnetic wave"], "ans": 0}, {"q": "Which of these is an example of a transverse wave?", "opts": ["Light wave", "Sound wave in air", "Wave in a spring pushed and pulled", "Seismic P-wave"], "ans": 0}, {"q": "Which of these is an example of a longitudinal wave?", "opts": ["Sound wave", "Light wave", "Water surface wave", "Radio wave"], "ans": 0}, {"q": "How many metres are there in 1 kilometres?", "opts": ["1000", "997", "1003", "995"], "ans": 0}, {"q": "How many metres are there in 2 kilometres?", "opts": ["1799", "1995", "1999", "2000"], "ans": 3}, {"q": "How many metres are there in 3 kilometres?", "opts": ["2998", "3010", "3000", "2990"], "ans": 2}, {"q": "How many metres are there in 4 kilometres?", "opts": ["4000", "4010", "4003", "4001"], "ans": 0}, {"q": "How many metres are there in 5 kilometres?", "opts": ["4997", "4999", "5000", "4998"], "ans": 2}, {"q": "How many metres are there in 6 kilometres?", "opts": ["5998", "6000", "5997", "6601"], "ans": 1}, {"q": "How many metres are there in 7 kilometres?", "opts": ["7000", "7010", "6990", "6997"], "ans": 0}, {"q": "How many metres are there in 8 kilometres?", "opts": ["8005", "8002", "8000", "8003"], "ans": 2}, {"q": "How many metres are there in 9 kilometres?", "opts": ["9001", "9000", "8999", "8997"], "ans": 1}, {"q": "How many metres are there in 10 kilometres?", "opts": ["9999", "10000", "9995", "9990"], "ans": 1}, {"q": "How many metres are there in 11 kilometres?", "opts": ["10998", "11000", "12101", "9899"], "ans": 1}, {"q": "How many metres are there in 12 kilometres?", "opts": ["12003", "12010", "12005", "12000"], "ans": 3}, {"q": "How many metres are there in 13 kilometres?", "opts": ["13001", "13000", "12999", "12997"], "ans": 1}, {"q": "How many metres are there in 14 kilometres?", "opts": ["14000", "13990", "13998", "13999"], "ans": 0}, {"q": "How many metres are there in 15 kilometres?", "opts": ["13499", "16501", "14995", "15000"], "ans": 3}, {"q": "How many metres are there in 16 kilometres?", "opts": ["16005", "16003", "16000", "17601"], "ans": 2}, {"q": "How many metres are there in 17 kilometres?", "opts": ["17005", "17000", "16995", "15299"], "ans": 1}, {"q": "How many metres are there in 18 kilometres?", "opts": ["17997", "17998", "18000", "17999"], "ans": 2}, {"q": "How many metres are there in 19 kilometres?", "opts": ["19010", "19000", "20901", "17099"], "ans": 1}, {"q": "How many metres are there in 20 kilometres?", "opts": ["20002", "20003", "20005", "20000"], "ans": 3}, {"q": "How many metres are there in 21 kilometres?", "opts": ["21000", "20999", "21001", "20997"], "ans": 0}, {"q": "How many metres are there in 22 kilometres?", "opts": ["21990", "21997", "24201", "22000"], "ans": 3}, {"q": "How many metres are there in 23 kilometres?", "opts": ["22997", "22995", "23000", "25301"], "ans": 2}, {"q": "How many metres are there in 24 kilometres?", "opts": ["24000", "24010", "26401", "24003"], "ans": 0}, {"q": "How many metres are there in 25 kilometres?", "opts": ["24997", "24999", "25000", "24998"], "ans": 2}, {"q": "How many centimetres are there in 1 metres?", "opts": ["98", "97", "102", "100"], "ans": 3}, {"q": "How many centimetres are there in 2 metres?", "opts": ["199", "197", "200", "195"], "ans": 2}, {"q": "How many centimetres are there in 3 metres?", "opts": ["290", "299", "297", "300"], "ans": 3}, {"q": "How many centimetres are there in 4 metres?", "opts": ["399", "359", "400", "398"], "ans": 2}, {"q": "How many centimetres are there in 5 metres?", "opts": ["551", "449", "490", "500"], "ans": 3}, {"q": "How many centimetres are there in 6 metres?", "opts": ["598", "595", "600", "597"], "ans": 2}, {"q": "How many centimetres are there in 7 metres?", "opts": ["700", "705", "771", "710"], "ans": 0}, {"q": "How many centimetres are there in 8 metres?", "opts": ["803", "802", "805", "800"], "ans": 3}, {"q": "How many centimetres are there in 9 metres?", "opts": ["900", "905", "903", "897"], "ans": 0}, {"q": "How many centimetres are there in 10 metres?", "opts": ["1001", "899", "999", "1000"], "ans": 3}, {"q": "How many centimetres are there in 11 metres?", "opts": ["1102", "1095", "1100", "1098"], "ans": 2}, {"q": "How many centimetres are there in 12 metres?", "opts": ["1198", "1200", "1197", "1321"], "ans": 1}, {"q": "How many centimetres are there in 13 metres?", "opts": ["1299", "1169", "1295", "1300"], "ans": 3}, {"q": "How many centimetres are there in 14 metres?", "opts": ["1259", "1541", "1410", "1400"], "ans": 3}, {"q": "How many centimetres are there in 15 metres?", "opts": ["1505", "1495", "1500", "1497"], "ans": 2}, {"q": "How many centimetres are there in 16 metres?", "opts": ["1601", "1610", "1600", "1602"], "ans": 2}, {"q": "How many centimetres are there in 17 metres?", "opts": ["1700", "1698", "1697", "1702"], "ans": 0}, {"q": "How many centimetres are there in 18 metres?", "opts": ["1800", "1797", "1795", "1803"], "ans": 0}, {"q": "How many centimetres are there in 19 metres?", "opts": ["1895", "2091", "1900", "1898"], "ans": 2}, {"q": "How many centimetres are there in 20 metres?", "opts": ["2000", "1995", "1990", "1999"], "ans": 0}, {"q": "How many centimetres are there in 21 metres?", "opts": ["2097", "1889", "2100", "2311"], "ans": 2}, {"q": "How many centimetres are there in 22 metres?", "opts": ["2421", "2203", "2195", "2200"], "ans": 3}, {"q": "How many centimetres are there in 23 metres?", "opts": ["2300", "2305", "2069", "2531"], "ans": 0}, {"q": "How many centimetres are there in 24 metres?", "opts": ["2400", "2402", "2410", "2401"], "ans": 0}, {"q": "How many centimetres are there in 25 metres?", "opts": ["2505", "2500", "2499", "2501"], "ans": 1}, {"q": "How many millimetres are there in 1 centimetres?", "opts": ["7", "10", "8", "9"], "ans": 1}, {"q": "How many millimetres are there in 2 centimetres?", "opts": ["20", "17", "19", "18"], "ans": 0}, {"q": "How many millimetres are there in 3 centimetres?", "opts": ["40", "35", "30", "34"], "ans": 2}, {"q": "How many millimetres are there in 4 centimetres?", "opts": ["40", "43", "37", "35"], "ans": 0}, {"q": "How many millimetres are there in 5 centimetres?", "opts": ["47", "49", "40", "50"], "ans": 3}, {"q": "How many millimetres are there in 6 centimetres?", "opts": ["53", "57", "67", "60"], "ans": 3}, {"q": "How many millimetres are there in 7 centimetres?", "opts": ["69", "68", "70", "71"], "ans": 2}, {"q": "How many millimetres are there in 8 centimetres?", "opts": ["70", "80", "71", "79"], "ans": 1}, {"q": "How many millimetres are there in 9 centimetres?", "opts": ["90", "80", "88", "100"], "ans": 0}, {"q": "How many millimetres are there in 10 centimetres?", "opts": ["102", "100", "105", "98"], "ans": 1}, {"q": "How many millimetres are there in 11 centimetres?", "opts": ["110", "100", "107", "105"], "ans": 0}, {"q": "How many millimetres are there in 12 centimetres?", "opts": ["107", "130", "133", "120"], "ans": 3}, {"q": "How many millimetres are there in 13 centimetres?", "opts": ["128", "130", "132", "140"], "ans": 1}, {"q": "How many millimetres are there in 14 centimetres?", "opts": ["141", "139", "130", "140"], "ans": 3}, {"q": "How many millimetres are there in 15 centimetres?", "opts": ["140", "147", "160", "150"], "ans": 3}, {"q": "How many millimetres are there in 16 centimetres?", "opts": ["143", "170", "163", "160"], "ans": 3}, {"q": "How many millimetres are there in 17 centimetres?", "opts": ["170", "169", "160", "171"], "ans": 0}, {"q": "How many millimetres are there in 18 centimetres?", "opts": ["161", "170", "180", "199"], "ans": 2}, {"q": "How many millimetres are there in 19 centimetres?", "opts": ["192", "195", "193", "190"], "ans": 3}, {"q": "How many millimetres are there in 20 centimetres?", "opts": ["200", "199", "201", "197"], "ans": 0}, {"q": "How many millimetres are there in 21 centimetres?", "opts": ["232", "205", "200", "210"], "ans": 3}, {"q": "How many millimetres are there in 22 centimetres?", "opts": ["197", "218", "243", "220"], "ans": 3}, {"q": "How many millimetres are there in 23 centimetres?", "opts": ["230", "225", "232", "228"], "ans": 0}, {"q": "How many millimetres are there in 24 centimetres?", "opts": ["238", "235", "230", "240"], "ans": 3}, {"q": "How many millimetres are there in 25 centimetres?", "opts": ["260", "250", "240", "224"], "ans": 1}, {"q": "How many grams are there in 1 kilograms?", "opts": ["1000", "998", "995", "999"], "ans": 0}, {"q": "How many grams are there in 2 kilograms?", "opts": ["2000", "1799", "1995", "1990"], "ans": 0}, {"q": "How many grams are there in 3 kilograms?", "opts": ["3301", "3010", "3000", "2699"], "ans": 2}, {"q": "How many grams are there in 4 kilograms?", "opts": ["4001", "4005", "4002", "4000"], "ans": 3}, {"q": "How many grams are there in 5 kilograms?", "opts": ["5000", "4997", "5003", "5010"], "ans": 0}, {"q": "How many grams are there in 6 kilograms?", "opts": ["6601", "6000", "5997", "5998"], "ans": 1}, {"q": "How many grams are there in 7 kilograms?", "opts": ["7000", "6995", "6998", "6999"], "ans": 0}, {"q": "How many grams are there in 8 kilograms?", "opts": ["8010", "8002", "8000", "8001"], "ans": 2}, {"q": "How many grams are there in 9 kilograms?", "opts": ["9000", "8995", "8099", "9005"], "ans": 0}, {"q": "How many grams are there in 10 kilograms?", "opts": ["8999", "10000", "9995", "9990"], "ans": 1}, {"q": "How many grams are there in 11 kilograms?", "opts": ["10999", "10995", "10997", "11000"], "ans": 3}, {"q": "How many grams are there in 12 kilograms?", "opts": ["12000", "12010", "12001", "12003"], "ans": 0}, {"q": "How many grams are there in 13 kilograms?", "opts": ["12999", "13001", "13000", "13010"], "ans": 2}, {"q": "How many grams are there in 14 kilograms?", "opts": ["13997", "13998", "14000", "13990"], "ans": 2}, {"q": "How many grams are there in 15 kilograms?", "opts": ["15000", "14995", "14990", "15010"], "ans": 0}, {"q": "How many grams are there in 16 kilograms?", "opts": ["16001", "16000", "16010", "16002"], "ans": 1}, {"q": "How many grams are there in 17 kilograms?", "opts": ["16995", "17000", "16997", "15299"], "ans": 1}, {"q": "How many grams are there in 18 kilograms?", "opts": ["17997", "17999", "18000", "17995"], "ans": 2}, {"q": "How many grams are there in 19 kilograms?", "opts": ["19000", "18998", "18999", "18997"], "ans": 0}, {"q": "How many grams are there in 20 kilograms?", "opts": ["20002", "20000", "20010", "20003"], "ans": 1}, {"q": "How many grams are there in 21 kilograms?", "opts": ["20997", "21010", "21000", "21003"], "ans": 2}, {"q": "How many grams are there in 22 kilograms?", "opts": ["24201", "21990", "22000", "21995"], "ans": 2}, {"q": "How many grams are there in 23 kilograms?", "opts": ["23010", "22990", "23000", "22998"], "ans": 2}, {"q": "How many grams are there in 24 kilograms?", "opts": ["24001", "24000", "24002", "26401"], "ans": 1}, {"q": "How many grams are there in 25 kilograms?", "opts": ["24998", "25000", "24995", "25002"], "ans": 1}, {"q": "How many milligrams are there in 1 grams?", "opts": ["1000", "999", "997", "998"], "ans": 0}, {"q": "How many milligrams are there in 2 grams?", "opts": ["2000", "1799", "1990", "1995"], "ans": 0}, {"q": "How many milligrams are there in 3 grams?", "opts": ["2997", "3000", "3301", "2699"], "ans": 1}, {"q": "How many milligrams are there in 4 grams?", "opts": ["4002", "4003", "4000", "3599"], "ans": 2}, {"q": "How many milligrams are there in 5 grams?", "opts": ["4999", "4998", "5001", "5000"], "ans": 3}, {"q": "How many milligrams are there in 6 grams?", "opts": ["6601", "5995", "5999", "6000"], "ans": 3}, {"q": "How many milligrams are there in 7 grams?", "opts": ["7010", "6990", "7000", "6995"], "ans": 2}, {"q": "How many milligrams are there in 8 grams?", "opts": ["8000", "8002", "8003", "8010"], "ans": 0}, {"q": "How many milligrams are there in 9 grams?", "opts": ["8998", "9000", "8999", "8099"], "ans": 1}, {"q": "How many milligrams are there in 10 grams?", "opts": ["10000", "9997", "8999", "9999"], "ans": 0}, {"q": "How many milligrams are there in 11 grams?", "opts": ["11000", "9899", "10995", "12101"], "ans": 0}, {"q": "How many milligrams are there in 12 grams?", "opts": ["12010", "12000", "12002", "12001"], "ans": 1}, {"q": "How many milligrams are there in 13 grams?", "opts": ["13000", "12997", "13001", "12999"], "ans": 0}, {"q": "How many milligrams are there in 14 grams?", "opts": ["13997", "13998", "14000", "13999"], "ans": 2}, {"q": "How many milligrams are there in 15 grams?", "opts": ["14999", "14995", "14998", "15000"], "ans": 3}, {"q": "How many milligrams are there in 16 grams?", "opts": ["16010", "16003", "17601", "16000"], "ans": 3}, {"q": "How many milligrams are there in 17 grams?", "opts": ["17000", "15299", "16999", "16998"], "ans": 0}, {"q": "How many milligrams are there in 18 grams?", "opts": ["18000", "17998", "16199", "17990"], "ans": 0}, {"q": "How many milligrams are there in 19 grams?", "opts": ["20901", "19010", "19000", "17099"], "ans": 2}, {"q": "How many milligrams are there in 20 grams?", "opts": ["20000", "20010", "20002", "20005"], "ans": 0}, {"q": "How many minutes are there in 1 hours?", "opts": ["57", "50", "60", "70"], "ans": 2}, {"q": "How many minutes are there in 2 hours?", "opts": ["120", "107", "117", "133"], "ans": 0}, {"q": "How many minutes are there in 3 hours?", "opts": ["199", "170", "180", "161"], "ans": 2}, {"q": "How many minutes are there in 4 hours?", "opts": ["240", "239", "235", "238"], "ans": 0}, {"q": "How many minutes are there in 5 hours?", "opts": ["300", "297", "331", "299"], "ans": 0}, {"q": "How many minutes are there in 6 hours?", "opts": ["355", "359", "360", "358"], "ans": 2}, {"q": "How many minutes are there in 7 hours?", "opts": ["421", "420", "419", "418"], "ans": 1}, {"q": "How many minutes are there in 8 hours?", "opts": ["431", "485", "481", "480"], "ans": 3}, {"q": "How many minutes are there in 9 hours?", "opts": ["595", "485", "545", "540"], "ans": 3}, {"q": "How many minutes are there in 10 hours?", "opts": ["600", "610", "597", "590"], "ans": 0}, {"q": "How many minutes are there in 11 hours?", "opts": ["593", "659", "650", "660"], "ans": 3}, {"q": "How many minutes are there in 12 hours?", "opts": ["717", "719", "710", "720"], "ans": 3}, {"q": "How many minutes are there in 13 hours?", "opts": ["780", "775", "782", "778"], "ans": 0}, {"q": "How many minutes are there in 14 hours?", "opts": ["838", "835", "840", "842"], "ans": 2}, {"q": "How many minutes are there in 15 hours?", "opts": ["900", "897", "905", "903"], "ans": 0}, {"q": "How many minutes are there in 16 hours?", "opts": ["963", "965", "960", "970"], "ans": 2}, {"q": "How many minutes are there in 17 hours?", "opts": ["1020", "1025", "1017", "1015"], "ans": 0}, {"q": "How many minutes are there in 18 hours?", "opts": ["1080", "1189", "971", "1077"], "ans": 0}, {"q": "How many minutes are there in 19 hours?", "opts": ["1135", "1130", "1140", "1138"], "ans": 2}, {"q": "How many minutes are there in 20 hours?", "opts": ["1321", "1198", "1200", "1195"], "ans": 2}, {"q": "How many minutes are there in 21 hours?", "opts": ["1257", "1387", "1250", "1260"], "ans": 3}, {"q": "How many minutes are there in 22 hours?", "opts": ["1317", "1319", "1320", "1315"], "ans": 2}, {"q": "How many minutes are there in 23 hours?", "opts": ["1380", "1385", "1383", "1377"], "ans": 0}, {"q": "How many minutes are there in 24 hours?", "opts": ["1295", "1443", "1440", "1445"], "ans": 2}, {"q": "How many minutes are there in 25 hours?", "opts": ["1505", "1500", "1349", "1510"], "ans": 1}, {"q": "How many seconds are there in 1 minutes?", "opts": ["50", "57", "70", "60"], "ans": 3}, {"q": "How many seconds are there in 2 minutes?", "opts": ["115", "107", "133", "120"], "ans": 3}, {"q": "How many seconds are there in 3 minutes?", "opts": ["177", "170", "178", "180"], "ans": 3}, {"q": "How many seconds are there in 4 minutes?", "opts": ["240", "237", "265", "235"], "ans": 0}, {"q": "How many seconds are there in 5 minutes?", "opts": ["300", "298", "299", "297"], "ans": 0}, {"q": "How many seconds are there in 6 minutes?", "opts": ["323", "360", "359", "361"], "ans": 1}, {"q": "How many seconds are there in 7 minutes?", "opts": ["421", "418", "420", "419"], "ans": 2}, {"q": "How many seconds are there in 8 minutes?", "opts": ["485", "482", "483", "480"], "ans": 3}, {"q": "How many seconds are there in 9 minutes?", "opts": ["595", "485", "545", "540"], "ans": 3}, {"q": "How many seconds are there in 10 minutes?", "opts": ["610", "597", "600", "590"], "ans": 2}, {"q": "How many seconds are there in 11 minutes?", "opts": ["659", "650", "660", "657"], "ans": 2}, {"q": "How many seconds are there in 12 minutes?", "opts": ["647", "719", "720", "717"], "ans": 2}, {"q": "How many seconds are there in 13 minutes?", "opts": ["778", "779", "780", "775"], "ans": 2}, {"q": "How many seconds are there in 14 minutes?", "opts": ["840", "837", "835", "843"], "ans": 0}, {"q": "How many seconds are there in 15 minutes?", "opts": ["899", "901", "905", "900"], "ans": 3}, {"q": "How many seconds are there in 16 minutes?", "opts": ["960", "965", "1057", "963"], "ans": 0}, {"q": "How many seconds are there in 17 minutes?", "opts": ["1019", "1020", "1018", "1017"], "ans": 1}, {"q": "How many seconds are there in 18 minutes?", "opts": ["1090", "971", "1080", "1189"], "ans": 2}, {"q": "How many seconds are there in 19 minutes?", "opts": ["1025", "1137", "1140", "1255"], "ans": 2}, {"q": "How many seconds are there in 20 minutes?", "opts": ["1200", "1195", "1198", "1199"], "ans": 0}, {"q": "How many seconds are there in 21 minutes?", "opts": ["1259", "1250", "1260", "1257"], "ans": 2}, {"q": "How many seconds are there in 22 minutes?", "opts": ["1322", "1318", "1317", "1320"], "ans": 3}, {"q": "How many seconds are there in 23 minutes?", "opts": ["1378", "1377", "1380", "1379"], "ans": 2}, {"q": "How many seconds are there in 24 minutes?", "opts": ["1443", "1295", "1441", "1440"], "ans": 3}, {"q": "How many seconds are there in 25 minutes?", "opts": ["1500", "1651", "1349", "1497"], "ans": 0}, {"q": "How many hours are there in 1 days?", "opts": ["24", "14", "19", "34"], "ans": 0}, {"q": "How many hours are there in 2 days?", "opts": ["43", "47", "48", "45"], "ans": 2}, {"q": "How many hours are there in 3 days?", "opts": ["72", "64", "67", "69"], "ans": 0}, {"q": "How many hours are there in 4 days?", "opts": ["98", "96", "101", "97"], "ans": 1}, {"q": "How many hours are there in 5 days?", "opts": ["130", "120", "118", "110"], "ans": 1}, {"q": "How many hours are there in 6 days?", "opts": ["143", "144", "129", "142"], "ans": 1}, {"q": "How many hours are there in 7 days?", "opts": ["165", "168", "166", "170"], "ans": 1}, {"q": "How many hours are there in 8 days?", "opts": ["194", "172", "193", "192"], "ans": 3}, {"q": "How many hours are there in 9 days?", "opts": ["194", "216", "226", "238"], "ans": 1}, {"q": "How many hours are there in 10 days?", "opts": ["235", "240", "239", "238"], "ans": 1}, {"q": "How many hours are there in 11 days?", "opts": ["264", "262", "259", "266"], "ans": 0}, {"q": "How many hours are there in 12 days?", "opts": ["288", "291", "293", "289"], "ans": 0}, {"q": "How many hours are there in 13 days?", "opts": ["312", "322", "309", "302"], "ans": 0}, {"q": "How many hours are there in 14 days?", "opts": ["336", "326", "331", "335"], "ans": 0}, {"q": "How many hours are there in 15 days?", "opts": ["358", "360", "355", "323"], "ans": 1}, {"q": "How many days are there in 1 weeks?", "opts": ["2", "6", "4", "7"], "ans": 3}, {"q": "How many days are there in 2 weeks?", "opts": ["13", "9", "14", "4"], "ans": 2}, {"q": "How many days are there in 3 weeks?", "opts": ["20", "18", "16", "21"], "ans": 3}, {"q": "How many days are there in 4 weeks?", "opts": ["38", "18", "28", "25"], "ans": 2}, {"q": "How many days are there in 5 weeks?", "opts": ["35", "36", "34", "39"], "ans": 0}, {"q": "How many days are there in 6 weeks?", "opts": ["40", "42", "41", "39"], "ans": 1}, {"q": "How many days are there in 7 weeks?", "opts": ["47", "48", "39", "49"], "ans": 3}, {"q": "How many days are there in 8 weeks?", "opts": ["66", "46", "56", "50"], "ans": 2}, {"q": "How many days are there in 9 weeks?", "opts": ["63", "65", "70", "73"], "ans": 0}, {"q": "How many days are there in 10 weeks?", "opts": ["73", "78", "67", "70"], "ans": 3}, {"q": "How many days are there in 11 weeks?", "opts": ["76", "77", "67", "72"], "ans": 1}, {"q": "How many days are there in 12 weeks?", "opts": ["82", "81", "83", "84"], "ans": 3}, {"q": "How many days are there in 13 weeks?", "opts": ["81", "91", "88", "101"], "ans": 1}, {"q": "How many days are there in 14 weeks?", "opts": ["103", "101", "108", "98"], "ans": 3}, {"q": "How many days are there in 15 weeks?", "opts": ["105", "102", "103", "100"], "ans": 0}, {"q": "How many millilitres are there in 1 litres?", "opts": ["998", "1000", "899", "995"], "ans": 1}, {"q": "How many millilitres are there in 2 litres?", "opts": ["1995", "2000", "1799", "1998"], "ans": 1}, {"q": "How many millilitres are there in 3 litres?", "opts": ["2998", "3010", "3000", "2990"], "ans": 2}, {"q": "How many millilitres are there in 4 litres?", "opts": ["4000", "4005", "3599", "4010"], "ans": 0}, {"q": "How many millilitres are there in 5 litres?", "opts": ["5001", "4999", "5000", "4997"], "ans": 2}, {"q": "How many millilitres are there in 6 litres?", "opts": ["5990", "5997", "5998", "6000"], "ans": 3}, {"q": "How many millilitres are there in 7 litres?", "opts": ["7010", "6998", "7000", "6990"], "ans": 2}, {"q": "How many millilitres are there in 8 litres?", "opts": ["8010", "8002", "8000", "8005"], "ans": 2}, {"q": "How many millilitres are there in 9 litres?", "opts": ["9000", "8998", "8999", "8997"], "ans": 0}, {"q": "How many millilitres are there in 10 litres?", "opts": ["9998", "9999", "9995", "10000"], "ans": 3}, {"q": "How many millilitres are there in 11 litres?", "opts": ["11000", "10995", "10999", "10998"], "ans": 0}, {"q": "How many millilitres are there in 12 litres?", "opts": ["10799", "12000", "12001", "12002"], "ans": 1}, {"q": "How many millilitres are there in 13 litres?", "opts": ["13001", "12998", "12999", "13000"], "ans": 3}, {"q": "How many millilitres are there in 14 litres?", "opts": ["15401", "13995", "14000", "13999"], "ans": 2}, {"q": "How many millilitres are there in 15 litres?", "opts": ["15010", "14995", "14990", "15000"], "ans": 3}, {"q": "How many millilitres are there in 16 litres?", "opts": ["16001", "16010", "16002", "16000"], "ans": 3}, {"q": "How many millilitres are there in 17 litres?", "opts": ["16999", "16998", "17000", "15299"], "ans": 2}, {"q": "How many millilitres are there in 18 litres?", "opts": ["17999", "17997", "17990", "18000"], "ans": 3}, {"q": "How many millilitres are there in 19 litres?", "opts": ["19010", "18990", "19000", "18997"], "ans": 2}, {"q": "How many millilitres are there in 20 litres?", "opts": ["17999", "20003", "20010", "20000"], "ans": 3}, {"q": "How many months are there in 1 years?", "opts": ["2", "10", "12", "7"], "ans": 2}, {"q": "How many months are there in 2 years?", "opts": ["21", "23", "24", "19"], "ans": 2}, {"q": "How many months are there in 3 years?", "opts": ["34", "32", "38", "36"], "ans": 3}, {"q": "How many months are there in 4 years?", "opts": ["46", "48", "47", "45"], "ans": 1}, {"q": "How many months are there in 5 years?", "opts": ["50", "60", "58", "70"], "ans": 1}, {"q": "How many months are there in 6 years?", "opts": ["67", "72", "69", "64"], "ans": 1}, {"q": "How many months are there in 7 years?", "opts": ["84", "83", "82", "79"], "ans": 0}, {"q": "How many months are there in 8 years?", "opts": ["101", "106", "96", "97"], "ans": 2}, {"q": "How many months are there in 9 years?", "opts": ["103", "108", "106", "105"], "ans": 1}, {"q": "How many months are there in 10 years?", "opts": ["117", "120", "133", "107"], "ans": 1}, {"q": "How many months are there in 11 years?", "opts": ["131", "130", "133", "132"], "ans": 3}, {"q": "How many months are there in 12 years?", "opts": ["144", "142", "143", "141"], "ans": 0}, {"q": "How many months are there in 13 years?", "opts": ["146", "154", "166", "156"], "ans": 3}, {"q": "How many months are there in 14 years?", "opts": ["178", "170", "168", "166"], "ans": 2}, {"q": "How many months are there in 15 years?", "opts": ["180", "161", "178", "199"], "ans": 0}, {"q": "How many kilometres are there in 1000 metres?", "opts": ["1", "2", "0", "3"], "ans": 0}, {"q": "How many kilometres are there in 2000 metres?", "opts": ["1", "3", "2", "0"], "ans": 2}, {"q": "How many kilometres are there in 3000 metres?", "opts": ["0", "3", "5", "1"], "ans": 1}, {"q": "How many kilometres are there in 4000 metres?", "opts": ["2", "4", "1", "3"], "ans": 1}, {"q": "How many kilometres are there in 5000 metres?", "opts": ["4", "3", "2", "5"], "ans": 3}, {"q": "How many kilometres are there in 6000 metres?", "opts": ["6", "4", "1", "5"], "ans": 0}, {"q": "How many kilometres are there in 7000 metres?", "opts": ["2", "5", "6", "7"], "ans": 3}, {"q": "How many kilometres are there in 8000 metres?", "opts": ["7", "8", "5", "3"], "ans": 1}, {"q": "How many kilometres are there in 9000 metres?", "opts": ["9", "4", "8", "7"], "ans": 0}, {"q": "How many kilometres are there in 10000 metres?", "opts": ["8", "7", "10", "9"], "ans": 2}, {"q": "How many kilometres are there in 11000 metres?", "opts": ["9", "1", "6", "11"], "ans": 3}, {"q": "How many kilometres are there in 12000 metres?", "opts": ["10", "7", "12", "11"], "ans": 2}, {"q": "How many kilometres are there in 13000 metres?", "opts": ["8", "10", "13", "3"], "ans": 2}, {"q": "How many kilometres are there in 14000 metres?", "opts": ["14", "4", "12", "13"], "ans": 0}, {"q": "How many kilometres are there in 15000 metres?", "opts": ["15", "5", "12", "10"], "ans": 0}, {"q": "A car travels 200 km in 5 hours at constant speed. What is its speed?", "opts": ["40 km/h", "35 km/h", "45 km/h", "30 km/h"], "ans": 0}, {"q": "A car travels 150 km in 6 hours at constant speed. What is its speed?", "opts": ["25 km/h", "30 km/h", "15 km/h", "35 km/h"], "ans": 0}, {"q": "A car travels 50 km in 2 hours at constant speed. What is its speed?", "opts": ["25 km/h", "40 km/h", "20 km/h", "45 km/h"], "ans": 0}, {"q": "A car travels 150 km in 3 hours at constant speed. What is its speed?", "opts": ["70 km/h", "50 km/h", "45 km/h", "60 km/h"], "ans": 1}, {"q": "A car travels 300 km in 5 hours at constant speed. What is its speed?", "opts": ["80 km/h", "60 km/h", "55 km/h", "65 km/h"], "ans": 1}, {"q": "A car travels 30 km in 3 hours at constant speed. What is its speed?", "opts": ["10 km/h", "5 km/h", "25 km/h", "15 km/h"], "ans": 0}, {"q": "A car travels 40 km in 2 hours at constant speed. What is its speed?", "opts": ["40 km/h", "15 km/h", "20 km/h", "30 km/h"], "ans": 2}, {"q": "A car travels 100 km in 5 hours at constant speed. What is its speed?", "opts": ["30 km/h", "20 km/h", "35 km/h", "10 km/h"], "ans": 1}, {"q": "A car travels 10 km in 1 hours at constant speed. What is its speed?", "opts": ["15 km/h", "5 km/h", "10 km/h", "25 km/h"], "ans": 2}, {"q": "A car travels 60 km in 1 hours at constant speed. What is its speed?", "opts": ["65 km/h", "60 km/h", "50 km/h", "75 km/h"], "ans": 1}, {"q": "A car travels 90 km in 3 hours at constant speed. What is its speed?", "opts": ["25 km/h", "10 km/h", "45 km/h", "30 km/h"], "ans": 3}, {"q": "A car travels 25 km in 5 hours at constant speed. What is its speed?", "opts": ["10 km/h", "20 km/h", "5 km/h", "25 km/h"], "ans": 2}, {"q": "A car travels 60 km in 3 hours at constant speed. What is its speed?", "opts": ["20 km/h", "40 km/h", "15 km/h", "10 km/h"], "ans": 0}];

// ── Question Bank Helpers ─────────────────────────────────────────────────

// Build a section's full pool: 100 basic + 100 medium + 150 hard (tagged)
function buildPool(basic, medium, hard){
  const tag=(arr,t)=>arr.map(q=>({...q,tier:t}));
  return[...tag(basic,'basic'),...tag(medium,'medium'),...tag(hard,'hard')];
}
const POOLS={
  Biology: buildPool(BIO_BASIC,BIO_MEDIUM,BIO_HARD),
  GK:      buildPool(GK_BASIC,GK_MEDIUM,GK_HARD),
  Physics: shuffle(PHYSICS),
};

// Speed — random quick-fire questions generated on the fly, no pool needed
function genSpeedQ(){
  const types=[
    ()=>{const a=Math.floor(Math.random()*20)+1,b=Math.floor(Math.random()*20)+1,ans=a+b;const opts=shuffle([ans,ans+rnd(),ans-rnd(),ans+rnd()*2]).slice(0,4);return{q:`${a} + ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*20)+5,b=Math.floor(Math.random()*10)+1,ans=a-b;const opts=shuffle([ans,ans+rnd(),ans-rnd(),ans+2]).slice(0,4);return{q:`${a} - ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*10)+2,b=Math.floor(Math.random()*10)+2,ans=a*b;const opts=shuffle([ans,ans+rnd(),ans-rnd(),ans+rnd()*2]).slice(0,4);return{q:`${a} × ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'medium'};},
    ()=>{const b=Math.floor(Math.random()*9)+2,ans=Math.floor(Math.random()*9)+2,a=b*ans;const opts=shuffle([ans,ans+rnd(),ans-rnd(),ans+2]).slice(0,4);return{q:`${a} ÷ ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'medium'};},
    ()=>{const a=Math.floor(Math.random()*50)+10,ans=a*2;const opts=shuffle([ans,ans+rnd()*2,ans-rnd()*2,ans+10]).slice(0,4);return{q:`Double of ${a}?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=(Math.floor(Math.random()*25)+1)*2,ans=a/2;const opts=shuffle([ans,ans+rnd(),ans-rnd(),ans+2]).slice(0,4);return{q:`Half of ${a}?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*11)+2,ans=a*a;const opts=shuffle([ans,ans+rnd()*2,ans-rnd()*2,ans+a]).slice(0,4);return{q:`${a} squared = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'hard'};},
    ()=>{const mins=[15,30,45,60,90,120];const m=mins[Math.floor(Math.random()*mins.length)];const ans=m*60;const opts=shuffle([ans,ans+60,ans-60,ans+120]).slice(0,4);return{q:`${m} minutes = ? seconds`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'medium'};},
    ()=>{const n=Math.floor(Math.random()*20)+2,ans=n%2===0?'Even':'Odd';const opts=['Even','Odd','Neither','Both'];return{q:`Is ${n} even or odd?`,opts,ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*9)+1,ans=a*10;const opts=shuffle([ans,ans+10,ans-10,ans+20]).slice(0,4);return{q:`${a} × 10 = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*9)+1,ans=a*100;const opts=shuffle([ans,ans+100,ans-100,ans+200]).slice(0,4);return{q:`${a} × 100 = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*30)+10,ans=a+a+a;const opts=shuffle([ans,ans+3,ans-3,ans+6]).slice(0,4);return{q:`Triple of ${a}?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'medium'};},
    ()=>{const hrs=[1,2,3,4,5,6,12];const h=hrs[Math.floor(Math.random()*hrs.length)];const ans=h*60;const opts=shuffle([ans,ans+30,ans-30,ans+60]).slice(0,4);return{q:`${h} hour${h>1?'s':''} = ? minutes`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'basic'};},
    ()=>{const a=Math.floor(Math.random()*8)+2,b=Math.floor(Math.random()*8)+2,ans=a*b+rnd();const wrong=a*b;const opts=shuffle([wrong,wrong+rnd(),wrong-rnd(),wrong+rnd()*2]).slice(0,4);return{q:`${a} × ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(wrong),tier:'medium'};},
    ()=>{const a=Math.floor(Math.random()*50)+50,b=Math.floor(Math.random()*50)+1,ans=a+b;const opts=shuffle([ans,ans+rnd()*2,ans-rnd()*2,ans+10]).slice(0,4);return{q:`${a} + ${b} = ?`,opts:opts.map(String),ans:opts.indexOf(ans),tier:'medium'};},
  ];
  function rnd(){return Math.floor(Math.random()*5)+1;}
  const gen=types[Math.floor(Math.random()*types.length)]();
  // Ensure exactly 4 unique opts
  const seen=new Set();
  const safeOpts=[];
  gen.opts.forEach(o=>{if(!seen.has(o)){seen.add(o);safeOpts.push(o);}});
  while(safeOpts.length<4){const x=String(Math.floor(Math.random()*50)+1);if(!seen.has(x)){seen.add(x);safeOpts.push(x);}}
  const correctVal=gen.opts[gen.ans];
  const newAns=safeOpts.indexOf(String(correctVal));
  return{...gen,opts:safeOpts,ans:Math.max(0,newAns)};
}

// Build a Speed queue of 50 random questions
function buildSpeedQueue(){
  return Array.from({length:50},()=>genSpeedQ());
}

// Seen-question tracking per section (hash-based, localStorage)
function hashQ(str){let h=0;for(let i=0;i<str.length;i++){h=(Math.imul(31,h)+str.charCodeAt(i))|0;}return(h>>>0).toString(36);}
const MAX_SEEN=400;
function loadSeen(){
  try{const s=localStorage.getItem("bd_seen_v3");return s?JSON.parse(s):{Biology:[],GK:[],Speed:[]};}
  catch(e){return{Biology:[],GK:[],Speed:[]};}
}
function saveSeen(s){try{localStorage.setItem("bd_seen_v3",JSON.stringify(s));}catch(e){}}
const SESSION_SEEN=loadSeen();

// Build a shuffled queue for a section respecting tier order per game:
// Q1-5: basic  Q6-10: medium  Q11+: hard (then hard → medium → basic zigzag after 300)
function buildQueue(sName, seenHashes){
  if(sName==="Speed") return buildSpeedQueue();
  if(sName==="Physics"){
    const pool=POOLS.Physics||[];
    const unseen=pool.filter(q=>!seenHashes.includes(hashQ(q.q)));
    return shuffle(unseen.length>10?unseen:pool);
  }
  const pool=POOLS[sName];
  if(!pool) return [];
  // separate tiers, filter already-seen
  const unseen=pool.filter(q=>!seenHashes.includes(hashQ(q.q)));
  // if all seen, reset (zigzag — shuffle everything)
  const source=unseen.length>0?unseen:shuffle(pool);
  const basic=shuffle(source.filter(q=>q.tier==='basic'));
  const medium=shuffle(source.filter(q=>q.tier==='medium'));
  const hard=shuffle(source.filter(q=>q.tier==='hard'));
  // Slot: 5 basic, 5 medium, then alternate hard/medium/basic zigzag
  const queue=[];
  const bSlice=basic.splice(0,5);
  const mSlice=medium.splice(0,5);
  queue.push(...bSlice,...mSlice);
  // Rest: prioritise hard, then zigzag
  const rest=[...hard,...medium,...basic];
  // zigzag: shuffle rest
  queue.push(...shuffle(rest));
  return queue;
}

function isOnline(){return typeof navigator!=="undefined"?navigator.onLine:true;}

const SECTIONS=["Biology","GK","Physics","Speed"];
const SEC_COLOR={Biology:C.green, GK:C.gk, Physics:C.purple, Speed:C.speed};
const SEC_TIME={Biology:60, GK:60, Physics:60, Speed:60};
const SEC_ICON={Biology:"🧬", GK:"🌍", Physics:"⚛️", Speed:"⚡"};


function BrainDashScreen({onBack,highScore,onNewHigh,playSound,onStatsUpdate,stats}){
  const [phase,setPhase]=useState("intro");
  const [sIdx,setSIdx]=useState(0);
  const [currentQ,setCurrentQ]=useState(null);
  const [history,setHistory]=useState([]); // last 50 questions for back navigation
  const [histIdx,setHistIdx]=useState(-1); // -1 = showing live question
  const [qNum,setQNum]=useState(0);
  const [pickedOpt,setPickedOpt]=useState(null);
  const [timeLeft,setTimeLeft]=useState(0);
  const [scores,setScores]=useState({Biology:0,GK:0,Physics:0,Speed:0});
  const [totals,setTotals]=useState({Biology:0,GK:0,Physics:0,Speed:0});
  const [skipped,setSkipped]=useState(0);
  const timerRef=useRef(null);
  const sIdxRef=useRef(0);
  const queueRef=useRef([]); // pre-built question queue for current section
  const seenRef=useRef(SESSION_SEEN); // hash-based seen tracker, persisted

  const section=SECTIONS[sIdx];
  const color=SEC_COLOR[section];

  // No API — works fully offline


  function pickNextQ(sName){
    if(queueRef.current.length===0){
      // All questions seen — reset and restart with zigzag shuffle
      seenRef.current[sName]=[];
      saveSeen(seenRef.current);
      queueRef.current=buildQueue(sName,[]);
    }
    const next=queueRef.current.shift();
    if(!next) return null;
    const h=hashQ(next.q);
    const cur=seenRef.current[sName]||[];
    seenRef.current[sName]=cur.length>=MAX_SEEN?[...cur.slice(-MAX_SEEN+1),h]:[...cur,h];
    saveSeen(seenRef.current);
    return next;
  }



  function startSection(idx){
    clearInterval(timerRef.current);
    sIdxRef.current=idx;
    const sName=SECTIONS[idx];
    setSIdx(idx);
    setQNum(1);
    setPickedOpt(null);
    setCurrentQ(null);
    setHistory([]);
    setHistIdx(-1);
    // Build fresh queue for this section
    queueRef.current=buildQueue(sName,seenRef.current[sName]||[]);
    const q=pickNextQ(sName);
    if(!q) return;
    setCurrentQ(q);
    setTimeLeft(SEC_TIME[sName]);
    setPhase("playing");
  }

  useEffect(()=>{
    if(phase!=="playing") return;
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setTimeLeft(p=>{
        if(p<=1){clearInterval(timerRef.current);setPhase("section_done");}
        return Math.max(p-1,0);
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[phase,sIdx]);

  function handlePick(i){
    if(pickedOpt!==null||phase!=="playing"||!currentQ||histIdx!==-1) return;
    const correct=i===currentQ.ans;
    const s=SECTIONS[sIdxRef.current];
    setPickedOpt(i);
    if(correct){setScores(p=>({...p,[s]:p[s]+1}));playSound("correct");}
    setTotals(p=>({...p,[s]:p[s]+1}));
    // Save to history (max 50)
    setHistory(h=>[...h.slice(-49),{q:currentQ,picked:i}]);
    setTimeout(()=>{
      const sName=SECTIONS[sIdxRef.current];
      const next=pickNextQ(sName);
      if(!next) return;
      setCurrentQ(next);
      setPickedOpt(null);
      setQNum(n=>n+1);
    },600);
  }

  function handleSkip(){
    if(phase!=="playing"||!currentQ||pickedOpt!==null||histIdx!==-1) return;
    playSound("skip");
    setSkipped(p=>p+1);
    const sName=SECTIONS[sIdxRef.current];
    const next=pickNextQ(sName);
    if(!next) return;
    setHistory(h=>[...h.slice(-49),{q:currentQ,picked:"skipped"}]);
    setCurrentQ(next);
    setPickedOpt(null);
    setQNum(n=>n+1);
  }

  function handleBack(){
    if(histIdx===-1){
      // go into history
      if(history.length===0) return;
      setHistIdx(history.length-1);
    } else if(histIdx>0){
      setHistIdx(histIdx-1);
    }
  }

  function handleForward(){
    if(histIdx===-1) return;
    if(histIdx<history.length-1){
      setHistIdx(histIdx+1);
    } else {
      setHistIdx(-1); // back to live question
    }
  }

  const displayQ=histIdx===-1?currentQ:(history[histIdx]?.q||null);
  const displayPicked=histIdx===-1?pickedOpt:(history[histIdx]?.picked);

  function goNextSection(){
    if(sIdx+1<SECTIONS.length) startSection(sIdx+1);
    else finishGame();
  }

  function finishGame(){
    clearInterval(timerRef.current);
    const total=Object.values(scores).reduce((a,b)=>a+b,0);
    onNewHigh(total);
    playSound("confetti");
    if(onStatsUpdate&&stats){
      const newTotal={};const newCorrect={};
      SECTIONS.forEach(s=>{
        newTotal[s]=(stats.totalQ[s]||0)+(totals[s]||0);
        newCorrect[s]=(stats.correctQ[s]||0)+(scores[s]||0);
      });
      onStatsUpdate({totalQ:newTotal,correctQ:newCorrect,gamesPlayed:(stats.gamesPlayed||0)+1,skipped:(stats.skipped||0)+skipped});
    }
    setPhase("summary");
  }

  function reset(){
    clearInterval(timerRef.current);
    queueRef.current=[];
    setPhase("intro");setSIdx(0);setCurrentQ(null);
    setHistory([]);setHistIdx(-1);
    setQNum(0);setPickedOpt(null);setSkipped(0);
    setScores({Biology:0,GK:0,Physics:0,Speed:0});
    setTotals({Biology:0,GK:0,Physics:0,Speed:0});
  }

  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const totalAnswered=Object.values(totals).reduce((a,b)=>a+b,0);

  return(
    <GameScreen title="BrainDash" accent={color||C.purple} onBack={()=>{clearInterval(timerRef.current);onBack();}}
      meta={phase==="playing"?<>
        <MetaBadge label={section} value={`${scores[section]}/${totals[section]}`} color={color}/>
        <MetaBadge label="Time" value={timeLeft} color={timeLeft<=10?C.bad:C.purple}/>
      </>:<></>}>

      {phase==="intro"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
          <p style={{margin:0,color:C.sub,fontSize:13,textAlign:"center",lineHeight:"20px"}}>
            4 sections — 1500 questions total, no internet needed!<br/>Questions shuffle fresh every game, never repeat until all seen.
          </p>
          {highScore>0&&<div style={{backgroundColor:C.gold+"18",border:`1px solid ${C.gold}33`,borderRadius:R.md,padding:"8px 18px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:10,color:C.gold,fontWeight:700,letterSpacing:1}}>HIGH SCORE</p>
            <p style={{margin:0,fontSize:22,fontWeight:900,color:C.gold}}>{highScore}</p>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,width:"100%"}}>
            {SECTIONS.map(s=>(
              <div key={s} style={{backgroundColor:C.bg,border:`1px solid ${SEC_COLOR[s]}33`,borderRadius:R.md,padding:"10px 12px"}}>
                <p style={{margin:0,fontWeight:700,fontSize:13,color:SEC_COLOR[s]}}>{SEC_ICON[s]} {s}</p>
                <p style={{margin:"3px 0 0",color:C.muted,fontSize:11}}>{SEC_TIME[s]}s · No repeats</p>
              </div>
            ))}
          </div>
          <PrimaryBtn label="Start BrainDash" color={C.purple} onClick={()=>startSection(0)}/>
        </div>
      )}





      {phase==="section_done"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{width:60,height:60,borderRadius:"50%",backgroundColor:color+"22",border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:28}}>{SEC_ICON[section]}</span>
          </div>
          <p style={{margin:0,fontSize:21,fontWeight:700,fontFamily:FONT_DISPLAY,color:C.text}}>{section} Done! 🎊</p>
          <p style={{margin:0,color:C.sub,fontSize:13}}>Scored {scores[section]} out of {totals[section]} answered</p>
          {sIdx+1<SECTIONS.length
            ?<PrimaryBtn label={`Next: ${SEC_ICON[SECTIONS[sIdx+1]]} ${SECTIONS[sIdx+1]}`} color={SEC_COLOR[SECTIONS[sIdx+1]]} onClick={goNextSection}/>
            :<PrimaryBtn label="See Results" color={C.purple} onClick={finishGame}/>}
        </div>
      )}



      {phase==="playing"&&displayQ&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{backgroundColor:color+"18",borderRadius:R.pill,padding:"5px 14px"}}>
                <span style={{color,fontSize:11,fontWeight:700,letterSpacing:1}}>{SEC_ICON[section]} {section.toUpperCase()}</span>
              </div>
              {histIdx!==-1&&<div style={{backgroundColor:C.gold+"22",borderRadius:R.pill,padding:"4px 10px"}}>
                <span style={{color:C.gold,fontSize:10,fontWeight:700}}>REVIEW</span>
              </div>}
            </div>
            <span style={{color:timeLeft<=10?C.bad:C.purple,fontWeight:800,fontSize:20}}>{histIdx!==-1?"⏸":timeLeft+"s"}</span>
          </div>
          <div style={{height:4,backgroundColor:C.borderSoft,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",backgroundColor:timeLeft<=10?C.bad:color,
              width:`${(timeLeft/SEC_TIME[section])*100}%`,transition:"width 1s linear"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{margin:0,fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1}}>{histIdx===-1?`Q ${qNum}`:`Review Q${histIdx+1}/${history.length}`}</p>
            <div style={{display:"flex",gap:6}}>
              <button onClick={handleBack} disabled={history.length===0} style={{
                background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:R.sm,
                color:history.length===0?C.muted:C.sub,fontSize:12,cursor:"pointer",padding:"3px 9px"
              }}>◀ Back</button>
              {histIdx!==-1&&<button onClick={handleForward} style={{
                background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:R.sm,
                color:C.sub,fontSize:12,cursor:"pointer",padding:"3px 9px"
              }}>{histIdx<history.length-1?"▶ Fwd":"▶ Live"}</button>}
            </div>
          </div>
          <p style={{color:C.text,fontSize:15.5,fontWeight:600,fontFamily:"'Poppins',sans-serif",lineHeight:"23px",margin:0}}>{displayQ.q}</p>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {displayQ.opts.map((opt,i)=>{
              let border=C.border,bg=C.cardElevated;
              const picked=histIdx===-1?pickedOpt:displayPicked;
              if(picked!==null&&picked!==undefined){
                if(i===displayQ.ans){border=C.good;bg=C.good+"1f";}
                else if(i===picked&&picked!==displayQ.ans){border=C.bad;bg=C.bad+"1f";}
              }
              return(
                <div key={i} onClick={()=>histIdx===-1&&handlePick(i)} style={{
                  backgroundColor:bg,border:`2px solid ${border}`,borderRadius:R.lg,
                  padding:"13px 16px",cursor:(histIdx===-1&&pickedOpt===null)?"pointer":"default",
                  textAlign:"center",transition:"background 0.2s,border-color 0.2s",
                }}>
                  <span style={{color:C.text,fontSize:14,fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>{opt}</span>
                </div>
              );
            })}
          </div>
          {histIdx===-1&&pickedOpt===null&&(
            <button onClick={handleSkip} style={{
              background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:R.md,
              color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",
              padding:"9px 0",marginTop:2,width:"100%",letterSpacing:0.3
            }}>⏭ Skip Question</button>
          )}
        </div>
      )}

      {phase==="summary"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <p style={{color:C.sub,fontSize:12,textAlign:"center",textTransform:"uppercase",letterSpacing:2,margin:0,fontWeight:700}}>Final Score</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"flex-end"}}>
            <p style={{color:C.accent,fontSize:50,fontWeight:800,fontFamily:FONT_DISPLAY,margin:0,letterSpacing:-1}}>
              {total}<span style={{fontSize:18,color:C.sub,fontWeight:600}}>/{totalAnswered}</span>
            </p>
          </div>
          {total>=highScore&&total>0&&<div style={{backgroundColor:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:R.md,padding:"8px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:11,color:C.gold,fontWeight:700}}>🏆 New High Score!</p>
          </div>}
          {highScore>0&&total<highScore&&<div style={{backgroundColor:C.borderSoft,borderRadius:R.md,padding:"8px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:11,color:C.sub}}>High Score: <span style={{color:C.gold,fontWeight:700}}>{highScore}</span></p>
          </div>}
          {SECTIONS.map(s=>(
            <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"10px 16px"}}>
              <span style={{color:SEC_COLOR[s],fontWeight:700,fontSize:14}}>{SEC_ICON[s]} {s}</span>
              <span style={{color:C.text,fontWeight:800,fontSize:14}}>{scores[s]} / {totals[s]}</span>
            </div>
          ))}
          <div style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"10px 16px",display:"flex",justifyContent:"space-between"}}>
            <p style={{margin:0,fontSize:12,color:C.sub}}>Accuracy: <span style={{color:C.glow,fontWeight:700}}>{totalAnswered>0?Math.round(total/totalAnswered*100):0}%</span></p>
            <p style={{margin:0,fontSize:12,color:C.sub}}>Skipped: <span style={{color:C.muted,fontWeight:700}}>{skipped}</span></p>
          </div>

          <PrimaryBtn label="Play Again" color={C.purple} onClick={reset}/>
          <button onClick={()=>{
            localStorage.removeItem("bd_seen_v3");
            seenRef.current={Biology:[],GK:[],Speed:[]};
            alert("Question history cleared! All 700 questions are fresh again.");
          }} style={{background:"none",border:`1px solid ${C.borderSoft}`,color:C.sub,
            fontSize:12,fontWeight:600,cursor:"pointer",padding:"8px 16px",
            borderRadius:R.md,width:"100%"}}>🗑 Clear Question History</button>
        </div>
      )}
    </GameScreen>
  );
}


// ── Stats Screen ───────────────────────────────────────────────────────────
function StatsScreen({onBack,stats,highScores}){
  const totalQ=Object.values(stats.totalQ||{}).reduce((a,b)=>a+b,0);
  const totalCorrect=Object.values(stats.correctQ||{}).reduce((a,b)=>a+b,0);
  const acc=totalQ>0?Math.round(totalCorrect/totalQ*100):0;
  return(
    <GameScreen title="My Stats" accent={C.glow} onBack={onBack} meta={null}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>


        {/* Overall */}
        <p style={{margin:"4px 0 0",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Overall BrainDash</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {[
            {label:"Games Played",value:stats.gamesPlayed||0,color:C.glow},
            {label:"Questions Answered",value:totalQ,color:C.purple},
            {label:"Correct Answers",value:totalCorrect,color:C.good},
            {label:"Overall Accuracy",value:acc+"%",color:acc>=70?C.good:acc>=40?C.gold:C.bad},
          ].map(({label,value,color})=>(
            <div key={label} style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"12px 14px"}}>
              <p style={{margin:0,fontSize:20,fontWeight:900,color}}>{value}</p>
              <p style={{margin:"3px 0 0",fontSize:11,color:C.muted}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Per section */}
        <p style={{margin:"4px 0 0",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>By Section</p>
        {SECTIONS.map(s=>{
          const q=stats.totalQ?.[s]||0;
          const c=stats.correctQ?.[s]||0;
          const a=q>0?Math.round(c/q*100):0;
          return(
            <div key={s} style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"11px 14px",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:SEC_COLOR[s],fontWeight:700,fontSize:13}}>{SEC_ICON[s]} {s}</span>
              <div style={{textAlign:"right"}}>
                <p style={{margin:0,fontSize:13,fontWeight:800,color:C.text}}>{c}/{q}</p>
                <p style={{margin:0,fontSize:10,color:a>=70?C.good:a>=40?C.gold:C.muted}}>{q>0?a+"%":"—"}</p>
              </div>
            </div>
          );
        })}

        {/* MemoryGrid */}
        <p style={{margin:"4px 0 0",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>MemoryGrid</p>
        <div style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"11px 14px",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.glow,fontWeight:700,fontSize:13}}>⬜ Highest Level Cleared</span>
          <span style={{fontSize:18,fontWeight:900,color:C.glow}}>{stats.mgLevelsCleared||0}</span>
        </div>

        {/* High score */}
        <div style={{backgroundColor:C.gold+"18",border:`1px solid ${C.gold}33`,borderRadius:R.md,padding:"11px 14px",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.gold,fontWeight:700,fontSize:13}}>🏆 BrainDash High Score</span>
          <span style={{fontSize:18,fontWeight:900,color:C.gold}}>{highScores.braindash||0}</span>
        </div>

        <p style={{margin:"4px 0 0",fontSize:10,color:C.muted,textAlign:"center"}}>Stats saved on your device</p>
      </div>
    </GameScreen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MEMORYGRID — 25 LEVELS
// ════════════════════════════════════════════════════════════════════════════
// Level map:
//  1-5  : grid tap (4 boxes L1-2, 5 boxes L3, 6 boxes L4-5)
//  6-10 : number memory (4-digit L6-7, 5-digit L8, 6-digit L9-10) — show 3s then type/pick
//  11-15: symbol grid (4×4, always-mixed categories) — show then answer counting questions
//  16-20: number type (5-digit L16-17, 6-digit L18, 7-digit L19, 8-digit L20) — type answer
//  21-25: sequence tap (same grid but tap in correct order)
//  26-30: feedback + suggestion


function getGridConfig(level){
  if(level===1) return{type:"grid",count:4,size:4};
  if(level<=3) return{type:"grid",count:5,size:4};
  if(level<=5) return{type:"grid",count:6,size:4};
  if(level<=7) return{type:"number",digits:4,showMs:3000};
  if(level===8) return{type:"number",digits:5,showMs:3000};
  if(level<=10) return{type:"number",digits:6,showMs:3000};
  // Level 11: glow sequence (4 boxes glow one-by-one, user recalls order)
  if(level===11) return{type:"glowseq",count:4,size:4};
  if(level<=15) return{type:"symbols"};
  if(level<=17) return{type:"type",digits:5,showMs:4000};
  if(level===18) return{type:"type",digits:6,showMs:4000};
  if(level===19) return{type:"type",digits:7,showMs:5000};
  if(level===20) return{type:"type",digits:8,showMs:5000};
  // Levels 21-25: glow sequence — cells light up one-by-one, user taps in that order
  if(level===21) return{type:"glowseq",count:4,size:4};
  if(level===22) return{type:"glowseq",count:5,size:4};
  if(level===23) return{type:"glowseq",count:5,size:4};
  if(level===24) return{type:"glowseq",count:6,size:4};
  if(level===25) return{type:"glowseq",count:7,size:4};
  return{type:"feedback"};
}

function genNumber(digits){return Math.floor(Math.random()*(9*10**(digits-1)))+10**(digits-1);}

// Generates 3 "close" wrong numbers near the correct one — same digit count,
// small perturbations so they're genuinely hard to rule out at a glance.
function genCloseWrongOptions(correct,digits){
  const min=10**(digits-1), max=9*10**(digits-1)+min-1;
  const wrong=new Set();
  let tries=0;
  while(wrong.size<3&&tries<60){
    tries++;
    // perturb 1-2 digits slightly, or shift by a small random delta
    const mode=rng(0,2);
    let cand;
    if(mode===0){
      // small numeric delta
      const delta=rng(1,25)*(rng(0,1)?1:-1);
      cand=correct+delta;
    } else if(mode===1){
      // swap two adjacent digits
      const s=String(correct).split("");
      const i=rng(0,s.length-2);
      [s[i],s[i+1]]=[s[i+1],s[i]];
      cand=parseInt(s.join(""),10);
    } else {
      // change one digit by ±1or2
      const s=String(correct).split("");
      const i=rng(0,s.length-1);
      let d=parseInt(s[i],10)+ (rng(0,1)?1:-1)*rng(1,2);
      d=((d%10)+10)%10;
      s[i]=String(d);
      cand=parseInt(s.join(""),10);
    }
    if(cand!==correct&&cand>=min&&cand<=max&&String(cand).length===digits) wrong.add(cand);
  }
  // fallback: fill any remaining slots with small deltas if perturbation collided too much
  while(wrong.size<3){
    const delta=rng(1,30)*(rng(0,1)?1:-1);
    const cand=correct+delta;
    if(cand!==correct&&cand>=min&&cand<=max&&String(cand).length===digits) wrong.add(cand);
  }
  return [...wrong].map(String);
}

// ── Symbol grid (levels 11-15): always mixes 3-4 categories per grid so no ──
// ── two cells of the same icon ever sit in an all-one-category block.       ──
const SYMBOL_CATEGORIES={
  Fruits:["🍎","🍊","🍋","🍇","🍓","🍑","🍍","🥭","🍌","🥝"],
  Animals:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🐷","🐮"],
  Vehicles:["🚗","🚕","🚙","🚌","🏍","✈️","🚓","🚑","🚒","🚐"],
  Food:["🍩","🍔","🍟","🍕","🌮","🍰","🍪","🥐"],
  Ocean:["🐬","🐳","🦈","🐙","🦑","🦀","🦞","🦐","🐡","🐠"],
  Birds:["🦅","🦆","🦉","🦚","🦜","🦩","🦢","🐦","🐧","🐤"],
};
const CAT_NAMES=Object.keys(SYMBOL_CATEGORIES);

function genSymbolGrid(){
  // Pick 4 different categories, one unique icon per category
  const numCats=4;
  const cats=shuffle(CAT_NAMES).slice(0,numCats);
  const chosenIcon={};
  cats.forEach(cat=>{
    chosenIcon[cat]=shuffle([...SYMBOL_CATEGORIES[cat]])[0];
  });
  // Each category gets 2-6 cells, and total must equal exactly 16
  // Assign counts carefully: 4 cats × avg 4 = 16, max any one = 6
  const counts={};
  let remaining=16;
  cats.forEach((cat,idx)=>{
    if(idx===cats.length-1){
      // last cat gets whatever is left, clamped 2-6
      counts[cat]=Math.min(6,Math.max(2,remaining));
    } else {
      // pick 2-6 but ensure enough left for remaining cats (min 2 each)
      const maxForThis=Math.min(6,remaining-2*(cats.length-1-idx));
      counts[cat]=rng(2,maxForThis);
    }
    remaining-=counts[cat];
  });
  // Build pool from counts
  const pool=[];
  cats.forEach(cat=>{
    const sym=chosenIcon[cat];
    for(let i=0;i<counts[cat];i++) pool.push({sym,cat});
  });
  // Pad/trim to exactly 16 (safety) — but above logic guarantees 16
  while(pool.length<16){
    const cat=cats[rng(0,cats.length-1)];
    const sym=chosenIcon[cat];
    const cur=pool.filter(c=>c.sym===sym).length;
    if(cur<6) pool.push({sym,cat});
  }
  while(pool.length>16) pool.pop();
  return shuffle(pool);
}

function genSymbolQuestions(grid){
  const counts={};
  grid.forEach(({sym})=>{
    counts[sym]=(counts[sym]||0)+1;
  });
  const qs=Object.entries(counts).map(([sym,cnt])=>({sym,ans:cnt,q:`How many ${sym} were there?`}));
  return shuffle(qs).slice(0,3);
}

function MemoryGridScreen({onBack,playSound,onLevelClear}){
  const [level,setLevel]=useState(1);
  const [lives,setLives]=useState(5);
  const [phase,setPhase]=useState("start"); // start|show|recall|result|feedback
  const [config,setConfig]=useState(null);
  // grid/sequence
  const [litCells,setLitCells]=useState([]);
  const [pickedCells,setPickedCells]=useState([]);
  const [correctCells,setCorrectCells]=useState([]);
  const [wrongCells,setWrongCells]=useState([]);
  const [seqOrder,setSeqOrder]=useState([]); // for sequence mode
  // number/type
  const [numVal,setNumVal]=useState("");
  const [numOpts,setNumOpts]=useState([]);
  const [numInput,setNumInput]=useState("");
  const [numResult,setNumResult]=useState(null); // null|'correct'|'wrong'
  // symbols (levels 11-15)
  const [symbolGrid,setSymbolGrid]=useState([]);
  const [symQs,setSymQs]=useState([]);
  const [symQIdx,setSymQIdx]=useState(0);
  const [symInput,setSymInput]=useState("");
  const [symResult,setSymResult]=useState(null);
  const [symScore,setSymScore]=useState(0);
  // glowseq (level 11) — boxes glow one-by-one, user recalls order
  const [glowSeqOrder,setGlowSeqOrder]=useState([]); // order cells glow
  const [glowActiveCell,setGlowActiveCell]=useState(null); // currently lit cell index
  const [glowShowDone,setGlowShowDone]=useState(false); // finished showing sequence
  const [glowPicked,setGlowPicked]=useState([]); // user's taps so far
  // feedback
  const [fbStep,setFbStep]=useState(0); // 0=score, 1=email form
  const [fbRating,setFbRating]=useState(0);
  const [fbComment,setFbComment]=useState("");
  const [suggestion,setSuggestion]=useState("");
  const [fbSent,setFbSent]=useState(false);

  const timerRef=useRef(null);

  useEffect(()=>{
    if(level<=25) beginLevel(level);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[level]);
  useEffect(()=>{if(level>25) setPhase("feedback");},[level]);

  function beginLevel(lv){
    const cfg=getGridConfig(lv);
    setConfig(cfg);
    setPickedCells([]);setCorrectCells([]);setWrongCells([]);
    setNumResult(null);setNumInput("");setSymResult(null);setSymScore(0);setSymQIdx(0);setSymInput("");
    setGlowActiveCell(null);setGlowShowDone(false);setGlowPicked([]);

    if(cfg.type==="glowseq"){
      const cells=shuffle([...Array(16).keys()]).slice(0,cfg.count);
      setGlowSeqOrder(cells);
      setGlowPicked([]);
      setGlowActiveCell(null);
      setGlowShowDone(false);
      setPhase("show");
      // Each cell glows for 700ms with 300ms gap; longer sequences get slightly faster
      const litDur=cfg.count>=6?600:700;
      const gapDur=cfg.count>=6?250:300;
      let delay=500;
      cells.forEach((cell)=>{
        setTimeout(()=>setGlowActiveCell(cell),delay);
        delay+=litDur;
        setTimeout(()=>setGlowActiveCell(null),delay);
        delay+=gapDur;
      });
      setTimeout(()=>{setGlowShowDone(true);setPhase("recall");},delay+200);
    } else if(cfg.type==="grid"||cfg.type==="sequence"){
      const cells=shuffle([...Array(16).keys()]).slice(0,cfg.count);
      setLitCells(cells);
      if(cfg.type==="sequence") setSeqOrder(cells);
      setPhase("show");
      timerRef.current=setTimeout(()=>setPhase("recall"),2000);
    } else if(cfg.type==="number"){
      const n=String(genNumber(cfg.digits));
      setNumVal(n);
      // generate 3 close, confusable wrong options so the player really has to recall
      const wrong=genCloseWrongOptions(parseInt(n,10),cfg.digits);
      setNumOpts(shuffle([n,...wrong]));
      setPhase("show");
      timerRef.current=setTimeout(()=>setPhase("recall"),cfg.showMs);
    } else if(cfg.type==="type"){
      const n=String(genNumber(cfg.digits));
      setNumVal(n);
      setPhase("show");
      timerRef.current=setTimeout(()=>setPhase("recall"),cfg.showMs);
    } else if(cfg.type==="symbols"){
      const g=genSymbolGrid();
      setSymbolGrid(g);
      setSymQs(genSymbolQuestions(g));
      setPhase("show");
      timerRef.current=setTimeout(()=>setPhase("recall"),8000);
    }
  }

  function loseLife(){
    const nl=lives-1;
    setLives(nl);
    if(nl<=0) setPhase("gameover");
    else setPhase("result");
  }

  // ── Grid / Sequence tap ────────────────────────────────────────────────
  function handleCellTap(i){
    if(phase!=="recall") return;
    const cfg=getGridConfig(level);
    if(cfg.type==="grid"){
      if(pickedCells.includes(i)) return;
      const next=[...pickedCells,i];
      setPickedCells(next);
      if(next.length===cfg.count){
        const c=next.filter(x=>litCells.includes(x));
        const w=next.filter(x=>!litCells.includes(x));
        setCorrectCells(c);setWrongCells(w);
        setPhase("checking");
        setTimeout(()=>{
          if(w.length===0) advanceLevel();
          else loseLife();
        },800);
      }
    } else if(cfg.type==="sequence"){
      if(pickedCells.includes(i)) return;
      const next=[...pickedCells,i];
      const expected=seqOrder[next.length-1];
      if(i!==expected){
        setWrongCells([i]);setPhase("checking");
        setTimeout(loseLife,700);
        return;
      }
      setCorrectCells([...next]);
      setPickedCells(next);
      if(next.length===cfg.count){
        setPhase("checking");setTimeout(advanceLevel,700);
      }
    }
  }

  // ── GlowSeq tap (level 11) ─────────────────────────────────────────────
  function handleGlowTap(i){
    if(phase!=="recall") return;
    if(glowPicked.includes(i)) return;
    const next=[...glowPicked,i];
    const expected=glowSeqOrder[next.length-1];
    if(i!==expected){
      setWrongCells([i]);setPhase("checking");
      setTimeout(loseLife,700);
      return;
    }
    setCorrectCells([...next]);
    setGlowPicked(next);
    if(next.length===glowSeqOrder.length){
      setPhase("checking");setTimeout(advanceLevel,700);
    }
  }

  function advanceLevel(){
    if(playSound) playSound("levelUp");
    setLevel(p=>{
      const next=p+1;
      if(onLevelClear) onLevelClear(p); // track highest level cleared
      return next;
    });
  }

  // ── Number MCQ ─────────────────────────────────────────────────────────
  function handleNumPick(opt){
    if(numResult!==null) return;
    const correct=opt===numVal;
    setNumResult(correct?"correct":"wrong");
    setTimeout(()=>{
      if(correct) advanceLevel();
      else loseLife();
    },700);
  }

  // ── Number Type ─────────────────────────────────────────────────────────
  function handleTypeSubmit(){
    if(numResult!==null) return;
    const correct=numInput.trim()===numVal;
    setNumResult(correct?"correct":"wrong");
    setTimeout(()=>{
      if(correct) advanceLevel();
      else loseLife();
    },700);
  }

  // ── Symbol questions (levels 11-15) ──────────────────────────────────────
  function handleSymSubmit(){
    if(symResult!==null) return;
    const q=symQs[symQIdx];
    const correct=parseInt(symInput,10)===q.ans;
    setSymResult(correct?"correct":"wrong");
    if(correct) setSymScore(p=>p+1);
    setTimeout(()=>{
      setSymResult(null);setSymInput("");
      if(symQIdx+1>=symQs.length){
        const finalScore=symScore+(correct?1:0);
        if(finalScore>=2) advanceLevel(); // need 2/3 to pass
        else loseLife();
      } else {
        setSymQIdx(p=>p+1);
      }
    },700);
  }

  // ── Cell colour ──────────────────────────────────────────────────────────
  function cellColor(i){
    const cfg=config||getGridConfig(level);
    if(wrongCells.includes(i)) return C.bad;
    if(correctCells.includes(i)) return C.good;
    if(pickedCells.includes(i)) return C.purple;
    if(cfg.type==="glowseq"){
      if(glowActiveCell===i) return C.glow;
      if(phase==="recall"&&glowPicked.includes(i)) return C.good;
      return null;
    }
    if((phase==="show"||phase==="checking")&&litCells.includes(i)) return C.glow;
    return null;
  }

  function seqLabel(i){
    const idx=pickedCells.indexOf(i);
    if(idx>=0) return idx+1;
    if(phase==="show"&&seqOrder.indexOf(i)>=0) return seqOrder.indexOf(i)+1;
    return null;
  }

  function reset(){setLevel(1);setLives(5);setPhase("start");setConfig(null);}

  const cfg=config||getGridConfig(level);

  // ── Feedback ─────────────────────────────────────────────────────────────
  const SUGGESTED_GAMES=["Word Scramble","Math Blitz","Color Match","Pattern Draw","Geography Quiz","Music Note Guess","Flag Guesser","Speed Typing","Reaction Tap","3D Cube Memory"];

  if(phase==="feedback"){
    return(
      <GameScreen title="You Did It! 🎉" accent={C.gold} onBack={onBack} meta={null}>
        {!fbSent?(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <p style={{margin:0,fontSize:13,color:C.sub}}>You completed all 25 levels of MemoryGrid!</p>
              <p style={{margin:"6px 0 0",fontSize:28,fontWeight:700,fontFamily:FONT_DISPLAY,color:C.gold}}>Champion 🏆</p>
            </div>
            <p style={{margin:0,fontWeight:700,fontSize:14,color:C.text}}>Rate your experience</p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[1,2,3,4,5].map(n=>(
                <div key={n} onClick={()=>setFbRating(n)} style={{
                  fontSize:28,cursor:"pointer",opacity:n<=fbRating?1:0.3,
                  transition:"opacity 0.15s,transform 0.1s",transform:n<=fbRating?"scale(1.1)":"scale(1)"}}>⭐</div>
              ))}
            </div>
            <textarea value={fbComment} onChange={e=>setFbComment(e.target.value)}
              placeholder="Tell us what you think about the game…"
              rows={3} style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,
                borderRadius:R.md,color:C.text,fontSize:13,padding:12,resize:"none",
                fontFamily:"inherit",outline:"none"}}/>
            <p style={{margin:"4px 0 0",fontWeight:700,fontSize:14,color:C.text}}>Suggest a game for levels 26-30</p>
            <input value={suggestion} onChange={e=>setSuggestion(e.target.value)}
              placeholder="e.g. Word Scramble, Reaction Tap, Music Note…"
              style={{backgroundColor:C.bg,border:`1px solid ${C.border}`,borderRadius:R.md,
                color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",outline:"none"}}/>
            <div style={{backgroundColor:C.card,border:`1px solid ${C.border}`,borderRadius:R.md,padding:12}}>
              <p style={{margin:"0 0 8px",fontSize:12,color:C.sub}}>Popular suggestions from other players:</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {SUGGESTED_GAMES.map(g=>(
                  <span key={g} onClick={()=>setSuggestion(g)} style={{
                    backgroundColor:C.purple+"18",borderRadius:R.pill,padding:"4px 10px",
                    color:C.purple,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <PrimaryBtn label="Send Feedback →" color={C.gold} onClick={()=>{
              if(fbRating===0){alert("Please give a star rating!");return;}
              setFbSent(true);
            }}/>
            <p style={{margin:0,fontSize:11,color:C.muted,textAlign:"center"}}>
              Or email us at <a href="mailto:hibty_02@yahoo.com" style={{color:C.accent}}>hibty_02@yahoo.com</a>
            </p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <span style={{fontSize:48}}>🎉</span>
            <p style={{margin:0,fontSize:21,fontWeight:700,fontFamily:FONT_DISPLAY,color:C.text}}>Thanks for playing! 🎈</p>
            <p style={{margin:0,color:C.sub,fontSize:13,textAlign:"center"}}>Your feedback has been noted. We'll use your suggestion for levels 26-30!</p>
            <p style={{margin:0,fontSize:12,color:C.muted,textAlign:"center"}}>You can also reach us at <a href="mailto:hibty_02@yahoo.com" style={{color:C.accent}}>hibty_02@yahoo.com</a></p>
            <PrimaryBtn label="Play Again from L1" color={C.glow} onClick={reset}/>
          </div>
        )}
      </GameScreen>
    );
  }

  return(
    <GameScreen title="MemoryGrid" accent={C.glow} onBack={onBack}
      meta={<>
        <MetaBadge label="Level" value={level} color={C.glow}/>
        <LivesBadge lives={lives}/>
      </>}>

      {phase==="gameover"&&(
        <EndCard title="Game Over" sub={`You reached level ${level}`} accent={C.bad} action="Play Again" onAction={reset}/>
      )}
      {phase==="result"&&(
        <EndCard title="Wrong!" sub={`${lives} ${lives===1?"life":"lives"} left`} accent={C.bad}
          action="Retry Level" onAction={()=>beginLevel(level)}/>
      )}

      {/* ── GlowSeq (level 11) ── */}
      {cfg.type==="glowseq"&&(phase==="show"||phase==="recall"||phase==="checking")&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
            {phase==="show"?"Watch the glow sequence carefully…":`Tap the boxes in the same order (${glowSeqOrder.length - glowPicked.length} left)`}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4, 56px)",gap:8}}>
            {[...Array(16)].map((_,i)=>{
              const isActive=glowActiveCell===i;
              const isCorrect=correctCells.includes(i);
              const isWrong=wrongCells.includes(i);
              const isPicked=glowPicked.includes(i);
              let borderCol=C.borderSoft, bgCol=C.card, shadowStyle="";
              if(isActive){borderCol=C.glow;bgCol=C.glow+"3a";shadowStyle=`0 0 18px ${C.glow}, 0 0 6px ${C.glow}`;}
              else if(isWrong){borderCol=C.bad;bgCol=C.bad+"2a";}
              else if(isCorrect||isPicked){borderCol=C.good;bgCol=C.good+"2a";}
              const pickIdx=glowPicked.indexOf(i);
              return(
                <div key={i} onClick={()=>handleGlowTap(i)} style={{
                  width:56,height:56,borderRadius:R.sm,
                  backgroundColor:bgCol,
                  border:`2px solid ${borderCol}`,
                  boxShadow:shadowStyle,
                  cursor:phase==="recall"?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"background-color 0.15s,border-color 0.15s,box-shadow 0.15s",
                }}>
                  {isPicked&&pickIdx>=0&&<span style={{color:C.good,fontWeight:800,fontSize:16}}>{pickIdx+1}</span>}
                  {phase==="show"&&isActive&&<span style={{color:C.glow,fontWeight:900,fontSize:18}}>●</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Grid / Sequence ── */}
      {(cfg.type==="grid"||cfg.type==="sequence")&&(phase==="show"||phase==="recall"||phase==="checking")&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
            {phase==="show"?(cfg.type==="sequence"?"Remember the order!":"Memorise the cells…"):`Tap ${cfg.count - pickedCells.length} more${cfg.type==="sequence"?" in order":""}`}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4, 56px)",gap:8}}>
            {[...Array(16)].map((_,i)=>{
              const col=cellColor(i);
              const label=cfg.type==="sequence"?seqLabel(i):null;
              return(
                <div key={i} onClick={()=>handleCellTap(i)} style={{
                  width:56,height:56,borderRadius:R.sm,
                  backgroundColor:col?col+"2a":C.card,
                  border:`2px solid ${col||C.borderSoft}`,
                  cursor:phase==="recall"?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"background-color 0.15s,border-color 0.15s",
                }}>
                  {label&&<span style={{color:col||C.text,fontWeight:800,fontSize:16}}>{label}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Number MCQ ── */}
      {cfg.type==="number"&&(phase==="show"||phase==="recall")&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
          {phase==="show"?(
            <>
              <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Memorise this number</p>
              <p style={{margin:0,fontSize:36,fontWeight:900,color:C.glow,letterSpacing:6}}>{numVal}</p>
              <p style={{margin:0,fontSize:12,color:C.muted}}>Disappears in a moment…</p>
            </>
          ):(
            <>
              <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Which number did you see?</p>
              <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
                {numOpts.map((opt,i)=>{
                  let border=C.borderSoft,bg=C.bg,textCol=C.text;
                  if(numResult!==null&&opt===numVal){border=C.good;bg=C.good+"22";textCol=C.good;}
                  return(
                    <div key={i} onClick={()=>handleNumPick(opt)} style={{
                      backgroundColor:bg,border:`1.5px solid ${border}`,borderRadius:R.md,
                      padding:"14px",textAlign:"center",cursor:numResult===null?"pointer":"default",
                      transition:"background 0.2s,border-color 0.2s",
                    }}>
                      <span style={{color:textCol,fontSize:22,fontWeight:800,letterSpacing:4}}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Type number ── */}
      {cfg.type==="type"&&(phase==="show"||phase==="recall")&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
          {phase==="show"?(
            <>
              <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Memorise this number</p>
              <p style={{margin:0,fontSize:32,fontWeight:900,color:C.glow,letterSpacing:4}}>{numVal}</p>
              <p style={{margin:0,fontSize:12,color:C.muted}}>Disappears soon…</p>
            </>
          ):(
            <>
              <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Type the number you saw</p>
              <input value={numInput} onChange={e=>setNumInput(e.target.value.replace(/\D/g,""))}
                inputMode="numeric" maxLength={12}
                style={{backgroundColor:C.bg,border:`2px solid ${numResult===null?C.border:numResult==="correct"?C.good:C.bad}`,
                  borderRadius:R.md,color:C.text,fontSize:26,fontWeight:900,textAlign:"center",
                  padding:"12px",width:"100%",boxSizing:"border-box",letterSpacing:4,
                  fontFamily:"inherit",outline:"none"}}/>
              <PrimaryBtn label="Check" color={C.glow} onClick={handleTypeSubmit}/>
              {numResult&&<p style={{margin:0,fontWeight:700,fontSize:13,color:numResult==="correct"?C.good:C.bad}}>
                {numResult==="correct"?"✓ Correct!":"✕ The number was "+numVal}
              </p>}
            </>
          )}
        </div>
      )}

      {/* ── Symbol grid (levels 11-15) ── */}
      {cfg.type==="symbols"&&phase==="show"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Study the grid carefully</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,52px)",gap:6}}>
            {symbolGrid.map((item,i)=>(
              <div key={i} style={{width:52,height:52,borderRadius:R.sm,backgroundColor:C.bg,
                border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
                {item.sym}
              </div>
            ))}
          </div>
          <p style={{margin:0,fontSize:12,color:C.muted}}>Grid disappears in a moment…</p>
        </div>
      )}
      {cfg.type==="symbols"&&phase==="recall"&&symQs.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:700,letterSpacing:1}}>QUESTION {symQIdx+1} OF {symQs.length}</p>
            <p style={{margin:0,fontSize:11,color:C.good,fontWeight:700}}>{symScore} correct</p>
          </div>
          <p style={{margin:0,fontSize:18,color:C.text,fontWeight:700,textAlign:"center"}}>{symQs[symQIdx].q}</p>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            {[1,2,3,4,5,6].map(n=>(
              <div key={n} onClick={()=>{setSymInput(String(n));}} style={{
                width:48,height:48,borderRadius:R.md,
                backgroundColor:symInput===String(n)?C.purple+"2a":C.bg,
                border:`2px solid ${symInput===String(n)?C.purple:C.borderSoft}`,
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                transition:"background 0.15s,border 0.15s",
              }}>
                <span style={{color:C.text,fontWeight:800,fontSize:18}}>{n}</span>
              </div>
            ))}
          </div>
          {symResult&&<p style={{margin:0,textAlign:"center",fontWeight:700,fontSize:13,color:symResult==="correct"?C.good:C.bad}}>
            {symResult==="correct"?"✓ Correct!":"✕ Answer was "+symQs[symQIdx].ans}
          </p>}
          <PrimaryBtn label="Confirm" color={C.glow} onClick={handleSymSubmit}/>
        </div>
      )}

      {/* Start screen */}
      {phase==="start"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <p style={{color:C.sub,fontSize:14,textAlign:"center",margin:0}}>
            30 levels of memory challenges — grids, numbers, symbols and sequences.
          </p>
          <PrimaryBtn label="Start Level 1" color={C.glow} onClick={()=>beginLevel(1)}/>
        </div>
      )}
    </GameScreen>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────
function GameScreen({title,accent,onBack,meta,children}){
  return(
    <div style={{minHeight:"100vh",backgroundColor:C.bg,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"16px 20px",borderBottom:`1px solid ${C.divider}`,backgroundColor:C.nav}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,
          borderRadius:R.md,color:C.sub,fontSize:13,fontWeight:600,padding:"6px 12px",cursor:"pointer"}}>← Hub</button>
        <span style={{color:C.text,fontWeight:700,fontFamily:FONT_DISPLAY,fontSize:17,letterSpacing:0}}>{title}</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>{meta}</div>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{backgroundColor:C.card,border:`1px solid ${C.border}`,borderRadius:R.xl,
          padding:20,boxShadow:"0 4px 14px rgba(60,40,90,0.08)"}}>
          {children}
        </div>
      </div>
    </div>
  );
}
function MetaBadge({label,value,color}){
  return(
    <div style={{backgroundColor:color+"18",borderRadius:R.pill,padding:"4px 12px",textAlign:"center"}}>
      <p style={{margin:0,fontSize:9,color,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{label}</p>
      <p style={{margin:0,fontSize:13,color,fontWeight:800}}>{value}</p>
    </div>
  );
}
function LivesBadge({lives}){
  return(
    <div style={{display:"flex",gap:2,alignItems:"center"}}>
      {[...Array(5)].map((_,i)=>(
        <span key={i} style={{fontSize:13,filter:i<lives?"none":"grayscale(1) opacity(0.3)",transition:"filter 0.3s"}}>❤️</span>
      ))}
    </div>
  );
}
function EndCard({title,sub,accent,action,onAction}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
      <div style={{width:60,height:60,borderRadius:"50%",backgroundColor:accent+"22",
        border:`2px solid ${accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:28}}>{accent===C.good?"✓":"✕"}</span>
      </div>
      <p style={{margin:0,fontSize:23,fontWeight:700,fontFamily:FONT_DISPLAY,color:C.text}}>{title}</p>
      <p style={{margin:0,color:C.sub,fontSize:13}}>{sub}</p>
      <PrimaryBtn label={action} color={accent} onClick={onAction}/>
    </div>
  );
}
function PrimaryBtn({label,color,onClick}){
  const [hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{backgroundColor:color,borderRadius:R.pill,padding:"14px 24px",border:"none",
        color:"#ffffff",fontWeight:700,fontFamily:FONT_DISPLAY,fontSize:16,letterSpacing:0.2,cursor:"pointer",width:"100%",
        boxShadow:`0 5px 0 ${color}99`,
        transform:hov?"translateY(2px)":"translateY(0)",transition:"transform 0.1s,box-shadow 0.1s"}}>
      {label}
    </button>
  );
}

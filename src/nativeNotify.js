// Schedules real Android notifications (via Capacitor Local Notifications) for
// reminders and alarms, so they fire even when the app is closed.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const STORE_KEY = "remindme_pro_v1";
const OT_KEY = "rm_onetime_alarms";
const CH_R = "rm_reminders_v1";
const CH_A = "rm_alarms_v1";

function nextOcc(d, rep, min) {
  const t = new Date(d);
  if (rep === "Minutes") t.setMinutes(t.getMinutes() + (min || 0));
  else if (rep === "Daily") t.setDate(t.getDate() + 1);
  else if (rep === "Weekly") t.setDate(t.getDate() + 7);
  else if (rep === "Monthly") t.setMonth(t.getMonth() + 1);
  else if (rep === "Yearly") t.setFullYear(t.getFullYear() + 1);
  return t;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2147483000) + 1;
}

function readOT() {
  try { return JSON.parse(localStorage.getItem(OT_KEY)) || {}; } catch (e) { return {}; }
}
function writeOT(o) {
  try { localStorage.setItem(OT_KEY, JSON.stringify(o)); } catch (e) {}
}

function buildList(data) {
  const now = Date.now() + 2000;
  const out = [];

  (data.reminders || []).forEach((r) => {
    if (!r.on) return;
    const rep = r.repeat === "Minutes"
      ? ((r.repeatMin || 0) > 0 ? "Minutes" : null)
      : (r.repeat && r.repeat !== "None" ? r.repeat : null);
    let t = new Date(r.dt);
    if (isNaN(t)) return;
    if (rep === "Minutes") {
      const step = r.repeatMin * 60000;
      if (t.getTime() <= now) t = new Date(t.getTime() + Math.ceil((now - t.getTime()) / step) * step);
    } else if (rep) {
      let g = 0;
      while (t.getTime() <= now && g++ < 4000) t = nextOcc(t, rep, r.repeatMin);
    }
    const limit = ({ Minutes: 30, Daily: 14, Weekly: 8, Monthly: 6, Yearly: 2 })[rep] || 1;
    let c = 0;
    while (c < limit && t.getTime() > now) {
      out.push({
        key: "r|" + r.id + "|" + t.getTime(),
        at: t,
        channelId: CH_R,
        title: r.title || "Reminder",
        body: r.note || "Reminder",
      });
      c++;
      if (!rep) break;
      t = rep === "Minutes" ? new Date(t.getTime() + r.repeatMin * 60000) : nextOcc(t, rep, r.repeatMin);
    }
  });

  const ot = readOT();
  const seen = {};
  (data.alarms || []).forEach((a) => {
    if (!a.on) { delete ot[a.id]; return; }
    const days = a.days || [];
    const oneTime = days.length === 0;
    const sig = a.h + ":" + a.m;
    if (oneTime && ot[a.id] && ot[a.id].sig === sig && ot[a.id].at <= Date.now()) return; // already rang
    let c = 0;
    for (let d = 0; d < 15 && c < (oneTime ? 1 : 14); d++) {
      const t = new Date();
      t.setDate(t.getDate() + d);
      t.setHours(a.h, a.m, 0, 0);
      if (t.getTime() <= now) continue;
      if (!oneTime && !days.includes(t.getDay() + 1)) continue;
      const hh = a.h % 12 || 12;
      out.push({
        key: "a|" + a.id + "|" + t.getTime(),
        at: t,
        channelId: CH_A,
        title: "⏰ " + (a.label || "Alarm"),
        body: hh + ":" + String(a.m).padStart(2, "0") + " " + (a.h >= 12 ? "PM" : "AM"),
      });
      if (oneTime) { ot[a.id] = { sig, at: t.getTime() }; seen[a.id] = 1; }
      c++;
    }
  });
  Object.keys(ot).forEach((id) => { if (!seen[id] && !(data.alarms || []).some((a) => a.id === id)) delete ot[id]; });
  writeOT(ot);

  out.sort((x, y) => x.at - y.at);
  return out.slice(0, 400);
}

let running = false;
let latest = null;

async function syncNow(data) {
  latest = data;
  if (running) return;
  running = true;
  try {
    while (latest) {
      const d = latest;
      latest = null;
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") continue;
      await LocalNotifications.createChannel({ id: CH_R, name: "Reminders", description: "Reminder notifications", importance: 5, visibility: 1, vibration: true, lights: true });
      await LocalNotifications.createChannel({ id: CH_A, name: "Alarms", description: "Alarm clock", importance: 5, visibility: 1, vibration: true, lights: true });
      const pend = await LocalNotifications.getPending();
      if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
      const used = new Set();
      const list = buildList(d).map((n) => {
        let id = hash(n.key);
        while (used.has(id)) id++;
        used.add(id);
        return { id, title: n.title, body: n.body, channelId: n.channelId, schedule: { at: n.at, allowWhileIdle: true } };
      });
      if (list.length) await LocalNotifications.schedule({ notifications: list });
    }
  } catch (e) {
    console.warn("native notify sync failed", e);
  } finally {
    running = false;
  }
}

function readStored() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
}

export function initNativeNotify() {
  if (!Capacitor.isNativePlatform()) return;
  let timer = null;
  window.__rmSchedule = (data) => {
    clearTimeout(timer);
    timer = setTimeout(() => syncNow(data), 800);
  };
  // App is open: the in-app alert already handles it, so clear the duplicate.
  LocalNotifications.addListener("localNotificationReceived", () => {
    if (document.visibilityState !== "visible") return; // app in background: keep it in the tray
    try { LocalNotifications.removeAllDeliveredNotifications(); } catch (e) {}
  });
  const stored = readStored();
  if (stored) syncNow(stored);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const s = readStored();
      if (s) syncNow(s);
    }
  });
}

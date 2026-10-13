import React, { useEffect, useRef, useCallback } from 'react';
import { Platform, StatusBar, View, BackHandler, AppState, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import { HTML } from './hibtyHtml';

const CHANNEL = 'hibty-alarm';
const RING_MS = 45000, GAP_MS = 30000; // ring 45s, pause 30s, repeat N times

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true, shouldSetBadge: false,
  }),
});

async function setup() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Alarms & Reminders',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 600, 300, 600, 300, 600],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      bypassDnd: false,
    });
    if (Platform.Version >= 33) {
      try { await PermissionsAndroid.request('android.permission.RECORD_AUDIO'); } catch (e) {}
    }
  }
  const cur = await Notifications.getPermissionsAsync();
  if (!cur.granted) await Notifications.requestPermissionsAsync();
}

// next N firing times for an alarm
function alarmTimes(a, now, count) {
  const out = [];
  for (let d = 0; d < 8 && out.length < count; d++) {
    const t = new Date(now); t.setDate(t.getDate() + d); t.setHours(a.h, a.m, 0, 0);
    if (t <= now) continue;
    if (a.days && a.days.length && !a.days.includes(t.getDay() + 1)) continue;
    out.push(t);
  }
  return out;
}

function nextReminder(r, now) {
  let d = new Date(r.dt);
  if (d > now) return d;
  if (!r.repeat || r.repeat === 'None' || r.repeat === 'Never') return null;
  for (let i = 0; i < 400 && d <= now; i++) {
    if (r.repeat === 'Minutes') d = new Date(d.getTime() + Math.max(1, r.repeatMin || 1) * 60000);
    else if (r.repeat === 'Daily') d.setDate(d.getDate() + 1);
    else if (r.repeat === 'Weekly') d.setDate(d.getDate() + 7);
    else if (r.repeat === 'Monthly') d.setMonth(d.getMonth() + 1);
    else if (r.repeat === 'Yearly') d.setFullYear(d.getFullYear() + 1);
    else return null;
  }
  return d > now ? d : null;
}

async function schedule(data) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  const at = (date) => ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL });
  let budget = 300;
  for (const r of data.reminders || []) {
    if (!r.on || budget <= 0) continue;
    const d = nextReminder(r, now); if (!d) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: '🔔 ' + (r.title || 'Reminder'), body: r.note || 'Tap to open', sound: 'default',
        priority: 'max', data: { kind: 'reminder', id: r.id } },
      trigger: at(d),
    }); budget--;
  }
  for (const a of data.alarms || []) {
    if (!a.on) continue;
    for (const t of alarmTimes(a, now, 3)) {
      for (let k = 0; k < Math.min(a.snoozeMax || 3, 10) && budget > 0; k++) {
        await Notifications.scheduleNotificationAsync({
          content: { title: '⏰ ' + (a.label || 'Alarm'), body: k === 0 ? 'Tap to dismiss' : 'Still ringing — tap to dismiss',
            sound: 'default', priority: 'max', sticky: true, data: { kind: 'alarm', id: a.id } },
          trigger: at(new Date(t.getTime() + k * (RING_MS + GAP_MS))),
        }); budget--;
      }
    }
  }
}

export default function App() {
  const web = useRef(null);
  const ready = useRef(false);
  const pending = useRef(null);

  const open = useCallback((resp) => {
    const d = resp?.notification?.request?.content?.data; if (!d) return;
    const js = d.kind === 'alarm' ? `window.__rmRing&&window.__rmRing(${JSON.stringify(d.id)});true;`
      : `window.__rmOpenReminder&&window.__rmOpenReminder(${JSON.stringify(d.id)});true;`;
    if (ready.current) web.current?.injectJavaScript(js); else pending.current = js;
  }, []);

  useEffect(() => {
    setup();
    Notifications.getLastNotificationResponseAsync().then((r) => r && open(r));
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    // a notification arriving while app is open → let the web engine ring/show
    const sub2 = Notifications.addNotificationReceivedListener((n) => {
      const d = n.request.content.data;
      if (d?.kind === 'alarm') web.current?.injectJavaScript(`window.__rmCheckNow&&window.__rmCheckNow();true;`);
    });
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') web.current?.injectJavaScript('window.__rmCheckNow&&window.__rmCheckNow();true;');
    });
    return () => { sub.remove(); sub2.remove(); app.remove(); };
  }, [open]);

  const onMessage = useCallback((e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'sync') schedule(m).catch(() => {});
    } catch (err) {}
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b14" />
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: 'https://hibty.local/' }}
        javaScriptEnabled domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        onMessage={onMessage}
        onLoadEnd={() => { ready.current = true; if (pending.current) { web.current?.injectJavaScript(pending.current); pending.current = null; } }}
        style={{ flex: 1, backgroundColor: '#0b0b14' }}
      />
    </View>
  );
}

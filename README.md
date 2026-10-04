# Combined App -> Android APK

## Option A: Build in the cloud (no Android Studio)
1. Create a free GitHub repo and upload all these files (keep the .github folder).
2. Go to the repo's Actions tab -> "Build APK" -> Run workflow.
3. When it finishes (~5 min), open the run and download the artifact "app-debug-apk".
4. Unzip, send app-debug.apk to your phone, tap it, allow "Install unknown apps".

## Option B: Build on a PC with Android Studio
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android   # then Build > Build APK(s)

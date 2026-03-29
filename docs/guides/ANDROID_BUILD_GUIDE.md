# Android Build Guide — AlphaWhale

## Prerequisites
- Node.js 18+ (already installed)
- Java 17+ — install from: https://adoptium.net/
- Android Studio — install from: https://developer.android.com/studio
- Android SDK (installed via Android Studio)

## Step 1: Install Capacitor packages
```bash
cd smart-stake
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/push-notifications
```

## Step 2: Build and sync
```bash
npm run build        # Build the web app first
npx cap add android  # Add Android platform (first time only)
npx cap sync android # Sync web build to Android
```

## Step 3: Generate release keystore (do this ONCE — save the file forever)
```bash
keytool -genkey -v -keystore alphawhale-release.keystore \
  -alias alphawhale -keyalg RSA -keysize 2048 -validity 10000
```
⚠️ Save alphawhale-release.keystore and remember the password. Losing it = can never update the app.

## Step 4: Open in Android Studio
```bash
npx cap open android
```

## Step 5: Build signed AAB (Android App Bundle)
1. In Android Studio: Build → Generate Signed Bundle/APK
2. Select: Android App Bundle
3. Keystore: browse to alphawhale-release.keystore
4. Key alias: alphawhale
5. Passwords: enter what you set in Step 3
6. Build variant: release
7. Output: app/release/app-release.aab

## Step 6: Google Play Console
1. Create account: https://play.google.com/console ($25 one-time)
2. Create app → AlphaWhale
3. Production → Releases → Create new release
4. Upload app-release.aab
5. Fill in store listing (copy from store-assets/GOOGLE_PLAY_LISTING.md)
6. Complete content rating questionnaire
7. Set up Data Safety section
8. Submit for review (1-3 business days)

## Common Issues

### "SDK location not found"
Open Android Studio → SDK Manager → note the SDK path → create local.properties:
```
sdk.dir=/Users/[username]/Library/Android/sdk
```

### "Gradle sync failed"
File → Sync Project with Gradle Files

### App crashes on start
Check LogCat in Android Studio for the actual error.
Common cause: missing environment variable → check if the web build has all VITE_ vars baked in.

### White screen in app
The web assets didn't sync. Run: `npm run build && npx cap sync android`

## Testing on physical device
1. Enable Developer Options on your Android phone:
   Settings → About Phone → tap Build Number 7 times
2. Enable USB Debugging in Developer Options
3. Connect phone via USB
4. Android Studio → Run → select your device

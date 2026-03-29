import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration — AlphaWhale iOS & Android App
 *
 * SETUP STEPS:
 * 1. npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
 * 2. npx cap add ios
 * 3. npx cap add android
 * 4. npm run build && npx cap sync
 * 5. npx cap open ios      (requires Xcode on Mac)
 * 6. npx cap open android  (requires Android Studio)
 *
 * iOS App Store: Requires Apple Developer account ($99/yr) → https://developer.apple.com
 * Google Play:   Requires Google Play Console account ($25) → https://play.google.com/console
 */
const config: CapacitorConfig = {
  appId: 'com.alphawhale.app',
  appName: 'AlphaWhale',
  webDir: 'dist',
  server: {
    // For local dev with live reload, set to your local IP:
    // url: 'http://192.168.1.x:8080',
    // cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0f',
    preferredContentMode: 'mobile',
    // Set your Apple Team ID here (from developer.apple.com)
    // teamId: 'XXXXXXXXXX',
  },
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for dev only
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#003366',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;

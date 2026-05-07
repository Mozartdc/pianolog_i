import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mozartdc.pianologi',
  appName: 'pianolog_i',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false
    }
  }
};

export default config;

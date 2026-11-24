import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.listd.app',
  appName: 'Listd',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

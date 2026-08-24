import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ybbindia.app',
  appName: 'YBB - Authorised Business Broker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0E1730',
    allowMixedContent: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '187533747492-ikc8l3uf1iq2htepn8iimno6gl19crff.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0E1730'
    }
  }
};

export default config;

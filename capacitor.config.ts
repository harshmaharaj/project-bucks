
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.443edbf4e9e740b2be5aabd057b3eb48',
  appName: 'time-track-freelance-zenith',
  webDir: 'dist',
  server: {
    url: 'https://443edbf4-e9e7-40b2-be5a-abd057b3eb48.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      showSpinner: false
    }
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.projectorcare.fseportal',
  appName: 'ProjectorCare FSE Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      iosIsDocumentPickerEnabled: true,
      androidIsDocumentPickerEnabled: true
    }
  }
};

export default config;

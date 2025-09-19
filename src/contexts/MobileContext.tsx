import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface MobileContextType {
  isNative: boolean;
  platform: string;
  registerForPushNotifications: () => Promise<void>;
  vibrate: (intensity?: 'light' | 'medium' | 'heavy') => Promise<void>;
  showNotification: (title: string, body: string) => void;
}

// CRÍTICO: Default value seguro
const defaultMobileValue: MobileContextType = {
  isNative: false,
  platform: 'web',
  registerForPushNotifications: async () => {},
  vibrate: async () => {},
  showNotification: () => {},
};

const MobileContext = createContext<MobileContextType>(defaultMobileValue);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isNative] = useState(Capacitor.isNativePlatform());
  const [platform] = useState(Capacitor.getPlatform());

  useEffect(() => {
    if (isNative) {
      initializeNativeFeatures();
    }
  }, [isNative]);

  const initializeNativeFeatures = async () => {
    try {
      // Configure status bar
      if (Capacitor.isPluginAvailable('StatusBar')) {
        await StatusBar.setStyle({ style: Style.Dark });
      }

      // Hide splash screen
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        await SplashScreen.hide();
      }

      // Setup app state listeners
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      App.addListener('appUrlOpen', (event) => {
        console.log('App opened via URL:', event.url);
      });

    } catch (error) {
      console.error('Error initializing native features:', error);
    }
  };

  const registerForPushNotifications = async () => {
    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      showNotification('Push Notifications', 'Push notifications are not available on this device');
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }
      
      // Register for push notifications
      await PushNotifications.register();
      
      // Setup listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
        // Here you would typically send the token to your server
      });
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration:', error);
      });
      
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        vibrate('light');
      });
      
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
      });

      showNotification('Push Notifications', 'Successfully registered for push notifications!');
      
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      showNotification('Error', 'Failed to register for push notifications');
    }
  };

  const vibrate = async (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!Capacitor.isPluginAvailable('Haptics')) return;
    
    try {
      let impactStyle: ImpactStyle;
      switch (intensity) {
        case 'light':
          impactStyle = ImpactStyle.Light;
          break;
        case 'heavy':
          impactStyle = ImpactStyle.Heavy;
          break;
        default:
          impactStyle = ImpactStyle.Medium;
      }
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      // Fallback to toast or alert
      console.log(`Notification: ${title} - ${body}`);
    }
  };

  const value: MobileContextType = {
    isNative,
    platform,
    registerForPushNotifications,
    vibrate,
    showNotification
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

export const useMobile = () => {
  const context = useContext(MobileContext);
  
  // CRÍTICO: Fallback ao invés de erro
  if (!context || context === defaultMobileValue) {
    console.warn('useMobile usado fora do MobileProvider - usando fallback seguro');
    return defaultMobileValue;
  }
  
  return context;
};
import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

export const Haptics = {
  impactAsync: async (style: ExpoHaptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      try {
        await ExpoHaptics.impactAsync(style);
      } catch (error) {
        console.warn('Haptics not supported:', error);
      }
    }
  },
  
  notificationAsync: async (type: ExpoHaptics.NotificationFeedbackType) => {
    if (Platform.OS !== 'web') {
      try {
        await ExpoHaptics.notificationAsync(type);
      } catch (error) {
        console.warn('Haptics not supported:', error);
      }
    }
  },
  
  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      try {
        await ExpoHaptics.selectionAsync();
      } catch (error) {
        console.warn('Haptics not supported:', error);
      }
    }
  }
}; 
import { Platform } from 'react-native';

let Notifications: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  console.log('Notifications not available in this environment');
}

export async function registerForPushNotificationsAsync() {
  if (!Notifications) {
    console.log('Notifications not available');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    return finalStatus;
  } catch (error) {
    console.log('Error registering for notifications:', error);
    return null;
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> {
  if (!Notifications) {
    console.log('Notifications not available');
    return '';
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
    });
    
    return notificationId;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return '';
  }
}

export async function cancelNotification(notificationId: string) {
  if (!Notifications) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.log('Error canceling notification:', error);
  }
}

export async function cancelAllNotifications() {
  if (!Notifications) return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error canceling all notifications:', error);
  }
}

export function calculateTriggerDate(date: string, time: string, minutesBefore: number): Date | null {
  if (!date || !time) return null;
  
  const [hours, minutes] = time.split(':').map(Number);
  const targetDate = new Date(date);
  targetDate.setHours(hours, minutes, 0, 0);
  
  const triggerDate = new Date(targetDate.getTime() - minutesBefore * 60 * 1000);
  
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }
  
  return triggerDate;
}

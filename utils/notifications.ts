import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {

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
}

export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> {
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
}

export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
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

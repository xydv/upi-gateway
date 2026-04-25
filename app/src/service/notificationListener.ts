import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppConfig, type Notification } from '../types/index';
import { serverSender } from './serverSender';

export const notificationListenerService = async ({
  notification,
}: {
  notification?: string;
}) => {
  if (!notification) {
    return;
  }

  try {
    const parsedNotification: Notification = JSON.parse(notification);

    const savedAppsJson = await AsyncStorage.getItem('apps');
    const allApps: AppConfig[] = savedAppsJson ? JSON.parse(savedAppsJson) : [];

    const upiApp = allApps.find(e => e.packageName === parsedNotification.app);

    if (!upiApp) {
      return;
    }

    const { note, amount } = upiApp;

    const amountSource = (parsedNotification as any)[amount.source] || '';
    const amountMatch = new RegExp(amount.regex).exec(amountSource);
    const extractedAmount = amountMatch
      ? amountMatch[1] || amountMatch[0]
      : '';

    const noteSource = (parsedNotification as any)[note.source] || '';
    const noteMatch = new RegExp(note.regex).exec(noteSource);
    const extractedNote = noteMatch ? noteMatch[1] || noteMatch[0] : noteSource;

    if (
      (!amount.optional && !extractedAmount) ||
      (!note.optional && !extractedNote)
    ) {
      return;
    }

    await serverSender(extractedNote, extractedAmount);
  } catch (error) {
    console.error('Error in notificationListenerService:', error);
  }
};

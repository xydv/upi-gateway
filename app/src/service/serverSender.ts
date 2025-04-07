import AsyncStorage from '@react-native-async-storage/async-storage';
import {Notification} from '../types';
import {API_URL} from '../utils';

export async function serverSender(notification: Notification) {
  const key = (await AsyncStorage.getItem('key')) || '';

  // currently only for g-pay, move logic to notificationListener
  const note = notification.text;
  const [_, amount] = /₹(\d+\.\d{2})/.exec(notification.title) || [];

  return await fetch(`${API_URL}/sendUpdate`, {
    body: JSON.stringify({
      note,
      amount,
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      key,
    },
  });
}

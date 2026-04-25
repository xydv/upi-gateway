import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils';

export async function serverSender(note: string, amount: string) {
  const key = (await AsyncStorage.getItem('key')) || '';

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

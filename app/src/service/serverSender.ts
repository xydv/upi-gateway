import AsyncStorage from '@react-native-async-storage/async-storage';
import UpiGateway from "upigateway";

export async function serverSender(note: string, amount: string) {
  const key = (await AsyncStorage.getItem('key')) || '';
  const upigateway = new UpiGateway(key);
  return await upigateway.sendUpdate({ note, amount });
}

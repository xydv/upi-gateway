import {AppRegistry} from 'react-native';
import {RNAndroidNotificationListenerHeadlessJsName} from 'react-native-android-notification-listener';
import App from './src/App';
import {name as appName} from './app.json';
import {notificationListenerService} from './src/service/notificationListener';
import {PaperProvider} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const queryClient = new QueryClient();

export default function Main() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider
          settings={{icon: props => <MaterialCommunityIcons {...props} />}}>
          <App />
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

AppRegistry.registerHeadlessTask(
  RNAndroidNotificationListenerHeadlessJsName,
  () => notificationListenerService,
);

AppRegistry.registerComponent(appName, () => Main);

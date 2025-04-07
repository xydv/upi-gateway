import {type Notification} from '../types/index';
import apps from '../utils/apps';
import {serverSender} from './serverSender';

export const notificationListenerService = async ({
  notification,
}: {
  notification?: string;
}) => {
  if (!notification) {
    return;
  }

  const parsedNotification: Notification = JSON.parse(notification);
  const upiApp = apps.find(e => e.packageName === parsedNotification.app);

  if (!upiApp) {
    return;
  }

  switch (upiApp.packageName) {
    case 'com.google.android.apps.nbu.paisa.user':
      if (parsedNotification.text.length !== 0) {
        await serverSender(parsedNotification);
      }
      return;
  }
};

// use timestamp, amount verification

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import {
  RequestDisableOptimization,
  BatteryOptEnabled,
} from 'react-native-battery-optimization-check';
import {
  Button,
  TextInput,
  List,
  Text,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../types';
import { TopBar } from '../components/top-bar';
import { API_URL } from '../utils';

export default function SettingsScreen() {
  const [key, setKey] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    (async function () {
      const savedKey = (await AsyncStorage.getItem('key')) || '';
      setKey(savedKey);
    })();
  }, []);

  const settingsEnabled = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const notification =
        (await RNAndroidNotificationListener.getPermissionStatus()) ===
        'authorized';
      const optimization = await BatteryOptEnabled();

      return {
        notification,
        optimization,
      };
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const appsQuery = useQuery({
    queryKey: ['app-configs'],
    queryFn: async () => {
      const response = await fetch(`https://upi.234892.xyz/apps`, {
        headers: {
          key: (await AsyncStorage.getItem('key')) || '',
        },
      });
      const data = (await response.json()) as AppConfig[];
      await AsyncStorage.setItem('apps', JSON.stringify(data));
      return data;
    },
    refetchOnWindowFocus: true,
    enabled: !!key,
  });

  async function handleRequestPermission() {
    RNAndroidNotificationListener.requestPermission();
  }

  async function handleRequestOptimization() {
    RequestDisableOptimization();
  }

  async function handleSetApiKey() {
    await AsyncStorage.setItem('key', key);
    await queryClient.invalidateQueries({ queryKey: ['all-requests'] });
    await queryClient.invalidateQueries({ queryKey: ['app-configs'] });
  }

  async function handleRefreshApps() {
    await appsQuery.refetch();
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={styles.mainView}>
          <TextInput
            mode="flat"
            label="api key"
            value={key}
            onChangeText={t => setKey(t)}
            onEndEditing={handleSetApiKey}
            secureTextEntry
          />
          {settingsEnabled.isSuccess && !settingsEnabled.data.notification && (
            <Button mode="contained-tonal" onPress={handleRequestPermission}>
              grant notification permission
            </Button>
          )}
          {settingsEnabled.isSuccess && settingsEnabled.data.optimization && (
            <Button mode="contained-tonal" onPress={handleRequestOptimization}>
              disable battery optimization
            </Button>
          )}

          <Divider style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">synced upi apps</Text>
            <Button
              compact
              icon="refresh"
              onPress={handleRefreshApps}
              loading={appsQuery.isFetching}
            >
              refresh
            </Button>
          </View>

          <List.Section>
            {appsQuery.isSuccess && appsQuery.data.length > 0 ? (
              appsQuery.data.map(app => (
                <List.Item
                  key={app.packageName}
                  title={app.name}
                  left={props => <List.Icon {...props} icon="application-cog" />}
                />
              ))
            ) : appsQuery.isFetching ? (
              <ActivityIndicator style={{ margin: 20 }} />
            ) : (
              <Text style={styles.emptyText}>
                {key ? 'no apps found on server' : 'set api key to sync apps'}
              </Text>
            )}
          </List.Section>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainView: {
    padding: 16,
    gap: 10,
  },
  divider: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.5,
  },
});

import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import {
  RequestDisableOptimization,
  BatteryOptEnabled,
} from 'react-native-battery-optimization-check';
import {Button, TextInput} from 'react-native-paper';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  async function handleRequestPermission() {
    RNAndroidNotificationListener.requestPermission();
  }

  async function handleRequestOptimization() {
    RequestDisableOptimization();
  }

  async function handleSetApiKey() {
    await AsyncStorage.setItem('key', key);
    await queryClient.invalidateQueries({queryKey: ['all-requests']});
  }

  return (
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainView: {
    padding: 16,
    gap: 10,
  },
});

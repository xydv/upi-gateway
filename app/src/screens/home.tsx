import AsyncStorage from '@react-native-async-storage/async-storage';
import {useQuery} from '@tanstack/react-query';
import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {
  ActivityIndicator,
  Badge,
  Card,
  Chip,
  Text,
  useTheme,
} from 'react-native-paper';
import {Request} from '../types';
import {API_URL} from '../utils';

export default function HomeScreen() {
  const theme = useTheme();

  const getAllRequestsQuery = useQuery({
    queryKey: ['all-requests'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/allRequests`, {
        headers: {
          key: (await AsyncStorage.getItem('key')) || '',
        },
      });
      return (await response.json()) as Request[];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  async function onRefresh() {
    await getAllRequestsQuery.refetch();
  }

  if (getAllRequestsQuery.isPending) {
    return (
      <View style={styles.mainView}>
        <ActivityIndicator />
      </View>
    );
  }

  if (getAllRequestsQuery.isError) {
    return (
      <View style={styles.mainView}>
        <Chip
          style={{backgroundColor: theme.colors.tertiary}}
          textStyle={[styles.chipText, {color: theme.colors.onTertiary}]}>
          please set a valid api key
        </Chip>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={getAllRequestsQuery.isPending}
          onRefresh={onRefresh}
        />
      }>
      <View style={styles.mainView}>
        {getAllRequestsQuery.data.length === 0 && (
          <Chip
            style={{backgroundColor: theme.colors.onTertiary}}
            textStyle={[styles.chipText, {color: theme.colors.tertiary}]}>
            no requests found
          </Chip>
        )}
        {getAllRequestsQuery.data.map(r => {
          return (
            <Card key={r.id}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Badge
                    size={9}
                    style={[
                      styles.status,
                      {backgroundColor: getStatusTextAndColor(r.status).color},
                    ]}
                  />
                  <Text variant="bodyLarge">
                    {getStatusTextAndColor(r.status).text} of ₹
                    {r.amount || 'custom'}
                  </Text>
                </View>
                <Text variant="bodyMedium">{r.id.split('-')[4]}</Text>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

function getStatusTextAndColor(status: number) {
  switch (status) {
    case 0:
      return {text: 'payment pending', color: '#ff6600'};
    case 1:
      return {text: 'payment success', color: '#5cb85c'};
    default:
      return {text: 'payment expired', color: '#c21808'};
  }
}

const styles = StyleSheet.create({
  mainView: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  status: {
    alignSelf: 'center',
  },
  chipText: {
    padding: 4,
  },
});

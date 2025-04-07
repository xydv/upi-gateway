import {StyleSheet} from 'react-native';
import {Divider, Text} from 'react-native-paper';

export function TopBar() {
  return (
    <>
      <Text variant="titleLarge" style={[styles.headerStyle]}>
        upi gateway
      </Text>
      <Divider />
    </>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    paddingVertical: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

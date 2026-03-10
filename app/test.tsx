import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.body}>ah ha</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 24,
    color: Colors.text,
  },
});

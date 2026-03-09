import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>test</Text>
      <Image
        source={{ uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/SpongeBob_SquarePants_character.svg/440px-SpongeBob_SquarePants_character.svg.png' }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  text: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  image: {
    width: 280,
    height: 360,
  },
});

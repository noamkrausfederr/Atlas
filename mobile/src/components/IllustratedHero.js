import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function IllustratedHero({ userName = 'there' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {userName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  greeting: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
  },
});

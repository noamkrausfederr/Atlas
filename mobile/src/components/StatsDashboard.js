import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function StatsDashboard({ trips, countries, places }) {
  return (
    <View style={styles.row}>
      <Text style={styles.item}>
        <Text style={styles.num}>{trips}</Text>
        <Text style={styles.label}> Trips</Text>
      </Text>
      <View style={styles.sep} />
      <Text style={styles.item}>
        <Text style={styles.num}>{countries}</Text>
        <Text style={styles.label}> Countries</Text>
      </Text>
      <View style={styles.sep} />
      <Text style={styles.item}>
        <Text style={styles.num}>{places}</Text>
        <Text style={styles.label}> Places</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 2,
  },
  item: {
    fontSize: 13,
  },
  num: {
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
    fontSize: 14,
  },
  label: {
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textMuted,
    fontSize: 13,
  },
  sep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginHorizontal: 10,
  },
});

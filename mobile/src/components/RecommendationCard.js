import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function RecommendationCard({ rec, onPress }) {
  return (
    <TouchableOpacity style={styles.recCard} onPress={() => onPress(rec)} activeOpacity={0.85}>
      <View style={styles.recHeader}>
        <Text style={styles.recCategory}>{rec.category}</Text>
        {rec.distanceFromAccommodation ? (
          <Text style={styles.recDistance}>{rec.distanceFromAccommodation} from stay</Text>
        ) : null}
      </View>
      <Text style={styles.recTitle}>{rec.title}</Text>
      {rec.reason ? (
        <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DED6',
    padding: 14,
    marginBottom: 10
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  recCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9A9A94',
    flexShrink: 1,
    fontFamily: 'Nunito_700Bold'
  },
  recDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9A9A94',
    textAlign: 'right',
    marginLeft: 10,
    flexShrink: 0,
    fontFamily: 'Nunito_700Bold'
  },
  recTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: '#2B2927',
    marginBottom: 4,
    fontFamily: 'Nunito_800ExtraBold'
  },
  recReason: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8C867E',
    fontFamily: 'Nunito_400Regular'
  }
});

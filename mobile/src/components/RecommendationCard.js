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
      <Text style={styles.recReason} numberOfLines={2}>
        {rec.reason}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 14,
    marginBottom: 10
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  recCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#A8998A',
    flexShrink: 1
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B3A32',
    marginBottom: 6
  },
  recReason: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7F7063'
  },
  recDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8998A',
    textAlign: 'right',
    marginLeft: 10,
    flexShrink: 0
  },
});

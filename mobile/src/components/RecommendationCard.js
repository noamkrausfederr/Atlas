import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function RecommendationCard({ rec, onPress }) {
  return (
    <TouchableOpacity style={styles.recCard} onPress={() => onPress(rec)} activeOpacity={0.85}>
      <View style={styles.recCardTop}>
        <Text style={styles.recCategory}>{rec.category}</Text>
        <Text style={styles.recDay}>{rec.dayLabel}</Text>
      </View>
      <Text style={styles.recTitle}>{rec.title}</Text>
      <Text style={styles.recReason} numberOfLines={2}>
        {rec.reason}
      </Text>
      <View style={styles.recCardMeta}>
        <Text style={styles.recPrice}>{rec.price}</Text>
        <Text style={styles.recRating}>★ {rec.rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10
  },
  recCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  recCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#94A3B8'
  },
  recDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden'
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  recReason: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B'
  },
  recCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  recPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  recRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  }
});

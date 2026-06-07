import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

const CATEGORY_ICONS = {
  'Food & Drink': 'restaurant-outline',
  'Culture & History': 'business-outline',
  'Nature & Outdoors': 'leaf-outline',
  'Local Highlights': 'star-outline',
};

export function RecommendationCard({ rec, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(rec)} activeOpacity={0.75}>
      <View style={styles.leftDot}>
        <Ionicons name="location" size={14} color="#F26B64" />
      </View>
      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>{rec.title}</Text>
          {rec.distanceFromAccommodation ? (
            <Text style={styles.distance}>{rec.distanceFromAccommodation} from stay</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function RecommendationGroup({ category, recs, onPress }) {
  const icon = CATEGORY_ICONS[category] || 'compass-outline';
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIconWrap}>
          <Ionicons name={icon} size={14} color={colors.accentDark} />
        </View>
        <Text style={styles.groupTitle}>{category}</Text>
      </View>
      <View style={styles.groupCards}>
        {recs.map((rec) => (
          <RecommendationCard key={rec.id ?? rec.title} rec={rec} onPress={onPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 22,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
  },
  groupCards: {
    gap: 0,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '92%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(242,107,100,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  copy: {
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
  distance: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

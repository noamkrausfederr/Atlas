import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// Decorative dots as a mini trail line
function TrailDots({ count = 4 }) {
  return (
    <View style={styles.trailRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.trailDot,
            { opacity: 0.3 + i * 0.18, width: 3 + i * 0.5, height: 3 + i * 0.5, borderRadius: 2 },
          ]}
        />
      ))}
    </View>
  );
}

export function IllustratedHero() {
  return (
    <View style={styles.container}>
      {/* Top row: logo + decorative icon cluster */}
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={styles.logo}>
            Atlas<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.tagline}>your travel world</Text>
        </View>

        {/* Decorative travel route cluster */}
        <View style={styles.graphicBlock}>
          {/* Floating stars */}
          <View style={[styles.star, { top: 2, right: 10, width: 5, height: 5, borderRadius: 3 }]} />
          <View style={[styles.star, { top: 16, right: 26, width: 3.5, height: 3.5, borderRadius: 2 }]} />
          <View style={[styles.star, { top: 6, right: 40, width: 4, height: 4, borderRadius: 2 }]} />

          {/* Route: pin → dots → plane */}
          <View style={styles.routeRow}>
            <View style={[styles.iconBubble, { backgroundColor: colors.accentOrangeSoft }]}>
              <Ionicons name="location" size={16} color={colors.accentOrange} />
            </View>

            <TrailDots count={4} />

            <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="airplane" size={16} color={colors.accent} />
            </View>

            <TrailDots count={3} />

            <View style={[styles.iconBubble, { backgroundColor: colors.accentGreenSoft }]}>
              <Ionicons name="location" size={14} color={colors.accentGreen} />
            </View>
          </View>

          {/* Globe below route */}
          <View style={styles.globeRow}>
            <Ionicons name="compass-outline" size={13} color={colors.textMuted} />
            <Text style={styles.globeText}>explore</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flexShrink: 1,
  },
  logo: {
    fontSize: 32,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 36,
  },
  dot: {
    color: colors.accent,
  },
  tagline: {
    fontSize: 13,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },
  graphicBlock: {
    alignItems: 'flex-end',
    paddingTop: 2,
    position: 'relative',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.accent,
    opacity: 0.25,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trailDot: {
    backgroundColor: colors.textMuted,
  },
  globeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  globeText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

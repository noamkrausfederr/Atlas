import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { colors, fonts, shadow } from '../theme';

const W = Dimensions.get('window').width;
const CONTENT_W = W - 28;
const CARD_GAP = 10;
const MINI_W = Math.floor((CONTENT_W - CARD_GAP) / 2);
const FEATURED_IMG_H = 220;
const MINI_IMG_H = 120;
const COMPACT_H = 80;

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function dateRange(board) {
  const s = fmtDate(board.startDate), e = fmtDate(board.endDate);
  return s && e ? `${s} – ${e}` : (s || e || '');
}
function getLocation(board) {
  return board.location || board.subtitle || '';
}

function getPlaceholderTheme(board) {
  const s = `${board.location || ''} ${board.title || ''}`.toLowerCase();
  if (/beach|coast|island|maldives/.test(s)) return { bg: '#5CAAD8', icon: 'boat-outline', ic: '#0C3A60' };
  if (/paris|europe|london|prague|vienna/.test(s)) return { bg: '#8870C8', icon: 'business-outline', ic: '#240C55' };
  if (/nature|mountain|forest|alps|zealand/.test(s)) return { bg: '#46A870', icon: 'leaf-outline', ic: '#083818' };
  if (/morocco|desert|dubai|egypt/.test(s)) return { bg: '#D87838', icon: 'sunny-outline', ic: '#5C1808' };
  if (/iceland|snow|ski|winter/.test(s)) return { bg: '#5888C8', icon: 'snow-outline', ic: '#0C2858' };
  return { bg: '#C85A88', icon: 'airplane-outline', ic: '#54081C' };
}

function TripPlaceholder({ board, height }) {
  const t = getPlaceholderTheme(board);
  return (
    <View style={{ height, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={t.icon} size={Math.round(height * 0.28)} color={t.ic} style={{ opacity: 0.55 }} />
    </View>
  );
}

export function IllustratedTripCard({ board, onPress, featured = false, compact = false, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [board.image]);

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  const imageUri = !imageFailed && board.image ? board.image : null;
  const dateText = dateRange(board);
  const loc = getLocation(board);
  const isPast = board.endDate && new Date(board.endDate) < new Date();
  const statusLabel = isPast ? 'Completed' : 'Upcoming';
  const statusColor = isPast ? colors.textMuted : colors.accentDark;
  const statusBg = isPast ? colors.pastSoft : colors.accentSoft;

  // ── Compact horizontal card (past trips list) ──────────────────────────────
  if (compact) {
    return (
      <Animated.View style={[styles.compactCard, style, { transform: [{ scale }] }]}>
        <TouchableOpacity activeOpacity={1} onPress={() => onPress(board)} onPressIn={pressIn} onPressOut={pressOut} style={styles.compactInner}>
          <View style={styles.compactThumb}>
            {imageUri
              ? <Image source={{ uri: imageUri }} style={styles.compactThumbImg} resizeMode="cover" onError={() => setImageFailed(true)} />
              : <TripPlaceholder board={board} height={COMPACT_H} />
            }
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={1}>{board.title}</Text>
            {loc ? <Text style={styles.compactLoc} numberOfLines={1}>{loc}</Text> : null}
            {board.description ? <Text style={styles.compactDesc} numberOfLines={1}>{board.description}</Text> : null}
            {dateText ? <Text style={styles.compactDate}>{dateText}</Text> : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Featured full-width card ───────────────────────────────────────────────
  if (featured) {
    return (
      <Animated.View style={[styles.featuredCard, { width: CONTENT_W }, style, { transform: [{ scale }] }]}>
        <TouchableOpacity activeOpacity={1} onPress={() => onPress(board)} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.92}>
          <View style={styles.featuredImgWrap}>
            {imageUri
              ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => setImageFailed(true)} />
              : <TripPlaceholder board={board} height={FEATURED_IMG_H} />
            }
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle} numberOfLines={2}>{board.title}</Text>
            {loc ? (
              <View style={styles.featuredLocRow}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.featuredLoc} numberOfLines={1}>{loc}</Text>
              </View>
            ) : null}
            {dateText ? <Text style={styles.featuredDate}>{dateText}</Text> : null}
            {board.description ? <Text style={styles.featuredDesc} numberOfLines={2}>{board.description}</Text> : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Mini card (2-column grid) ───────────────────────────────────────────────
  return (
    <Animated.View style={[styles.miniCard, { width: MINI_W }, style, { transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={1} onPress={() => onPress(board)} onPressIn={pressIn} onPressOut={pressOut} style={{ flex: 1 }}>
        <View style={[styles.miniImgWrap, { height: MINI_IMG_H }]}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => setImageFailed(true)} />
            : <TripPlaceholder board={board} height={MINI_IMG_H} />
          }
        </View>
        <View style={styles.miniInfo}>
          <Text style={styles.miniTitle} numberOfLines={1}>{board.title}</Text>
          {loc ? <Text style={styles.miniLoc} numberOfLines={1}>{loc}</Text> : null}
          {board.description ? <Text style={styles.miniDesc} numberOfLines={2}>{board.description}</Text> : null}
          {dateText ? <Text style={styles.miniDate}>{dateText}</Text> : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ── Compact ──
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    ...shadow.sm,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPACT_H,
  },
  compactThumb: {
    width: COMPACT_H,
    height: COMPACT_H,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  compactThumbImg: {
    width: '100%',
    height: '100%',
  },
  compactInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
  },
  compactLoc: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactDesc: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  compactDate: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  completedPill: {
    marginRight: 12,
    backgroundColor: colors.pastSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  completedPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.past,
  },

  // ── Featured ──
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  featuredImgWrap: {
    height: FEATURED_IMG_H,
    overflow: 'hidden',
    borderRadius: 20,
  },
  featuredContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  featuredDate: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  featuredLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featuredLoc: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
  },
  featuredDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Mini ──
  miniCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  miniImgWrap: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  miniInfo: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  miniTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.text,
  },
  miniLoc: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  miniDate: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  miniStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  miniStatusText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

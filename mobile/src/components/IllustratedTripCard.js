import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { colors, fonts, radius, shadow } from '../theme';

const W = Dimensions.get('window').width;
const CONTENT_W = W - 36;
const CARD_GAP = 10;
const MINI_W = Math.floor((CONTENT_W - CARD_GAP) / 2);
const FEATURED_IMG_H = 238;
const MINI_IMG_H = 214;
const COMPACT_H = 92;
const TRIP_RADIUS = radius.trip;
const LOCATION_ACCENTS = [
  { bg: 'rgba(184,206,232,0.30)', text: '#B8CEE8' },
  { bg: 'rgba(211,182,211,0.30)', text: '#D3B6D3' },
  { bg: 'rgba(109,184,190,0.40)', text: '#6DB8BE' },
  { bg: 'rgba(165,187,26,0.30)', text: '#A5BB1A' },
];

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

function getLocationAccent(board) {
  const key = `${board.id || ''}${board.title || ''}${board.location || ''}`;
  const index = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return LOCATION_ACCENTS[index % LOCATION_ACCENTS.length];
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

  const isLocalImage = typeof board.image === 'number';
  const imageSource = isLocalImage
    ? board.image
    : (!imageFailed && board.image ? { uri: board.image } : null);
  const dateText = dateRange(board);
  const loc = getLocation(board);
  const locationAccent = getLocationAccent(board);

  // ── Compact horizontal card (past trips list) ──────────────────────────────
  if (compact) {
    return (
      <Animated.View style={[styles.compactCard, style, { transform: [{ scale }] }]}>
        <TouchableOpacity activeOpacity={1} onPress={() => onPress(board)} onPressIn={pressIn} onPressOut={pressOut} style={styles.compactInner}>
          <View style={styles.compactThumb}>
            {imageSource
              ? <Image source={imageSource} style={{ width: COMPACT_H, height: COMPACT_H, objectFit: 'cover' }} onError={() => !isLocalImage && setImageFailed(true)} />
              : <TripPlaceholder board={board} height={COMPACT_H} />
            }
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={1}>{board.title}</Text>
            {loc ? <Text style={styles.compactLoc} numberOfLines={1}>{loc}</Text> : null}
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
            {imageSource
              ? <Image source={imageSource} style={{ width: CONTENT_W, height: FEATURED_IMG_H, objectFit: 'cover' }} onError={() => !isLocalImage && setImageFailed(true)} />
              : <TripPlaceholder board={board} height={FEATURED_IMG_H} />
            }
          </View>
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle} numberOfLines={2}>{board.title}</Text>
            {loc ? <Text style={styles.featuredLoc} numberOfLines={1}>{loc}</Text> : null}
            {dateText ? <Text style={styles.featuredDate}>{dateText}</Text> : null}
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
          {imageSource
            ? <Image source={imageSource} style={{ width: MINI_W, height: MINI_IMG_H, objectFit: 'cover' }} onError={() => !isLocalImage && setImageFailed(true)} />
            : <TripPlaceholder board={board} height={MINI_IMG_H} />
          }
        </View>
        <View style={styles.miniInfo}>
          <Text style={styles.miniTitle} numberOfLines={2}>{board.title}</Text>
          {loc ? <Text style={styles.miniLoc} numberOfLines={1}>{loc}</Text> : null}
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
    borderRadius: TRIP_RADIUS,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
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
    borderTopLeftRadius: TRIP_RADIUS,
    borderBottomLeftRadius: TRIP_RADIUS,
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
    paddingVertical: 10,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: 1,
  },
  compactLoc: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 1,
  },
  compactDate: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
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
    overflow: 'visible',
  },
  featuredImgWrap: {
    height: FEATURED_IMG_H,
    overflow: 'hidden',
    borderRadius: TRIP_RADIUS,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  featuredInfo: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6,
  },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  featuredDate: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: colors.textMuted,
  },
  featuredLoc: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
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
    overflow: 'visible',
  },
  miniImgWrap: {
    overflow: 'hidden',
    borderRadius: TRIP_RADIUS,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  miniInfo: {
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 4,
  },
  miniTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  miniLoc: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 1,
  },
  miniDate: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 1,
  },
});

import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';

const W = Dimensions.get('window').width;
const CONTENT_W = W - 28;
const CARD_GAP = 10;
const MINI_W = Math.floor((CONTENT_W - CARD_GAP) / 2);

const FEATURED_H = 300;
const FEATURED_ILLUS_H = 180;
const MINI_H = 218;
const MINI_ILLUS_H = 130;

// ─── Theme definitions ──────────────────────────────────────────────────────
const THEMES = {
  coastal: {
    bg: '#5CAAD8', bgMid: '#7DC4EE', bgLight: '#AAD8F8',
    sun: '#F8D458', shade: 'rgba(15,60,130,0.24)',
    icon: 'boat-outline', iconColor: '#0C3A60', type: 'coastal',
  },
  europe: {
    bg: '#8870C8', bgMid: '#A892D8', bgLight: '#C8B6E8',
    sun: '#F8E880', shade: 'rgba(40,15,90,0.24)',
    icon: 'business-outline', iconColor: '#240C55', type: 'europe',
  },
  nature: {
    bg: '#46A870', bgMid: '#6EC48E', bgLight: '#98D8AE',
    sun: '#F8E050', shade: 'rgba(8,72,38,0.24)',
    icon: 'leaf-outline', iconColor: '#083818', type: 'nature',
  },
  warm: {
    bg: '#D87838', bgMid: '#E89858', bgLight: '#F0B880',
    sun: '#F8CC28', shade: 'rgba(130,38,0,0.24)',
    icon: 'sunny-outline', iconColor: '#5C1808', type: 'warm',
  },
  cold: {
    bg: '#5888C8', bgMid: '#7AAAE0', bgLight: '#A2C8F0',
    sun: '#EEE0B8', shade: 'rgba(18,48,118,0.24)',
    icon: 'snow-outline', iconColor: '#0C2858', type: 'cold',
  },
  default: {
    bg: '#C85A88', bgMid: '#DC82AA', bgLight: '#EAA8C6',
    sun: '#F8D870', shade: 'rgba(110,18,52,0.24)',
    icon: 'airplane-outline', iconColor: '#54081C', type: 'default',
  },
};

function getTheme(board) {
  const s = `${board.location || ''} ${board.title || ''}`.toLowerCase();
  if (/venice|croatia|greece|spain|barcelona|maldives|bali|beach|island|coast|sea|ocean|rio|miami/.test(s)) return THEMES.coastal;
  if (/italy/.test(s) && !/venice/.test(s)) return THEMES.europe;
  if (/paris|france|london|prague|vienna|amsterdam|rome|europe|berlin|lisbon|portugal/.test(s)) return THEMES.europe;
  if (/kyoto|japan|alps|mountain|forest|zealand|canada|norway|san francisco|golden gate|california|park/.test(s)) return THEMES.nature;
  if (/morocco|dubai|egypt|desert|india|turkey|africa|mexico|marrakech/.test(s)) return THEMES.warm;
  if (/iceland|alaska|finland|snow|ski|winter|scandinavia/.test(s)) return THEMES.cold;
  return THEMES.default;
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function dateRange(board) {
  const s = fmtDate(board.startDate), e = fmtDate(board.endDate);
  return s && e ? `${s} – ${e}` : (s || e || '');
}
function location(board) {
  const known = { 'Venice Streets': 'Venice, Italy', 'Golden Gate': 'San Francisco, US', 'Kyoto Morning': 'Kyoto, Japan', 'Paris Weekend': 'Paris, France' };
  return board.location || known[board.title] || board.subtitle || '';
}

// ─── Illustration layers ─────────────────────────────────────────────────────
function IllustrationLayer({ theme, isFeatured, cardW, illustH }) {
  const { type, sun, shade, icon, iconColor } = theme;
  const iconSz = isFeatured ? 58 : 44;

  // Icon vertical position (above the bottom decoration)
  const iconBottom = type === 'europe'
    ? illustH * 0.44
    : type === 'nature'
    ? illustH * 0.34
    : illustH * 0.26;

  return (
    <>
      {/* ── Ambient blob ───────────────────────────────────── */}
      <View style={{
        position: 'absolute', top: -illustH * 0.45, right: -cardW * 0.22,
        width: illustH * 1.5, height: illustH * 1.5,
        borderRadius: illustH * 0.75, backgroundColor: shade,
      }} />

      {/* ── Theme-specific decoration ──────────────────────── */}
      {type === 'coastal' && (
        <>
          {/* Sun */}
          <View style={{ position: 'absolute', top: -22, right: -16, width: 76, height: 76, borderRadius: 38, backgroundColor: sun, opacity: 0.88 }} />
          {/* Cloud 1 */}
          <View style={{ position: 'absolute', top: 18, left: 14 }}>
            <View style={{ width: 54, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            <View style={{ position: 'absolute', top: -6, left: 10, width: 36, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.92)' }} />
          </View>
          {/* Cloud 2 */}
          <View style={{ position: 'absolute', top: 24, right: isFeatured ? 50 : 30 }}>
            <View style={{ width: 38, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.72)' }} />
            <View style={{ position: 'absolute', top: -5, left: 7, width: 26, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.84)' }} />
          </View>
          {/* Water */}
          <View style={{ position: 'absolute', bottom: 0, left: -6, right: -6, height: illustH * 0.32, borderTopLeftRadius: cardW * 0.55, borderTopRightRadius: cardW * 0.45, backgroundColor: 'rgba(12,58,130,0.28)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 8, right: 8, height: illustH * 0.18, borderTopLeftRadius: cardW * 0.44, borderTopRightRadius: cardW * 0.56, backgroundColor: 'rgba(12,58,130,0.16)' }} />
          {/* Route dots */}
          {[12, 22, 33, 45, 58, 69, 80].map((pct, i) => (
            <View key={i} style={{ position: 'absolute', bottom: illustH * 0.27, left: `${pct}%`, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(12,58,96,0.38)' }} />
          ))}
        </>
      )}

      {type === 'europe' && (
        <>
          {/* Night sky highlight */}
          <View style={{ position: 'absolute', top: -35, right: -25, width: 100, height: 100, borderRadius: 50, backgroundColor: theme.bgLight, opacity: 0.45 }} />
          {/* Stars */}
          {[[10, 10], [26, 20], [16, 6], [42, 14], [58, 7], [68, 22], [80, 12], [36, 30]].map(([l, t], i) => (
            <View key={i} style={{ position: 'absolute', top: t, left: `${l}%`, width: i < 4 ? 5 : 3.5, height: i < 4 ? 5 : 3.5, borderRadius: 3, backgroundColor: `rgba(255,255,255,${0.55 + (i % 3) * 0.15})` }} />
          ))}
          {/* City skyline */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: illustH * 0.44, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 }}>
            {[26, 16, 40, 20, 34, 14, 48, 22, 30, 12, 36, 18, 28, 14, 24].map((h, i) => (
              <View key={i} style={{
                flex: 1,
                height: h,
                backgroundColor: `rgba(24,8,60,${0.16 + (i % 3) * 0.07})`,
                borderTopLeftRadius: i % 4 === 0 ? 4 : 2,
                borderTopRightRadius: i % 3 === 0 ? 4 : 2,
                marginRight: 2,
              }} />
            ))}
          </View>
        </>
      )}

      {type === 'nature' && (
        <>
          {/* Sun */}
          <View style={{ position: 'absolute', top: -18, right: -12, width: 70, height: 70, borderRadius: 35, backgroundColor: sun, opacity: 0.88 }} />
          {/* Rolling hills — back to front */}
          <View style={{ position: 'absolute', bottom: 0, left: -cardW * 0.15, width: cardW * 0.72, height: illustH * 0.52, borderTopLeftRadius: cardW * 0.36, borderTopRightRadius: cardW * 0.36, backgroundColor: 'rgba(8,72,38,0.28)' }} />
          <View style={{ position: 'absolute', bottom: 0, right: -cardW * 0.08, width: cardW * 0.68, height: illustH * 0.42, borderTopLeftRadius: cardW * 0.34, borderTopRightRadius: cardW * 0.34, backgroundColor: 'rgba(8,72,38,0.2)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: cardW * 0.12, right: cardW * 0.18, height: illustH * 0.28, borderTopLeftRadius: cardW * 0.28, borderTopRightRadius: cardW * 0.28, backgroundColor: 'rgba(8,72,38,0.16)' }} />
          {/* Flower dots */}
          {[14, 28, 44, 60, 76].map((l, i) => (
            <View key={i} style={{ position: 'absolute', bottom: illustH * 0.12, left: `${l}%`, width: 5, height: 5, borderRadius: 3, backgroundColor: `rgba(248,224,80,${0.5 + i * 0.08})` }} />
          ))}
        </>
      )}

      {type === 'warm' && (
        <>
          {/* Large sun */}
          <View style={{ position: 'absolute', top: -28, right: -20, width: 88, height: 88, borderRadius: 44, backgroundColor: sun, opacity: 0.9 }} />
          {/* Sun halo */}
          <View style={{ position: 'absolute', top: -38, right: -30, width: 108, height: 108, borderRadius: 54, backgroundColor: sun, opacity: 0.22 }} />
          {/* Sand dunes */}
          <View style={{ position: 'absolute', bottom: 0, left: -cardW * 0.12, right: cardW * 0.18, height: illustH * 0.46, borderTopLeftRadius: cardW * 0.5, borderTopRightRadius: cardW * 0.5, backgroundColor: 'rgba(130,40,0,0.22)' }} />
          <View style={{ position: 'absolute', bottom: 0, right: -cardW * 0.06, width: cardW * 0.72, height: illustH * 0.36, borderTopLeftRadius: cardW * 0.36, borderTopRightRadius: cardW * 0.36, backgroundColor: 'rgba(130,40,0,0.16)' }} />
          {/* Heat shimmer dots */}
          {[20, 38, 56, 72].map((l, i) => (
            <View key={i} style={{ position: 'absolute', bottom: illustH * 0.35, left: `${l}%`, width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(248,204,40,0.45)' }} />
          ))}
        </>
      )}

      {type === 'cold' && (
        <>
          {/* Moon */}
          <View style={{ position: 'absolute', top: -14, right: -10, width: 62, height: 62, borderRadius: 31, backgroundColor: sun, opacity: 0.86 }} />
          {/* Aurora glow */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: illustH * 0.5, backgroundColor: 'rgba(80,160,200,0.14)', borderBottomLeftRadius: cardW * 0.5, borderBottomRightRadius: cardW * 0.5 }} />
          {/* Snow flakes / dots */}
          {[[10, 20], [22, 10], [36, 28], [52, 14], [66, 22], [80, 8], [90, 30], [14, 38], [44, 40], [72, 34]].map(([l, t], i) => (
            <View key={i} style={{ position: 'absolute', top: t, left: `${l}%`, width: i % 3 === 0 ? 5.5 : 3.5, height: i % 3 === 0 ? 5.5 : 3.5, borderRadius: 3, backgroundColor: `rgba(255,255,255,${0.5 + (i % 3) * 0.18})` }} />
          ))}
          {/* Ice bottom */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: illustH * 0.22, borderTopLeftRadius: cardW * 0.4, borderTopRightRadius: cardW * 0.4, backgroundColor: 'rgba(18,50,120,0.22)' }} />
        </>
      )}

      {type === 'default' && (
        <>
          {/* Sun */}
          <View style={{ position: 'absolute', top: -18, right: -10, width: 68, height: 68, borderRadius: 34, backgroundColor: sun, opacity: 0.86 }} />
          {/* Abstract blobs */}
          <View style={{ position: 'absolute', bottom: 20, left: -18, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          {/* Dotted path */}
          {[10, 22, 36, 50, 64, 77, 89].map((l, i) => (
            <View key={i} style={{ position: 'absolute', bottom: illustH * 0.28, left: `${l}%`, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(84,8,28,0.35)' }} />
          ))}
          {/* Bottom fade */}
          <View style={{ position: 'absolute', bottom: 0, left: -4, right: -4, height: illustH * 0.28, borderTopLeftRadius: cardW * 0.4, borderTopRightRadius: cardW * 0.4, backgroundColor: 'rgba(110,18,52,0.22)' }} />
        </>
      )}

      {/* ── Main hero icon (always centered) ──────────────── */}
      <View style={{ position: 'absolute', bottom: iconBottom, left: 0, right: 0, alignItems: 'center' }}>
        <Ionicons name={icon} size={iconSz} color={iconColor} />
      </View>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function IllustratedTripCard({ board, onPress, featured = false, style }) {
  const theme = getTheme(board);
  const scale = useRef(new Animated.Value(1)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => { setImageFailed(false); }, [board.image]);

  const cardW = featured ? CONTENT_W : MINI_W;
  const cardH = featured ? FEATURED_H : MINI_H;
  const illustH = featured ? FEATURED_ILLUS_H : MINI_ILLUS_H;
  const br = featured ? 28 : 22;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  const dateText = dateRange(board);
  const loc = location(board);
  const imageUri = !imageFailed && board.image ? board.image : null;

  return (
    <Animated.View style={[
      styles.card,
      { width: cardW, height: cardH, borderRadius: br },
      style,
      { transform: [{ scale }] },
    ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(board)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {/* Illustration area */}
        <View style={[styles.illustArea, { height: illustH, backgroundColor: theme.bg }]}>
          <IllustrationLayer theme={theme} isFeatured={featured} cardW={cardW} illustH={illustH} />

          {/* Small circular photo — featured only */}
          {featured && imageUri ? (
            <View style={styles.photoRing}>
              <Image source={{ uri: imageUri }} style={styles.photoCircle} onError={() => setImageFailed(true)} />
            </View>
          ) : null}

          {/* Status badge (featured only) */}
          {featured ? (
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: theme.sun }]} />
              <Text style={styles.statusText}>upcoming</Text>
            </View>
          ) : null}
        </View>

        {/* Info panel */}
        <View style={styles.infoPanel}>
          <Text
            style={[styles.title, featured && styles.titleFeatured]}
            numberOfLines={featured ? 2 : 1}
          >
            {board.title}
          </Text>
          {loc ? (
            <Text style={styles.locationText} numberOfLines={1}>{loc}</Text>
          ) : null}
          {dateText ? (
            <View style={[styles.datePill, { backgroundColor: theme.bgLight }]}>
              <Text style={[styles.datePillText, { color: theme.iconColor }]}>{dateText}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#FFFDF8',
    shadowColor: '#2B2927',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  illustArea: {
    overflow: 'hidden',
    position: 'relative',
  },
  photoRing: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.88)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  photoCircle: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoPanel: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 13,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#2B2927',
    marginBottom: 2,
  },
  titleFeatured: {
    fontSize: 19,
    lineHeight: 24,
  },
  locationText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    color: '#8C867E',
    marginBottom: 8,
  },
  datePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  datePillText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
});

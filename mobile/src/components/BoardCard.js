import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
const CARD_GAP = 12;
const PAGE_PADDING = 12;
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - PAGE_PADDING * 2 - CARD_GAP) / 2);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.42);

// Soft pastel accent strips — deterministic by id hash
const CARD_ACCENTS = [
  '#C8DFF5', // soft blue
  '#F5D9C8', // soft peach
  '#C8EAD8', // soft mint
  '#DDD0F0', // soft lavender
  '#F5ECC8', // soft butter
  '#F0D0E5', // soft blush
  '#C8F0F5', // soft ice
  '#D0F5CC', // soft lime
];

function getAccent(board) {
  const hash = (board.id || board.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CARD_ACCENTS[hash % CARD_ACCENTS.length];
}

function formatShortDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatBoardDates(board) {
  const start = formatShortDate(board.startDate);
  const end = formatShortDate(board.endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function getBoardLocation(board) {
  const knownLocations = {
    'Venice Streets': 'Venice, Italy',
    'Golden Gate': 'San Francisco, US',
    'Kyoto Morning': 'Kyoto, Japan',
    'Paris Weekend': 'Paris, France'
  };
  return board.location || knownLocations[board.title] || board.subtitle;
}

export function BoardCard({ board, onPress, style }) {
  const [imageFailed, setImageFailed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setImageFailed(false);
  }, [board.image]);

  const imageUri = imageFailed || !board.image ? FALLBACK_IMAGE : board.image;
  const locationText = getBoardLocation(board);
  const dateText = formatBoardDates(board);
  const accentColor = getAccent(board);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={[styles.card, style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(board)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressArea}
      >
        {/* Top: destination photo */}
        <View style={styles.photoSection}>
          <Image
            source={{ uri: imageUri }}
            style={styles.photo}
            onError={() => setImageFailed(true)}
          />
          {/* Warm fade at bottom of photo into info panel */}
          <View style={styles.photoFade} />
        </View>

        {/* Bottom: warm cream info panel */}
        <View style={styles.infoPanel}>
          <Text style={styles.cardTitle} numberOfLines={2}>{board.title}</Text>
          {locationText ? (
            <Text style={styles.cardLocation} numberOfLines={1}>{locationText}</Text>
          ) : null}
          {dateText ? (
            <View style={[styles.datePill, { backgroundColor: accentColor }]}>
              <Text style={styles.datePillText}>{dateText}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  pressArea: {
    flex: 1,
  },
  photoSection: {
    flex: 58,
    position: 'relative',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    backgroundColor: 'rgba(255,253,248,0.2)',
  },
  infoPanel: {
    flex: 42,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    marginBottom: 2,
    flexShrink: 1,
  },
  cardLocation: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    marginBottom: 8,
  },
  datePill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  datePillText: {
    fontSize: 10,
    color: colors.text,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

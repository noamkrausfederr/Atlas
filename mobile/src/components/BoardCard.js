import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
const CARD_GAP = 12;
const PAGE_PADDING = 12;
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - PAGE_PADDING * 2 - CARD_GAP) / 2);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.38);

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

  const isLocalImage = typeof board.image === 'number';
  const imageSource = isLocalImage
    ? board.image
    : (imageFailed || !board.image ? { uri: FALLBACK_IMAGE } : { uri: board.image });
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
        <View style={styles.photoSection}>
          <Image
            source={imageSource}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, objectFit: 'cover' }}
            onError={() => !isLocalImage && setImageFailed(true)}
          />
        </View>
        <View style={styles.infoPanel}>
          <Text style={styles.cardTitle} numberOfLines={2}>{board.title}</Text>
          {locationText ? (
            <Text style={styles.cardLocation} numberOfLines={1}>{locationText}</Text>
          ) : null}
          {dateText ? (
            <Text style={styles.dateText} numberOfLines={1}>{dateText}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },
  pressArea: {
    overflow: 'visible',
  },
  photoSection: {
    height: CARD_HEIGHT,
    overflow: 'hidden',
    borderRadius: radius.trip,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoPanel: {
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    marginBottom: 2,
    flexShrink: 1,
  },
  cardLocation: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontFamily: 'Nunito_400Regular',
  },
});

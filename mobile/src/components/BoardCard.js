import { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
const CARD_GAP = 12;
const PAGE_PADDING = 12;
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - PAGE_PADDING * 2 - CARD_GAP) / 2);

function formatShortDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatBoardDates(board) {
  const start = formatShortDate(board.startDate);
  const end = formatShortDate(board.endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function getBoardLocation(board) {
  const knownLocations = {
    'Venice Streets': 'Venice, Italy',
    'Golden Gate': 'San Francisco, United States',
    'Kyoto Morning': 'Kyoto, Japan',
    'Paris Weekend': 'Paris, France'
  };

  return board.location || knownLocations[board.title] || board.subtitle;
}

export function BoardCard({ board, onPress, style }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [board.image]);

  const imageUri = imageFailed || !board.image ? FALLBACK_IMAGE : board.image;
  const locationText = getBoardLocation(board);
  const dateText = formatBoardDates(board);

  return (
    <TouchableOpacity style={[styles.boardCard, style]} onPress={() => onPress(board)}>
      <Image source={{ uri: imageUri }} style={styles.cardImage} onError={() => setImageFailed(true)} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{board.title}</Text>
        {locationText ? <Text style={styles.cardLocation}>{locationText}</Text> : null}
        {dateText ? <Text style={styles.cardDates} numberOfLines={1}>{dateText}</Text> : null}
        {board.description ? <Text style={styles.cardDescription} numberOfLines={3}>{board.description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boardCard: {
    width: CARD_WIDTH,
    minHeight: 253,
    marginRight: CARD_GAP,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  cardImage: {
    width: '100%',
    height: 100
  },
  cardContent: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 10,
    minHeight: 135,
    justifyContent: 'flex-start'
  },
  cardTitle: {
    fontSize: 19,
    lineHeight: 24,
    color: '#111111',
    marginBottom: 3,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  cardLocation: {
    fontSize: 13,
    lineHeight: 17,
    color: '#575757',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '500'
  },
  cardDates: {
    fontSize: 12,
    lineHeight: 16,
    color: '#7A7A7A',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: '400'
  },
  cardDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: '#9A9A9A',
    marginTop: 6,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: '400'
  }
});

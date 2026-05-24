import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

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
  const privacyText = board.isPublic ? 'Public' : 'Private';

  return (
    <TouchableOpacity style={[styles.boardCard, style]} onPress={() => onPress(board)}>
      <Image source={{ uri: imageUri }} style={styles.cardImage} onError={() => setImageFailed(true)} />
      <View style={styles.cardContent}>
        <View style={styles.cardTextColumn}>
          <Text style={styles.cardTitle} numberOfLines={1}>{board.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{locationText}</Text>
        </View>
        <View style={styles.cardMetaColumn}>
          {dateText ? <Text style={styles.cardDates} numberOfLines={1}>{dateText}</Text> : null}
          <Text style={styles.cardPrivacy} numberOfLines={1}>{privacyText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boardCard: {
    width: 220,
    marginRight: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFF8F0',
    shadowColor: '#E8C5B2',
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  cardImage: {
    width: '100%',
    height: 144
  },
  cardContent: {
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  cardTextColumn: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B3A32',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#A97C50'
  },
  cardDates: {
    color: '#7F7063',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'right',
    minWidth: 88,
    marginRight: -2
  },
  cardMetaColumn: {
    alignItems: 'flex-end',
    minWidth: 88
  },
  cardPrivacy: {
    color: '#A97C50',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'uppercase'
  }
});

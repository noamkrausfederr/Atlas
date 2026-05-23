import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

export function BoardCard({ board, onPress, style }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [board.image]);

  const imageUri = imageFailed || !board.image ? FALLBACK_IMAGE : board.image;

  return (
    <TouchableOpacity style={[styles.boardCard, style]} onPress={() => onPress(board)}>
      <Image source={{ uri: imageUri }} style={styles.cardImage} onError={() => setImageFailed(true)} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{board.title}</Text>
        <Text style={styles.cardSubtitle}>{board.subtitle}</Text>
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#FBC4D2',
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
    padding: 16
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A0A2B',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7D3DBA'
  }
});

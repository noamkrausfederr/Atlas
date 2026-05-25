import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function RecommendationDetailScreen({ board, rec, onBack, onAddToItinerary, added }) {
  const sources = rec.sourceAttributions ?? [];
  const ratingLabel = rec.rating ? `★ ${rec.rating} (${rec.reviewCount} reviews)` : 'Open-data listing';
  const reviewUrl = sources.find((source) => source.url)?.url || rec.websiteUrl;

  return (
    <View style={styles.exploreSubScreen}>
      <Image source={{ uri: rec.image }} style={styles.recDetailHero} />
      <View style={styles.recDetailBody}>
        <View style={styles.exploreSubHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.recDetailBadgeRow}>
            <Text style={styles.recCategory}>{rec.category}</Text>
            <Text style={styles.recDay}>{rec.dayLabel}</Text>
          </View>
        </View>

        <Text style={styles.recDetailTitle}>{rec.title}</Text>
        <View style={styles.recDetailStats}>
          <Text style={styles.recDetailPrice}>{rec.price}</Text>
          <Text style={styles.recDetailRating}>{ratingLabel}</Text>
        </View>
        <Text style={styles.recDetailAddress}>{rec.address}</Text>
        <Text style={styles.recDetailDescription}>{rec.description}</Text>
        <Text style={styles.recDetailReason}>{rec.reason}</Text>

        {reviewUrl ? (
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => Linking.openURL(reviewUrl)}>
            <Text style={styles.secondaryActionButtonText}>Open reviews</Text>
          </TouchableOpacity>
        ) : null}

        {sources.length ? (
          <>
            <Text style={styles.recReviewsHeading}>Sources</Text>
            {sources.map((source) => (
              <View key={`${rec.id}-${source.provider}-${source.providerId}`} style={styles.reviewCard}>
                <View style={styles.reviewCardTop}>
                  <Text style={styles.reviewAuthor}>{source.provider.toUpperCase()}</Text>
                  {source.rating ? <Text style={styles.reviewStars}>★ {source.rating}</Text> : null}
                </View>
                <Text style={styles.reviewText}>
                  {source.reviewCount ? `${source.reviewCount} reviews` : source.summary || 'Live listing'}
                  {source.url ? ' · Provider page available' : ''}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.addItineraryButton, added && styles.addItineraryButtonDone]}
          onPress={onAddToItinerary}
          disabled={added}
        >
          <Text style={styles.addItineraryButtonText}>{added ? 'Added to itinerary ✓' : '+ Add to itinerary'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exploreSubScreen: {
    paddingBottom: 24
  },
  recDetailHero: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16
  },
  recDetailBody: {
    paddingBottom: 8
  },
  exploreSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2D8D8'
  },
  backButtonText: {
    color: '#A97C50',
    fontWeight: '700'
  },
  recDetailBadgeRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8
  },
  recCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#A8998A'
  },
  recDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B3A32',
    backgroundColor: '#F1E7DA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden'
  },
  recDetailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4B3A32',
    marginBottom: 10
  },
  recDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  recDetailPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B3A32'
  },
  recDetailRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F7063'
  },
  recDetailAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B5A4C',
    marginBottom: 12
  },
  recDetailDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B5A4C',
    marginBottom: 10
  },
  recDetailReason: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7F7063',
    marginBottom: 18
  },
  recReviewsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B3A32',
    marginBottom: 10
  },
  reviewCard: {
    backgroundColor: '#F1E7DA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 12,
    marginBottom: 8
  },
  reviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B3A32'
  },
  reviewStars: {
    fontSize: 12,
    color: '#D6A45B'
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B5A4C'
  },
  secondaryActionButton: {
    marginBottom: 16,
    backgroundColor: '#F1E7DA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryActionButtonText: {
    color: '#4B3A32',
    fontSize: 15,
    fontWeight: '700'
  },
  addItineraryButton: {
    marginTop: 16,
    backgroundColor: '#4B3A32',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center'
  },
  addItineraryButtonDone: {
    backgroundColor: '#7F7063'
  },
  addItineraryButtonText: {
    color: '#FFF8F0',
    fontSize: 15,
    fontWeight: '700'
  }
});

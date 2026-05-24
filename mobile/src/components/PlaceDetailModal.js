import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

const DAY_INDEXES = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6
};

function formatAddressFromNominatim(place) {
  const address = place?.address;
  if (!address) return place?.display_name;
  return [
    address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road,
    address.neighbourhood || address.suburb || address.city || address.town || address.village,
    address.state,
    address.postcode,
    address.country
  ].filter(Boolean).join(', ');
}

function parseTimeValue(value) {
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function dayTokenMatchesToday(token, todayIndex) {
  if (!token) return true;
  if (token.includes('-')) {
    const [start, end] = token.split('-');
    const startIndex = DAY_INDEXES[start];
    const endIndex = DAY_INDEXES[end];
    if (startIndex === undefined || endIndex === undefined) return false;
    if (startIndex <= endIndex) return todayIndex >= startIndex && todayIndex <= endIndex;
    return todayIndex >= startIndex || todayIndex <= endIndex;
  }
  return DAY_INDEXES[token] === todayIndex;
}

function getOpenStatus(openingHours) {
  if (!openingHours) return 'Live hours unavailable';
  if (openingHours.trim() === '24/7') return 'Open now · 24/7';

  const now = new Date();
  const todayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rules = openingHours.split(';').map((rule) => rule.trim()).filter(Boolean);

  for (const rule of rules) {
    const dayMatch = rule.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?/);
    const dayToken = dayMatch?.[0];
    if (!dayTokenMatchesToday(dayToken, todayIndex)) continue;

    const timeMatch = rule.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (!timeMatch) continue;
    const open = parseTimeValue(timeMatch[1]);
    const close = parseTimeValue(timeMatch[2]);
    if (open === null || close === null) continue;

    const isOpen = open <= close
      ? currentMinutes >= open && currentMinutes <= close
      : currentMinutes >= open || currentMinutes <= close;
    return `${isOpen ? 'Open now' : 'Closed now'} · ${timeMatch[1]}-${timeMatch[2]}`;
  }

  return `Hours listed · ${openingHours}`;
}

async function fetchLivePlaceDetails(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '1',
      addressdetails: '1',
      extratags: '1'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });
    const results = await response.json();
    const result = results?.[0];
    if (!result) return null;

    return {
      address: formatAddressFromNominatim(result),
      website: result.extratags?.website || result.extratags?.url || result.extratags?.contact_website,
      openingHours: result.extratags?.opening_hours
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getPlaceDetail(place, tripTitle, location, dateLabel, fallbackImage) {
  const reviews = place.reviews?.length
    ? place.reviews
    : [
        { author: 'Atlas pick', stars: 5, text: 'Fits the rhythm of this itinerary.' },
        { author: 'Recent traveler', stars: 4, text: 'Easy to pair with nearby plans.' }
      ];

  const summary = place.description || place.note || place.reason || `Saved to ${tripTitle}${dateLabel ? ` for ${dateLabel}` : ''}.`;

  return {
    category: place.category || place.note?.split('·')[1]?.trim() || 'Itinerary',
    price: place.price || (place.note?.includes('Free') ? 'Free' : null),
    rating: place.rating ? `★ ${place.rating}${place.reviewCount ? ` (${place.reviewCount} reviews)` : ''}` : '★ 4.7 (42 reviews)',
    address: place.address || location,
    sourceUrl: place.sourceUrl || place.url || place.link,
    website: place.website,
    openingHours: place.openingHours,
    tips: place.tips || [
      'Save this stop near nearby plans so it is easy to revisit.',
      'Check hours before you go and leave a little buffer for transit.'
    ],
    summary,
    reviews
  };
}

function PlaceDetailContent({ place, tripTitle, location, dateLabel, fallbackImage, onBack }) {
  if (!place) return null;

  const { category, price, rating, address, sourceUrl, website, openingHours, tips, summary, reviews } = getPlaceDetail(
    place,
    tripTitle,
    location,
    dateLabel,
    fallbackImage
  );
  const [liveDetails, setLiveDetails] = useState(null);
  const detailAddress = liveDetails?.address || address;
  const detailWebsite = liveDetails?.website || website || sourceUrl;
  const detailHours = liveDetails?.openingHours || openingHours;
  const openStatus = useMemo(() => getOpenStatus(detailHours), [detailHours]);
  const directionsQuery = encodeURIComponent(detailAddress || `${place.name || place.title} ${location}`);

  useEffect(() => {
    let isActive = true;
    const query = `${place.name || place.title} ${location || ''}`.trim();

    fetchLivePlaceDetails(query).then((details) => {
      if (isActive) {
        setLiveDetails(details);
      }
    });

    return () => {
      isActive = false;
    };
  }, [location, place.name, place.title]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.badges}>
          <Text style={styles.category}>{category}</Text>
          {dateLabel ? <Text style={styles.day}>{dateLabel}</Text> : null}
        </View>
      </View>

      <Text style={styles.title}>{place.name || place.title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      {price && (
        <View style={styles.stats}>
          <Text style={styles.price}>{price}</Text>
        </View>
      )}

      <View style={styles.sectionHeadingRow}>
        <Text style={[styles.sectionHeading, styles.sectionHeadingInRow]}>Reviews</Text>
        {rating ? <Text style={styles.rating}>{rating}</Text> : null}
      </View>
      {reviews.map((review, index) => (
        <View key={`${place.id}-review-${index}`} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <Text style={styles.reviewAuthor}>{review.author}</Text>
            <Text style={styles.reviewStars}>{'★'.repeat(review.stars)}</Text>
          </View>
          <Text style={styles.reviewText}>{review.text}</Text>
        </View>
      ))}

      <View style={styles.tipsCard}>
        <Text style={styles.tipsHeading}>Insider tips</Text>
        {tips.map((tip, index) => (
          <Text key={`${place.id}-tip-${index}`} style={styles.tipText}>• {tip}</Text>
        ))}
      </View>

      <Text style={[styles.sectionHeading, styles.detailsHeading]}>Details</Text>
      {detailAddress ? <Text style={styles.detailLine}>📍 {detailAddress}</Text> : null}
      <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${directionsQuery}`)}>
        <Text style={styles.detailLink}>Get directions</Text>
      </TouchableOpacity>
      <Text style={styles.detailLine}>{openStatus}</Text>
      {detailHours ? <Text style={styles.detailSubline}>Opening hours: {detailHours}</Text> : null}
      {detailWebsite ? (
        <TouchableOpacity onPress={() => Linking.openURL(detailWebsite)}>
          <Text style={styles.detailLink}>Open website</Text>
        </TouchableOpacity>
      ) : null}
      {sourceUrl && sourceUrl !== detailWebsite ? (
        <TouchableOpacity onPress={() => Linking.openURL(sourceUrl)}>
          <Text style={styles.detailLink}>Open original page</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

export function PlaceDetailScreen({ place, tripTitle, location, dateLabel, fallbackImage, onBack }) {
  return (
    <View style={styles.screen}>
      <PlaceDetailContent
        place={place}
        tripTitle={tripTitle}
        location={location}
        dateLabel={dateLabel}
        fallbackImage={fallbackImage}
        onBack={onBack}
      />
    </View>
  );
}

export function PlaceDetailModal({ visible, place, tripTitle, location, dateLabel, fallbackImage, onClose }) {
  if (!place) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <PlaceDetailContent
            place={place}
            tripTitle={tripTitle}
            location={location}
            dateLabel={dateLabel}
            fallbackImage={fallbackImage}
            onBack={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 24
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 15, 0.45)',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F6E4F8'
  },
  backButtonText: {
    color: '#7D3DBA',
    fontWeight: '700'
  },
  badges: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#94A3B8'
  },
  day: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B'
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 12
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 16
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionHeadingInRow: {
    marginBottom: 0
  },
  detailsHeading: {
    marginTop: 18
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 16,
    marginTop: 18,
    marginBottom: 18
  },
  tipsHeading: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10
  },
  tipText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6
  },
  detailLine: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8
  },
  detailSubline: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10
  },
  detailLink: {
    color: '#7D3DBA',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  reviewStars: {
    fontSize: 12,
    color: '#F59E0B'
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569'
  }
});

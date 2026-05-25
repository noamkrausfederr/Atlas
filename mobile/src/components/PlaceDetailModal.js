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

function formatStatusTime(value) {
  if (!value) return '';
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatPriceRange(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (/^free$/i.test(normalized)) return 'Free';
  if (/^\$+$/.test(normalized)) return normalized;

  const amountMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!amountMatch) {
    return normalized;
  }

  const amount = Number(amountMatch[1]);
  if (Number.isNaN(amount)) {
    return normalized;
  }
  if (amount <= 10) return '$';
  if (amount <= 30) return '$$';
  if (amount <= 60) return '$$$';
  return '$$$$';
}

function formatWebsiteLabel(value) {
  if (!value) return '';

  return String(value)
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}

function getOpenStatus(openingHours) {
  if (!openingHours) {
    return { label: 'Hours unavailable', detail: null, tone: 'muted' };
  }
  if (openingHours.trim() === '24/7') {
    return { label: 'Open now', detail: '24/7', tone: 'open' };
  }

  const now = new Date();
  const todayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rules = openingHours.split(';').map((rule) => rule.trim()).filter(Boolean);
  let firstMatchingRange = null;

  for (const rule of rules) {
    const dayMatch = rule.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?/);
    const dayToken = dayMatch?.[0];
    if (!dayTokenMatchesToday(dayToken, todayIndex)) continue;

    const timeMatch = rule.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (!timeMatch) continue;
    const open = parseTimeValue(timeMatch[1]);
    const close = parseTimeValue(timeMatch[2]);
    if (open === null || close === null) continue;
    const formattedRange = `${formatStatusTime(timeMatch[1])} - ${formatStatusTime(timeMatch[2])}`;
    if (!firstMatchingRange) {
      firstMatchingRange = formattedRange;
    }

    const isOpen = open <= close
      ? currentMinutes >= open && currentMinutes <= close
      : currentMinutes >= open || currentMinutes <= close;
    if (!isOpen) continue;

    const normalizedClose = open <= close || currentMinutes <= close ? close : close + 1440;
    const normalizedCurrent = currentMinutes > normalizedClose ? currentMinutes - 1440 : currentMinutes;
    const minutesUntilClose = normalizedClose - normalizedCurrent;

    if (minutesUntilClose <= 60) {
      return { label: 'Closing soon', detail: formattedRange, tone: 'warning' };
    }

    return { label: 'Open now', detail: formattedRange, tone: 'open' };
  }

  return { label: 'Closed now', detail: firstMatchingRange, tone: 'closed' };
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
  return {
    category: place.category || place.note?.split('·')[1]?.trim() || 'Itinerary',
    price: place.price || null,
    address: place.address || location,
    sourceUrl: place.sourceUrl || place.url || place.link,
    website: place.website || place.websiteUrl,
    openingHours: place.openingHours,
    dateLabel
  };
}

function PlaceDetailContent({ place, tripTitle, location, dateLabel, fallbackImage, onBack }) {
  if (!place) return null;

  const { price, address, sourceUrl, website, openingHours } = getPlaceDetail(
    place,
    tripTitle,
    location,
    dateLabel,
    fallbackImage
  );
  const [liveDetails, setLiveDetails] = useState(null);
  const detailAddress = liveDetails?.address || address;
  const detailWebsite = liveDetails?.website || website || sourceUrl;
  const detailWebsiteLabel = formatWebsiteLabel(detailWebsite);
  const detailHours = liveDetails?.openingHours || openingHours;
  const openStatus = useMemo(() => getOpenStatus(detailHours), [detailHours]);
  const directionsQuery = encodeURIComponent(detailAddress || `${place.name || place.title} ${location}`);
  const formattedPrice = formatPriceRange(price);
  const openingHoursText =
    openStatus.label === 'Hours unavailable'
      ? null
      : openStatus.detail || detailHours || null;

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
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{place.name || place.title}</Text>
      </View>

      <View style={styles.detailsCard}>
        {formattedPrice ? (
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Price range</Text>
            <Text style={styles.detailValue}>{formattedPrice}</Text>
          </View>
        ) : null}

        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Website</Text>
          {detailWebsite ? (
            <TouchableOpacity onPress={() => Linking.openURL(detailWebsite)}>
              <Text style={styles.inlineLink}>{detailWebsiteLabel}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.detailSubValue}>Website unavailable</Text>
          )}
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Address</Text>
          {detailAddress ? <Text style={styles.detailValue}>{detailAddress}</Text> : <Text style={styles.detailSubValue}>Location unavailable</Text>}
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${directionsQuery}`)}>
            <Text style={styles.inlineLink}>Get directions</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.detailBlock, styles.detailBlockLast]}>
          <Text style={styles.detailLabel}>Opening hours</Text>
          <View style={[styles.statusPill, styles[`statusPill${openStatus.tone.charAt(0).toUpperCase()}${openStatus.tone.slice(1)}`]]}>
            <Text style={[styles.statusPillText, styles[`statusPillText${openStatus.tone.charAt(0).toUpperCase()}${openStatus.tone.slice(1)}`]]}>
              {openStatus.label}
            </Text>
          </View>
          {openingHoursText ? <Text style={styles.detailValue}>{openingHoursText}</Text> : null}
        </View>
      </View>
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
    backgroundColor: 'rgba(10, 8, 15, 0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '72%',
    backgroundColor: '#FFF8F0',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14
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
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#4B3A32',
    textAlign: 'right',
    lineHeight: 24,
    paddingTop: 4
  },
  detailsCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 16,
    marginBottom: 4
  },
  detailBlock: {
    paddingBottom: 12,
    marginBottom: 12
  },
  detailBlockLast: {
    paddingBottom: 0,
    marginBottom: 0
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12
  },
  statusPillOpen: {
    backgroundColor: '#DCFCE7'
  },
  statusPillWarning: {
    backgroundColor: '#FEF3C7'
  },
  statusPillClosed: {
    backgroundColor: '#FEE2E2'
  },
  statusPillMuted: {
    backgroundColor: '#E5E7EB'
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800'
  },
  statusPillTextOpen: {
    color: '#166534'
  },
  statusPillTextWarning: {
    color: '#92400E'
  },
  statusPillTextClosed: {
    color: '#991B1B'
  },
  statusPillTextMuted: {
    color: '#4B5563'
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7F7063',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  detailValue: {
    fontSize: 14,
    color: '#6B5A4C',
    lineHeight: 22,
    marginBottom: 6
  },
  detailSubValue: {
    color: '#6B5A4C',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6
  },
  inlineLink: {
    color: '#6B5A4C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  }
});

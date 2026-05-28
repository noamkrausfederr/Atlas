import { Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

const DAY_INDEXES = {
  Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6
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
  if (!amountMatch) return normalized;
  const amount = Number(amountMatch[1]);
  if (Number.isNaN(amount)) return normalized;
  if (amount <= 10) return '$';
  if (amount <= 30) return '$$';
  if (amount <= 60) return '$$$';
  return '$$$$';
}

function formatWebsiteLabel(value) {
  if (!value) return '';
  return String(value).replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function getOpenStatus(openingHours) {
  if (!openingHours) return { label: 'Hours unavailable', detail: null, tone: 'muted' };
  if (openingHours.trim() === '24/7') return { label: 'Open now', detail: '24/7', tone: 'open' };

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
    if (!firstMatchingRange) firstMatchingRange = formattedRange;
    const isOpen = open <= close
      ? currentMinutes >= open && currentMinutes <= close
      : currentMinutes >= open || currentMinutes <= close;
    if (!isOpen) continue;
    const normalizedClose = open <= close || currentMinutes <= close ? close : close + 1440;
    const normalizedCurrent = currentMinutes > normalizedClose ? currentMinutes - 1440 : currentMinutes;
    const minutesUntilClose = normalizedClose - normalizedCurrent;
    if (minutesUntilClose <= 60) return { label: 'Closing soon', detail: formattedRange, tone: 'warning' };
    return { label: 'Open now', detail: formattedRange, tone: 'open' };
  }
  return { label: 'Closed now', detail: firstMatchingRange, tone: 'closed' };
}

async function fetchLivePlaceDetails(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', addressdetails: '1', extratags: '1' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    const results = await response.json();
    const result = results?.[0];
    if (!result) return null;
    return {
      address: formatAddressFromNominatim(result),
      website: result.extratags?.website || result.extratags?.url || result.extratags?.contact_website,
      openingHours: result.extratags?.opening_hours
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function Row({ label, children, extraSpacing }) {
  return (
    <View style={[styles.row, extraSpacing && styles.rowExtraSpacing]}>
      <Text style={[styles.rowLabel, extraSpacing && styles.rowLabelExtraSpacing]}>{label}</Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

function PlaceDetailContent({ place, location, dateLabel, onClose, onDelete }) {
  if (!place) return null;

  const address = place.address || location;
  const sourceUrl = place.sourceUrl || place.url || place.link;
  const website = place.website || place.websiteUrl;
  const price = place.price || null;
  const openingHours = place.openingHours;

  const [liveDetails, setLiveDetails] = useState(null);
  const detailAddress = liveDetails?.address || address;
  const detailWebsite = liveDetails?.website || website || sourceUrl;
  const detailWebsiteLabel = formatWebsiteLabel(detailWebsite);
  const detailHours = liveDetails?.openingHours || openingHours;
  const openStatus = useMemo(() => getOpenStatus(detailHours), [detailHours]);
  const directionsQuery = encodeURIComponent(detailAddress || `${place.name || place.title} ${location}`);
  const formattedPrice = formatPriceRange(price);
  const openingHoursText = openStatus.label === 'Hours unavailable' ? null : openStatus.detail || detailHours || null;

  useEffect(() => {
    let isActive = true;
    const query = `${place.name || place.title} ${location || ''}`.trim();
    fetchLivePlaceDetails(query).then((details) => {
      if (isActive) setLiveDetails(details);
    });
    return () => { isActive = false; };
  }, [location, place.name, place.title]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle} numberOfLines={2}>{place.name || place.title}</Text>
          {dateLabel ? <Text style={styles.cardDate}>{dateLabel}</Text> : null}
        </View>
        <TouchableOpacity style={styles.closeButton} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {place.note ? (
          <View style={styles.noteBlock}>
            <Text style={styles.noteText}>{place.note}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          {formattedPrice ? (
            <Row label="Price range">
              <Text style={styles.rowValueText}>{formattedPrice}</Text>
            </Row>
          ) : null}

          <Row label="Address">
            {detailAddress
              ? <Text style={styles.rowValueText}>{detailAddress}</Text>
              : <Text style={styles.rowValueMuted}>Location unavailable</Text>}
            <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${directionsQuery}`)}>
              <Text style={styles.directionsText}>Get directions</Text>
            </TouchableOpacity>
          </Row>

          <Row label="Website">
            {detailWebsite
              ? <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(detailWebsite)}>
                  <Text style={styles.linkText} numberOfLines={1}>{detailWebsiteLabel}</Text>
                </TouchableOpacity>
              : <Text style={styles.rowValueMuted}>Not available</Text>}
          </Row>

          <Row label="Hours" extraSpacing>
            <View style={[styles.statusPill, styles[`pill_${openStatus.tone}`]]}>
              <Text style={[styles.statusPillText, styles[`pillText_${openStatus.tone}`]]}>{openStatus.label}</Text>
            </View>
            {openingHoursText ? <Text style={styles.rowValueText}>{openingHoursText}</Text> : null}
          </Row>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.deleteButton} activeOpacity={0.8} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

export function PlaceDetailScreen({ place, tripTitle, location, dateLabel, fallbackImage, onBack, onDelete }) {
  return (
    <View style={styles.screen}>
      <PlaceDetailContent
        place={place}
        location={location}
        dateLabel={dateLabel}
        onClose={onBack}
        onDelete={onDelete}
      />
    </View>
  );
}

export function PlaceDetailModal({ visible, place, tripTitle, location, dateLabel, fallbackImage, onClose, onDelete }) {
  if (!place) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.cardWrap}>
          <PlaceDetailContent
            place={place}
            location={location}
            dateLabel={dateLabel}
            onClose={onClose}
            onDelete={onDelete}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43,41,39,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40
  },
  cardWrap: {
    width: '100%',
    maxWidth: 420
  },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 10
  },
  cardHeaderText: {
    flex: 1
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#2B2927',
    fontFamily: 'Nunito_800ExtraBold'
  },
  cardDate: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 16,
    color: '#8C867E',
    fontFamily: 'Nunito_400Regular'
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  closeButtonText: {
    fontSize: 13,
    color: '#6F6F6B',
    fontWeight: '600',
    lineHeight: 16
  },
  scrollArea: {
    maxHeight: 340
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 4
  },
  noteBlock: {
    marginBottom: 12
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2B2927',
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: '#F8F5F0',
    overflow: 'hidden',
    marginBottom: 12
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  rowExtraSpacing: {
    paddingVertical: 15
  },
  rowLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#9A9A94',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    fontFamily: 'Nunito_700Bold'
  },
  rowLabelExtraSpacing: {
    marginBottom: 8
  },
  rowValue: {
    gap: 4
  },
  rowValueText: {
    fontSize: 14,
    lineHeight: 19,
    color: '#2B2927',
    fontFamily: 'Nunito_400Regular'
  },
  rowValueMuted: {
    fontSize: 14,
    lineHeight: 19,
    color: '#AFAFА9',
    fontFamily: 'Nunito_400Regular'
  },
  linkText: {
    fontSize: 14,
    lineHeight: 19,
    color: '#3B6EA8',
    fontWeight: '600',
    fontFamily: 'Nunito_700Bold'
  },
  directionsText: {
    fontSize: 14,
    lineHeight: 19,
    color: '#2B2927',
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4
  },
  pill_open: { backgroundColor: '#DCFCE7' },
  pill_warning: { backgroundColor: '#FEF3C7' },
  pill_closed: { backgroundColor: '#FEE2E2' },
  pill_muted: { backgroundColor: '#F4F0EB' },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  },
  pillText_open: { color: '#166534' },
  pillText_warning: { color: '#92400E' },
  pillText_closed: { color: '#991B1B' },
  pillText_muted: { color: '#6F6F6B' },
  deleteButton: {
    alignSelf: 'flex-end',
    marginRight: 18,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0DADA',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 24,
    paddingVertical: 11
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C0392B',
    fontFamily: 'Nunito_700Bold'
  }
});

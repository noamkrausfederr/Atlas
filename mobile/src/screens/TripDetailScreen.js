import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function clampDateToMin(date, minDate) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const min = new Date(minDate);
  min.setHours(0, 0, 0, 0);
  return next < min ? min : next;
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getOrdinalSuffix(day) {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return 'th';
  }
  if (day % 10 === 1) return 'st';
  if (day % 10 === 2) return 'nd';
  if (day % 10 === 3) return 'rd';
  return 'th';
}

function formatItineraryDate(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase();
  const month = date.toLocaleDateString(undefined, { month: 'long' }).toLowerCase();
  const day = date.getDate();
  return `${weekday}, ${day}${getOrdinalSuffix(day)} ${month}`;
}

function getTripDateSections(startDate, endDate) {
  const sections = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end && sections.length < 60) {
    sections.push({
      key: getDateKey(cursor),
      title: formatItineraryDate(cursor),
      date: new Date(cursor)
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return sections.length ? sections : [{ key: getDateKey(startDate), title: formatItineraryDate(startDate), date: startDate }];
}

function getPlaceSectionIndex(place, sectionCount) {
  if (typeof place.dayIndex === 'number') {
    return Math.min(Math.max(place.dayIndex, 0), sectionCount - 1);
  }
  if (typeof place.day === 'number') {
    return Math.min(Math.max(place.day - 1, 0), sectionCount - 1);
  }
  if (place.date) {
    const placeDate = new Date(place.date);
    if (!Number.isNaN(placeDate.getTime())) {
      return placeDate;
    }
  }
  return 0;
}

export function TripDetailScreen({ board, onBack, onUpdateBoard, onOpenRecommendations }) {
  const today = startOfToday();
  const [itinerary, setItinerary] = useState(board.placesList ?? []);
  const [startDate, setStartDate] = useState(() =>
    board.startDate ? clampDateToMin(new Date(board.startDate), today) : today
  );
  const [endDate, setEndDate] = useState(() => {
    const fallback = new Date(today);
    fallback.setDate(fallback.getDate() + Math.max((board.days || 3) - 1, 0));
    const initial = board.endDate ? new Date(board.endDate) : fallback;
    const minEnd = board.startDate ? clampDateToMin(new Date(board.startDate), today) : today;
    return clampDateToMin(initial, minEnd);
  });
  const [activeDateField, setActiveDateField] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const itinerarySections = getTripDateSections(startDate, endDate).map((section) => ({ ...section, places: [] }));

  itinerary.forEach((place) => {
    const target = getPlaceSectionIndex(place, itinerarySections.length);
    if (target instanceof Date) {
      const matchingIndex = itinerarySections.findIndex((section) => section.key === getDateKey(target));
      itinerarySections[matchingIndex >= 0 ? matchingIndex : 0].places.push(place);
      return;
    }
    itinerarySections[target].places.push(place);
  });

  const persistBoard = (patch) => {
    onUpdateBoard?.({
      placesList: itinerary,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...patch
    });
  };

  const extractPlacesFromUrl = async (url) => {
    if (!url) return [];
    if (url.includes('tiktok.com')) {
      return [
        { id: `p-${Date.now()}-1`, name: `${board.title} - Highlight 1`, note: 'From TikTok', dayIndex: 0 },
        { id: `p-${Date.now()}-2`, name: `${board.title} - Highlight 2`, note: 'From TikTok', dayIndex: 0 }
      ];
    }
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const token = parts.slice(-1)[0] || url;
      return [{ id: `p-${Date.now()}`, name: decodeURIComponent(token), note: 'From link', dayIndex: 0 }];
    } catch (e) {
      return [{ id: `p-${Date.now()}`, name: url, note: 'From link', dayIndex: 0 }];
    }
  };

  const handleAddLink = async () => {
    const places = await extractPlacesFromUrl(linkInput.trim());
    if (places.length) {
      setItinerary((current) => {
        const next = [...current, ...places];
        onUpdateBoard?.({
          placesList: next,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        return next;
      });
    }
    setLinkInput('');
  };

  const toggleDateField = (field) => {
    setActiveDateField((current) => (current === field ? null : field));
  };

  const handleStartDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setActiveDateField(null);
    }
    if (!selectedDate) {
      return;
    }
    const nextStart = clampDateToMin(selectedDate, today);
    const nextEnd = endDate < nextStart ? nextStart : endDate;
    setStartDate(nextStart);
    if (endDate < nextStart) {
      setEndDate(nextEnd);
    }
    persistBoard({ startDate: nextStart.toISOString(), endDate: nextEnd.toISOString() });
  };

  const handleEndDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setActiveDateField(null);
    }
    if (!selectedDate) {
      return;
    }
    const minEnd = startDate > today ? startDate : today;
    const nextEnd = clampDateToMin(selectedDate, minEnd);
    setEndDate(nextEnd);
    persistBoard({ startDate: startDate.toISOString(), endDate: nextEnd.toISOString() });
  };

  return (
    <View style={styles.detailScreen}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle} numberOfLines={2}>
          {board.title}
        </Text>
      </View>

      <View style={styles.datesTopRow}>
        <TouchableOpacity
          style={[styles.dateBox, activeDateField === 'start' && styles.dateBoxActive]}
          onPress={() => toggleDateField('start')}
          activeOpacity={0.75}
        >
          <Text style={styles.statLabel}>Start</Text>
          <Text style={styles.datesValue}>{startDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateBox, styles.dateBoxLast, activeDateField === 'end' && styles.dateBoxActive]}
          onPress={() => toggleDateField('end')}
          activeOpacity={0.75}
        >
          <Text style={styles.statLabel}>End</Text>
          <Text style={styles.datesValue}>{endDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      {activeDateField === 'start' && (
        <View style={styles.inlineCalendarWrap}>
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={today}
            onChange={handleStartDateChange}
            style={styles.inlineCalendar}
          />
        </View>
      )}
      {activeDateField === 'end' && (
        <View style={styles.inlineCalendarWrap}>
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={startDate > today ? startDate : today}
            onChange={handleEndDateChange}
            style={styles.inlineCalendar}
          />
        </View>
      )}

      <View style={styles.detailBody}>
        <Text style={[styles.sectionTitle, styles.itineraryHeading]}>Itinerary</Text>
        <ScrollView style={styles.itineraryList} contentContainerStyle={styles.itineraryListContent} showsVerticalScrollIndicator={false}>
          {itinerarySections.map((section, index) => (
            <View key={section.key} style={styles.itineraryDaySection}>
              <View style={styles.itineraryDayRail}>
                <View style={styles.itineraryDayDot} />
                {index < itinerarySections.length - 1 && <View style={styles.itineraryDayLine} />}
              </View>
              <View style={styles.itineraryDayContent}>
                <Text style={styles.itineraryDayTitle}>{section.title}</Text>
                {section.places.length === 0 && <Text style={styles.itineraryEmpty}>No plans yet.</Text>}
                {section.places.map((p) => (
                  <View key={p.id} style={styles.itineraryRow}>
                    <Text style={styles.itineraryName}>{p.name}</Text>
                    {p.note && <Text style={styles.itineraryNote}>{p.note}</Text>}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.addLinkFooter}>
        <View style={styles.addLinkRow}>
          <TextInput
            placeholder="Add recommendation link (TikTok, YouTube...)"
            value={linkInput}
            onChangeText={setLinkInput}
            style={styles.linkInput}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.detailActionButton} onPress={handleAddLink}>
            <Text style={styles.detailActionText}>Add</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.recommendationsButton} onPress={onOpenRecommendations}>
          <Text style={styles.recommendationsButtonText}>Personal Recommendations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 20,
    overflow: 'hidden'
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
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
  detailTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#2A0A2B',
    textAlign: 'right'
  },
  datesTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  dateBoxLast: {
    marginRight: 0
  },
  dateBoxActive: {
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF'
  },
  inlineCalendarWrap: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12
  },
  inlineCalendar: {
    width: Platform.OS === 'ios' ? '108%' : '100%',
    alignSelf: 'center',
    transform: Platform.OS === 'ios' ? [{ scale: 0.92 }] : [],
    marginVertical: Platform.OS === 'ios' ? -12 : 0
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500'
  },
  datesValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A0A2B'
  },
  detailBody: {
    flex: 1,
    minHeight: 0
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A0A2B',
    marginTop: 4
  },
  itineraryHeading: {
    marginBottom: 12
  },
  itineraryList: {
    flex: 1
  },
  itineraryListContent: {
    paddingBottom: 8
  },
  itineraryEmpty: {
    color: '#94A3B8',
    marginBottom: 10,
    fontSize: 13
  },
  itineraryDaySection: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  itineraryDayRail: {
    width: 24,
    alignItems: 'center'
  },
  itineraryDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DD77F2',
    marginTop: 6
  },
  itineraryDayLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#F3E7F3',
    marginTop: 4
  },
  itineraryDayContent: {
    flex: 1,
    paddingBottom: 18
  },
  itineraryDayTitle: {
    marginBottom: 10,
    color: '#2A0A2B',
    fontSize: 15,
    fontWeight: '800'
  },
  itineraryRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7F3'
  },
  itineraryName: {
    fontWeight: '700',
    color: '#2A0A2B'
  },
  itineraryNote: {
    color: '#7D3DBA',
    fontSize: 12
  },
  addLinkFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    paddingBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  addLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3E7F3',
    fontSize: 14
  },
  detailActionButton: {
    backgroundColor: '#DD77F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailActionText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  recommendationsButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 13,
    alignItems: 'center'
  },
  recommendationsButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800'
  }
});

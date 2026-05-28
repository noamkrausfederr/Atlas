import { ActivityIndicator, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { autocompleteAccommodation } from '../../data/liveRecommendations';

const ACTIVITY_ICON_COLORS = ['#C8DFF5', '#F5D9C8', '#C8EAD8', '#DDD0F0', '#F5ECC8'];

function getActivityIcon(name) {
  const n = (name || '').toLowerCase();
  if (/hotel|hostel|airbnb|check.?in|check.?out/.test(n)) return 'bed-outline';
  if (/eat|food|restaurant|cafe|coffee|lunch|dinner|breakfast|brunch/.test(n)) return 'restaurant-outline';
  if (/flight|airport|fly|plane/.test(n)) return 'airplane-outline';
  if (/walk|hike|stroll/.test(n)) return 'walk-outline';
  if (/museum|gallery|art|exhibit/.test(n)) return 'business-outline';
  if (/beach|pool|swim/.test(n)) return 'water-outline';
  if (/car|drive|taxi|uber/.test(n)) return 'car-outline';
  if (/shop|market|store|mall/.test(n)) return 'bag-handle-outline';
  return 'location-outline';
}

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
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'long' });
  const day = date.getDate();
  return `${weekday}, ${day}${getOrdinalSuffix(day)} ${month}`;
}

function formatTripHeaderDate(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
}

function getSafeDate(value, fallback = new Date()) {
  const candidate = value ? new Date(value) : new Date(fallback);
  return Number.isNaN(candidate.getTime()) ? new Date(fallback) : candidate;
}

function parseItineraryTimeValue(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatItineraryTimeValue(value) {
  const totalMinutes = parseItineraryTimeValue(value);
  if (totalMinutes === null) return value || '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getFallbackItineraryTime(index) {
  const totalMinutes = 9 * 60 + index * 120;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function clampTimeMinutes(value) {
  const minutesInDay = 24 * 60;
  const normalized = ((value % minutesInDay) + minutesInDay) % minutesInDay;
  const rounded = Math.round(normalized / 5) * 5;
  return rounded === minutesInDay ? 0 : rounded;
}

function formatMinutesAsTime(totalMinutes) {
  const safeMinutes = clampTimeMinutes(totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatItineraryChipWeekday(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatItineraryChipMonth(date) {
  return date.toLocaleDateString(undefined, { month: 'short' });
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

export function TripEditScreen({ board, onBack, onSave, onDuplicateBoard, onDeleteBoard }) {
  const today = startOfToday();
  const initialStartDate = clampDateToMin(getSafeDate(board.startDate, today), today);
  const initialEndDate = clampDateToMin(getSafeDate(board.endDate, initialStartDate), initialStartDate);
  const [title, setTitle] = useState(board.title ?? '');
  const [location, setLocation] = useState(board.location ?? board.subtitle ?? '');
  const [description, setDescription] = useState(board.description ?? '');
  const [accommodation, setAccommodation] = useState(board.accommodation ?? '');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isPublic, setIsPublic] = useState(Boolean(board.isPublic));
  const [activeDateField, setActiveDateField] = useState(null);

  const handleSave = () => {
    onSave?.({
      title: title.trim() || board.title,
      location: location.trim(),
      subtitle: location.trim() || board.subtitle,
      description: description.trim(),
      accommodation: accommodation.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1),
      isPublic
    });
    onBack?.();
  };

  const handleStartDateChange = (_event, selectedDate) => {
    if (!selectedDate) return;
    const nextStart = clampDateToMin(selectedDate, today);
    const nextEnd = endDate < nextStart ? nextStart : endDate;
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setActiveDateField('end');
  };

  const handleEndDateChange = (_event, selectedDate) => {
    if (!selectedDate) return;
    const nextEnd = clampDateToMin(selectedDate, startDate > today ? startDate : today);
    setEndDate(nextEnd);
    setActiveDateField(null);
  };

  return (
    <View style={styles.detailScreen}>
      <ScrollView contentContainerStyle={styles.editScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>Edit trip</Text>
            <TouchableOpacity onPress={handleSave} style={styles.editSaveButton} activeOpacity={0.8}>
              <Text style={styles.editSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Trip title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.editInput}
              placeholder="Trip title"
              placeholderTextColor="#A8A8A2"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.editInput}
              placeholder="City, country"
              placeholderTextColor="#A8A8A2"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View style={styles.editDateRow}>
            <View style={styles.editDateField}>
              <Text style={styles.editLabel}>Start</Text>
              <TouchableOpacity
                style={[styles.editInput, styles.editDateButton]}
                activeOpacity={0.8}
                onPress={() => setActiveDateField((current) => (current === 'start' ? null : 'start'))}
              >
                <Text style={styles.editDateValue}>{formatTripHeaderDate(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.editDateField}>
              <Text style={styles.editLabel}>End</Text>
              <TouchableOpacity
                style={[styles.editInput, styles.editDateButton]}
                activeOpacity={0.8}
                onPress={() => setActiveDateField((current) => (current === 'end' ? null : 'end'))}
              >
                <Text style={styles.editDateValue}>{formatTripHeaderDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeDateField === 'start' ? (
            <View style={styles.editCalendarWrap}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={today}
                onChange={handleStartDateChange}
              />
            </View>
          ) : null}

          {activeDateField === 'end' ? (
            <View style={styles.editCalendarWrap}>
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={startDate > today ? startDate : today}
                onChange={handleEndDateChange}
              />
            </View>
          ) : null}

          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Staying at</Text>
            <TextInput
              value={accommodation}
              onChangeText={setAccommodation}
              style={styles.editInput}
              placeholder="Hotel, Airbnb, or address"
              placeholderTextColor="#A8A8A2"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.editInput, styles.editTextArea]}
              placeholder="Add a short description"
              placeholderTextColor="#A8A8A2"
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />
          </View>

          <TouchableOpacity
            style={styles.editPrivacyRow}
            activeOpacity={0.8}
            onPress={() => setIsPublic((current) => !current)}
          >
            <View>
              <Text style={styles.editPrivacyTitle}>Trip privacy</Text>
              <Text style={styles.editPrivacySubtitle}>{isPublic ? 'Visible on your public profile' : 'Only visible to you'}</Text>
            </View>
            <View style={[styles.editPrivacyPill, isPublic && styles.editPrivacyPillActive]}>
              <Text style={[styles.editPrivacyPillText, isPublic && styles.editPrivacyPillTextActive]}>
                {isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.editActionsSection}>
            <TouchableOpacity style={styles.editSecondaryAction} activeOpacity={0.8} onPress={onDuplicateBoard}>
              <Text style={styles.editSecondaryActionText}>Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editDangerAction} activeOpacity={0.8} onPress={onDeleteBoard}>
              <Text style={styles.editDangerActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function TripDetailScreen({ board, onBack, onUpdateBoard, onOpenRecommendations, onOpenEditTrip }) {
  const today = startOfToday();
  const [itinerary, setItinerary] = useState(board.placesList ?? []);
  const [draggedPlaceId, setDraggedPlaceId] = useState(null);
  const [dropTargetSectionIndex, setDropTargetSectionIndex] = useState(null);
  const [isDraggingItinerary, setIsDraggingItinerary] = useState(false);
  const dragStartCenterY = useRef(0);
  const dragTouchOffsetY = useRef(0);
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragReadyPlaceId = useRef(null);
  const suppressPlacePressRef = useRef(false);
  const isPanDragging = useRef(false);
  const dropTargetSectionRef = useRef(null);
  const sectionRefs = useRef({});
  const itemRefs = useRef({});
  const sectionLayouts = useRef({});
  const itemLayouts = useRef({});
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
  const [selectedItineraryDayIndex, setSelectedItineraryDayIndex] = useState(0);
  const [editingTimePlaceId, setEditingTimePlaceId] = useState(null);
  const [timeDrafts, setTimeDrafts] = useState({});
  const [editingActivityPlaceId, setEditingActivityPlaceId] = useState(null);
  const [activityDrafts, setActivityDrafts] = useState({});
  const [addActivityModal, setAddActivityModal] = useState(null);
  const [showAddActivityTimePicker, setShowAddActivityTimePicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const addressRequestId = useRef(0);
  const addressBlurTimer = useRef(null);
  const addActivityScrollRef = useRef(null);
  const [linkInput, setLinkInput] = useState('');
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [accommodation, setAccommodation] = useState(board.accommodation ?? '');
  const [isAccommodationFocused, setIsAccommodationFocused] = useState(false);
  const [accommodationSuggestions, setAccommodationSuggestions] = useState([]);
  const [isSearchingAccommodation, setIsSearchingAccommodation] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [accommodationY, setAccommodationY] = useState(0);
  const scrollViewRef = useRef(null);
  const accommodationInputRef = useRef(null);
  const accommodationBlurTimer = useRef(null);
  const accommodationRequestId = useRef(0);
  const itinerarySections = getTripDateSections(startDate, endDate).map((section) => ({ ...section, places: [] }));

  itinerary.forEach((place) => {
    const target = getPlaceSectionIndex(place, itinerarySections.length);
    const enrichPlace = (sectionIndex, fallbackIndex) => ({
      ...place,
      displayTime: place.time || getFallbackItineraryTime(fallbackIndex),
      sectionIndex
    });
    if (target instanceof Date) {
      const matchingIndex = itinerarySections.findIndex((section) => section.key === getDateKey(target));
      const normalizedIndex = matchingIndex >= 0 ? matchingIndex : 0;
      itinerarySections[normalizedIndex].places.push(
        enrichPlace(normalizedIndex, itinerarySections[normalizedIndex].places.length)
      );
      return;
    }
    itinerarySections[target].places.push(
      enrichPlace(target, itinerarySections[target].places.length)
    );
  });
  itinerarySections.forEach((section) => {
    section.places.sort((left, right) => {
      const leftMinutes = parseItineraryTimeValue(left.displayTime) ?? Number.POSITIVE_INFINITY;
      const rightMinutes = parseItineraryTimeValue(right.displayTime) ?? Number.POSITIVE_INFINITY;
      return leftMinutes - rightMinutes;
    });
  });
  const safeSelectedItineraryDayIndex = Math.min(Math.max(selectedItineraryDayIndex, 0), Math.max(itinerarySections.length - 1, 0));
  const selectedItinerarySection = itinerarySections[safeSelectedItineraryDayIndex] ?? itinerarySections[0] ?? null;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const handleShow = (event) => setKeyboardHeight(event.endCoordinates?.height ?? 0);
    const handleHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (isAccommodationFocused && keyboardHeight > 0) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, accommodationY - 80), animated: true });
    }
  }, [keyboardHeight, isAccommodationFocused, accommodationY]);

  useEffect(() => () => {
    clearTimeout(accommodationBlurTimer.current);
  }, []);

  useEffect(() => {
    if (selectedItineraryDayIndex !== safeSelectedItineraryDayIndex) {
      setSelectedItineraryDayIndex(safeSelectedItineraryDayIndex);
    }
  }, [safeSelectedItineraryDayIndex, selectedItineraryDayIndex]);

  useEffect(() => {
    const query = accommodation.trim();
    let isActive = true;

    if (!isAccommodationFocused || query.length < 2) {
      setAccommodationSuggestions([]);
      setIsSearchingAccommodation(false);
      return undefined;
    }

    const requestId = ++accommodationRequestId.current;
    setIsSearchingAccommodation(true);
    const debounce = 220;
    const timer = setTimeout(async () => {
      const results = await autocompleteAccommodation(query, board.location ?? '');
      if (!isActive || requestId !== accommodationRequestId.current) return;
      setAccommodationSuggestions(
        results.map((item) => ({
          primaryName: item.name || item.address.split(',')[0]?.trim() || item.address,
          fullAddress: item.address,
          lat: item.lat,
          lng: item.lng,
          placeId: item.placeId || null
        }))
      );
      setIsSearchingAccommodation(false);
    }, debounce);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [accommodation, isAccommodationFocused, board.location]);

  useEffect(() => {
    const query = addActivityModal?.address?.trim() ?? '';
    let isActive = true;

    if (!isAddressFocused || query.length < 2) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return undefined;
    }

    const requestId = ++addressRequestId.current;
    setIsSearchingAddress(true);
    const timer = setTimeout(async () => {
      const results = await autocompleteAccommodation(query, board.location ?? '');
      if (!isActive || requestId !== addressRequestId.current) return;
      setAddressSuggestions(
        results.map((item) => ({
          primaryName: item.name || item.address.split(',')[0]?.trim() || item.address,
          fullAddress: item.address,
          lat: item.lat,
          lng: item.lng,
          placeId: item.placeId || null
        }))
      );
      setIsSearchingAddress(false);
    }, 220);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [addActivityModal?.address, isAddressFocused, board.location]);

  useEffect(() => () => { clearTimeout(addressBlurTimer.current); }, []);

  const persistBoard = (patch) => {
    onUpdateBoard?.({
      placesList: itinerary,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...patch
    });
  };
  const persistItinerary = (nextItinerary) => {
    onUpdateBoard?.({
      placesList: nextItinerary,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  };

  const buildSortedItinerary = (places) => {
    const nextSections = getTripDateSections(startDate, endDate).map((section) => ({ ...section, places: [] }));

    places.forEach((place) => {
      const target = getPlaceSectionIndex(place, nextSections.length);
      const normalizedTarget = target instanceof Date
        ? Math.max(0, nextSections.findIndex((section) => section.key === getDateKey(target)))
        : target;
      nextSections[normalizedTarget >= 0 ? normalizedTarget : 0].places.push(place);
    });

    nextSections.forEach((section) => {
      section.places.sort((left, right) => {
        const leftMinutes = parseItineraryTimeValue(left.time) ?? Number.POSITIVE_INFINITY;
        const rightMinutes = parseItineraryTimeValue(right.time) ?? Number.POSITIVE_INFINITY;
        return leftMinutes - rightMinutes;
      });
    });

    return nextSections.flatMap((section) => section.places);
  };

  const measureItineraryLayouts = () => {
    Object.entries(sectionRefs.current).forEach(([index, node]) => {
      node?.measureInWindow?.((_x, y, _width, height) => {
        sectionLayouts.current[index] = { y, height };
      });
    });
    Object.entries(itemRefs.current).forEach(([id, node]) => {
      node?.measureInWindow?.((_x, y, _width, height) => {
        itemLayouts.current[id] = { ...(itemLayouts.current[id] ?? {}), id, y, height };
      });
    });
  };

  const getTargetSectionIndex = (screenY) => {
    const layouts = Object.entries(sectionLayouts.current);
    if (!layouts.length) return 0;

    const containing = layouts.find(([, layout]) => screenY >= layout.y && screenY <= layout.y + layout.height);
    if (containing) return Number(containing[0]);

    return layouts.reduce((nearest, [index, layout]) => {
      const center = layout.y + layout.height / 2;
      const distance = Math.abs(screenY - center);
      return distance < nearest.distance ? { index: Number(index), distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  };

  const getTargetInsertIndex = (sectionIndex, screenY, draggingId) => {
    const rows = Object.values(itemLayouts.current)
      .filter((layout) => layout.sectionIndex === sectionIndex && layout.id !== draggingId)
      .sort((a, b) => a.index - b.index);

    if (!rows.length) return 0;

    const firstAfter = rows.findIndex((row) => screenY < row.y + row.height / 2);
    return firstAfter === -1 ? rows.length : firstAfter;
  };

  const buildMovedItinerary = (current, placeId, sectionIndex, insertIndex) => {
    const dragged = current.find((place) => place.id === placeId);
    if (!dragged) return current;

    const nextSections = getTripDateSections(startDate, endDate).map((section) => ({ ...section, places: [] }));
    current
      .filter((place) => place.id !== placeId)
      .forEach((place) => {
        const target = getPlaceSectionIndex(place, nextSections.length);
        const normalizedTarget = target instanceof Date
          ? Math.max(0, nextSections.findIndex((section) => section.key === getDateKey(target)))
          : target;
        nextSections[normalizedTarget >= 0 ? normalizedTarget : 0].places.push(place);
      });

    const updatedPlace = { ...dragged, dayIndex: sectionIndex, day: sectionIndex + 1, date: nextSections[sectionIndex]?.date?.toISOString() };
    nextSections[sectionIndex].places.splice(insertIndex, 0, updatedPlace);
    return nextSections.flatMap((section) => section.places);
  };

  const movePlaceToPosition = (placeId, sectionIndex, insertIndex) => {
    const nextItinerary = buildMovedItinerary(itinerary, placeId, sectionIndex, insertIndex);
    if (nextItinerary === itinerary) return;
    setItinerary(nextItinerary);
    persistItinerary(nextItinerary);
  };

  const setDragPositionFromScreenY = (screenY) => {
    if (!screenY) return;
    const nextTranslateY = screenY - dragTouchOffsetY.current - dragStartCenterY.current;
    dragTranslateY.setValue(nextTranslateY);
  };

  const beginHoldingPlace = (placeId) => {
    suppressPlacePressRef.current = true;
    measureItineraryLayouts();
    const layout = itemLayouts.current[placeId];
    const initialSectionIndex = layout?.sectionIndex ?? 0;
    dragReadyPlaceId.current = placeId;
    dragStartCenterY.current = layout ? layout.y + layout.height / 2 : 0;
    dragTouchOffsetY.current = 0;
    dropTargetSectionRef.current = initialSectionIndex;
    dragTranslateY.setValue(0);
    setDraggedPlaceId(placeId);
    setDropTargetSectionIndex(initialSectionIndex);
    setIsDraggingItinerary(true);
  };

  const updateDropTargetSection = (sectionIndex) => {
    if (dropTargetSectionRef.current === sectionIndex) return;
    dropTargetSectionRef.current = sectionIndex;
    setDropTargetSectionIndex(sectionIndex);
  };

  const resetDraggingState = () => {
    dragReadyPlaceId.current = null;
    isPanDragging.current = false;
    dropTargetSectionRef.current = null;
    dragTouchOffsetY.current = 0;
    dragTranslateY.setValue(0);
    setDraggedPlaceId(null);
    setDropTargetSectionIndex(null);
    setIsDraggingItinerary(false);
    setTimeout(() => {
      suppressPlacePressRef.current = false;
    }, 0);
  };

  const createPlacePanHandlers = (placeId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) => dragReadyPlaceId.current === placeId && Math.abs(gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_event, gesture) => dragReadyPlaceId.current === placeId && Math.abs(gesture.dy) > 2,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        isPanDragging.current = true;
        measureItineraryLayouts();
        if (dragReadyPlaceId.current !== placeId) {
          beginHoldingPlace(placeId);
        }
        dragTouchOffsetY.current = (event.nativeEvent.pageY || dragStartCenterY.current) - dragStartCenterY.current;
        dragTranslateY.stopAnimation();
        dragTranslateY.setValue(0);
      },
      onPanResponderMove: (_event, gesture) => {
        const targetY = gesture.moveY || dragStartCenterY.current + gesture.dy;
        setDragPositionFromScreenY(targetY);
        updateDropTargetSection(getTargetSectionIndex(targetY));
      },
      onPanResponderRelease: (_event, gesture) => {
        const targetY = gesture.moveY || dragStartCenterY.current + gesture.dy;
        const sectionIndex = getTargetSectionIndex(targetY);
        const insertIndex = getTargetInsertIndex(sectionIndex, targetY, placeId);
        movePlaceToPosition(placeId, sectionIndex, insertIndex);
        resetDraggingState();
      },
      onPanResponderTerminate: resetDraggingState
    }).panHandlers;

  const extractPlacesFromUrl = async (url) => {
    if (!url) return [];
    const selectedDateIso = itinerarySections[safeSelectedItineraryDayIndex]?.date?.toISOString?.() ?? startDate.toISOString();
    const selectedDaySeed = { dayIndex: safeSelectedItineraryDayIndex, day: safeSelectedItineraryDayIndex + 1, date: selectedDateIso };
    if (url.includes('tiktok.com')) {
      return [
        { id: `p-${Date.now()}-1`, name: `${board.title} - Highlight 1`, note: 'From TikTok', sourceUrl: url, ...selectedDaySeed },
        { id: `p-${Date.now()}-2`, name: `${board.title} - Highlight 2`, note: 'From TikTok', sourceUrl: url, ...selectedDaySeed }
      ];
    }
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const token = parts.slice(-1)[0] || url;
      return [{ id: `p-${Date.now()}`, name: decodeURIComponent(token), note: 'From link', sourceUrl: url, ...selectedDaySeed }];
    } catch (e) {
      return [{ id: `p-${Date.now()}`, name: url, note: 'From link', sourceUrl: url, ...selectedDaySeed }];
    }
  };

  const handleAddLink = async () => {
    const places = await extractPlacesFromUrl(linkInput.trim());
    if (places.length) {
      const next = buildSortedItinerary([...itinerary, ...places]);
      setItinerary(next);
      persistItinerary(next);
    }
    setLinkInput('');
  };

  const handleAddActivityToSelectedDay = () => {
    if (!selectedItinerarySection) return;
    setAddActivityModal({ name: '', note: '', time: '', address: '' });
    setShowAddActivityTimePicker(false);
    setAddressSuggestions([]);
    setIsAddressFocused(false);
  };

  const handleConfirmAddActivity = () => {
    if (!selectedItinerarySection || !addActivityModal) return;
    const lastPlace = selectedItinerarySection.places[selectedItinerarySection.places.length - 1];
    const lastMinutes = parseItineraryTimeValue(lastPlace?.displayTime);
    const nextActivityTime = lastMinutes !== null
      ? formatMinutesAsTime(lastMinutes + 60)
      : getFallbackItineraryTime(selectedItinerarySection.places.length);
    const draftTime = addActivityModal.time?.trim();
    const parsedDraftTime = parseItineraryTimeValue(draftTime);
    const resolvedTime = parsedDraftTime !== null ? formatMinutesAsTime(parsedDraftTime) : nextActivityTime;
    const nextActivity = {
      id: `p-${Date.now()}`,
      name: addActivityModal.name.trim() || 'New activity',
      note: addActivityModal.note.trim(),
      address: addActivityModal.address?.trim() ?? '',
      time: resolvedTime,
      dayIndex: safeSelectedItineraryDayIndex,
      day: safeSelectedItineraryDayIndex + 1,
      date: selectedItinerarySection.date.toISOString()
    };
    const nextItinerary = [...itinerary, nextActivity];
    setItinerary(nextItinerary);
    persistItinerary(nextItinerary);
    setShowAddActivityTimePicker(false);
    setAddressSuggestions([]);
    setIsAddressFocused(false);
    setAddActivityModal(null);
  };

  const updatePlaceTime = (placeId, totalMinutes) => {
    const nextItinerary = buildSortedItinerary(
      itinerary.map((place) => (
        place.id === placeId ? { ...place, time: formatMinutesAsTime(totalMinutes) } : place
      ))
    );
    setItinerary(nextItinerary);
    persistItinerary(nextItinerary);
  };

  const sanitizeTimeDraft = (value) => {
    const digits = value.replace(/[^\d]/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const startEditingTime = (place) => {
    setEditingTimePlaceId(place.id);
    setTimeDrafts((current) => ({
      ...current,
      [place.id]: formatItineraryTimeValue(place.displayTime)
    }));
  };

  const updateTimeDraft = (placeId, value) => {
    setTimeDrafts((current) => ({
      ...current,
      [placeId]: sanitizeTimeDraft(value)
    }));
  };

  const finishEditingTime = (place) => {
    const draftValue = timeDrafts[place.id] ?? formatItineraryTimeValue(place.displayTime);
    const parsedMinutes = parseItineraryTimeValue(draftValue);
    const fallbackMinutes = parseItineraryTimeValue(place.displayTime) ?? 9 * 60;
    updatePlaceTime(place.id, parsedMinutes ?? fallbackMinutes);
    setTimeDrafts((current) => {
      const next = { ...current };
      delete next[place.id];
      return next;
    });
    setEditingTimePlaceId((current) => (current === place.id ? null : current));
  };

  const updateActivityDraft = (placeId, field, value) => {
    setActivityDrafts((current) => ({
      ...current,
      [placeId]: {
        name: current[placeId]?.name ?? '',
        note: current[placeId]?.note ?? '',
        [field]: value
      }
    }));
  };

  const startEditingActivity = (place) => {
    setEditingActivityPlaceId(place.id);
    setActivityDrafts((current) => ({
      ...current,
      [place.id]: {
        name: place.name ?? '',
        note: place.note ?? ''
      }
    }));
  };

  const saveActivityDetails = (place) => {
    const draft = activityDrafts[place.id];
    if (!draft) {
      setEditingActivityPlaceId(null);
      return;
    }

    const nextName = draft.name.trim() || 'New activity';
    const nextNote = draft.note.trim();
    const nextItinerary = itinerary.map((entry) => (
      entry.id === place.id ? { ...entry, name: nextName, note: nextNote } : entry
    ));
    setItinerary(nextItinerary);
    persistItinerary(nextItinerary);
    setEditingActivityPlaceId(null);
    setActivityDrafts((current) => {
      const next = { ...current };
      delete next[place.id];
      return next;
    });
  };

  return (
    <View style={styles.detailScreen}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.detailScrollContent,
          isAccommodationFocused && keyboardHeight > 0 && { paddingBottom: keyboardHeight + 240 }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingItinerary}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerMenuButton} onPress={onOpenEditTrip} activeOpacity={0.85}>
              <Text style={styles.headerMenuButtonText}>...</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailTitleGroup}>
            <View style={styles.detailTitleRow}>
              <Text style={styles.detailTitle} numberOfLines={2}>
                {board.title}
              </Text>
            </View>
            {board.location ? (
              <Text style={styles.detailLocation} numberOfLines={1}>
                {board.location}
              </Text>
            ) : null}
          </View>

          {board.image ? <Image source={{ uri: board.image }} style={styles.detailImage} /> : null}

          {board.description ? (
            <Text style={styles.detailDescription}>{board.description}</Text>
          ) : null}

          <View style={styles.datesTopRow}>
            <View style={styles.dateField}>
              <Text style={styles.statLabel}>Start</Text>
              <View style={styles.dateBox}>
                <BlurView intensity={28} tint="extraLight" style={styles.glassDateFieldBlur}>
                  <Text style={styles.datesValue}>{formatTripHeaderDate(startDate)}</Text>
                </BlurView>
              </View>
            </View>
            <View style={[styles.dateField, styles.dateFieldLast]}>
              <Text style={styles.statLabel}>End</Text>
              <View style={[styles.dateBox, styles.dateBoxLast]}>
                <BlurView intensity={28} tint="extraLight" style={styles.glassDateFieldBlur}>
                  <Text style={styles.datesValue}>{formatTripHeaderDate(endDate)}</Text>
                </BlurView>
              </View>
            </View>
          </View>

          <View
            style={styles.accommodationSection}
            onLayout={(event) => setAccommodationY(event.nativeEvent.layout.y)}
          >
            <Text style={styles.accommodationLabel}>Staying at</Text>
            <View style={[styles.accommodationInputWrap, isAccommodationFocused && styles.accommodationInputFocused]}>
              <BlurView intensity={28} tint="extraLight" style={styles.glassInputFieldBlur}>
                <TextInput
                  ref={accommodationInputRef}
                  value={accommodation}
                  onChangeText={setAccommodation}
                  onFocus={() => {
                    clearTimeout(accommodationBlurTimer.current);
                    setIsAccommodationFocused(true);
                  }}
                  onBlur={() => {
                    clearTimeout(accommodationBlurTimer.current);
                    accommodationBlurTimer.current = setTimeout(() => {
                      setIsAccommodationFocused(false);
                      persistBoard({
                        accommodation,
                        accommodationCoords: null,
                        accommodationPlaceId: null
                      });
                    }, 180);
                  }}
                  onSubmitEditing={() => {
                    clearTimeout(accommodationBlurTimer.current);
                    setIsAccommodationFocused(false);
                    persistBoard({
                      accommodation,
                      accommodationCoords: null,
                      accommodationPlaceId: null
                    });
                    Keyboard.dismiss();
                  }}
                  placeholder="Hotel, Airbnb, or address..."
                  placeholderTextColor="#AFAFA9"
                  style={styles.accommodationInput}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                {accommodation.trim().length > 0 ? (
                  <TouchableOpacity
                    style={styles.accommodationClearButton}
                    activeOpacity={0.75}
                    onPress={() => {
                      clearTimeout(accommodationBlurTimer.current);
                      setAccommodation('');
                      setAccommodationSuggestions([]);
                      setIsAccommodationFocused(true);
                      persistBoard({
                        accommodation: '',
                        accommodationCoords: null,
                        accommodationPlaceId: null
                      });
                      requestAnimationFrame(() => accommodationInputRef.current?.focus?.());
                    }}
                  >
                    <Text style={styles.accommodationClearButtonText}>x</Text>
                  </TouchableOpacity>
                ) : null}
              </BlurView>
            </View>
            {isAccommodationFocused && accommodation.trim().length >= 2 && (
              <View style={styles.accommodationDropdown}>
                {accommodationSuggestions.length > 0 ? (
                  <>
                    {accommodationSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.fullAddress + index}
                        style={[styles.accommodationOption, index < accommodationSuggestions.length - 1 && styles.accommodationOptionDivider]}
                        activeOpacity={0.8}
                        onPressIn={() => clearTimeout(accommodationBlurTimer.current)}
                        onPress={() => {
                          clearTimeout(accommodationBlurTimer.current);
                          setAccommodation(suggestion.fullAddress);
                          persistBoard({
                            accommodation: suggestion.fullAddress,
                            accommodationCoords: suggestion.lat != null && suggestion.lng != null
                              ? { lat: suggestion.lat, lng: suggestion.lng }
                              : null,
                            accommodationPlaceId: suggestion.placeId || null
                          });
                          setAccommodationSuggestions([]);
                          setIsAccommodationFocused(false);
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.accommodationOptionPrimary} numberOfLines={1}>{suggestion.primaryName}</Text>
                        <Text style={styles.accommodationOptionFull} numberOfLines={1}>{suggestion.fullAddress}</Text>
                      </TouchableOpacity>
                    ))}
                    {isSearchingAccommodation && (
                      <View style={styles.accommodationDropdownLoadingInline}>
                        <ActivityIndicator size="small" color="#A97C50" />
                      </View>
                    )}
                  </>
                ) : isSearchingAccommodation ? (
                  <View style={styles.accommodationDropdownLoading}>
                    <ActivityIndicator size="small" color="#A97C50" />
                  </View>
                ) : (
                  <View style={styles.accommodationDropdownLoading}>
                    <Text style={styles.accommodationNoResults}>No results found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={styles.detailBody}>
            <View style={styles.itinerarySectionCard}>
              <View style={styles.itineraryHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, styles.itineraryHeading]}>Itinerary</Text>
                  <Text style={styles.itinerarySubheading}>Tap a date to focus the day. Tap a time to edit it.</Text>
                </View>
                <TouchableOpacity
                  style={styles.itineraryAddButton}
                  activeOpacity={0.85}
                  onPress={handleAddActivityToSelectedDay}
                >
                  <BlurView intensity={28} tint="extraLight" style={styles.itineraryAddButtonBlur}>
                    <Text style={styles.itineraryAddButtonText}>+</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itineraryDateRow}
                style={styles.itineraryDateScroll}
              >
                {itinerarySections.map((section, index) => {
                  const isActive = index === safeSelectedItineraryDayIndex;
                  return (
                    <TouchableOpacity
                      key={section.key}
                      style={[styles.itineraryDateChip, isActive && styles.itineraryDateChipActive]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedItineraryDayIndex(index)}
                    >
                      <Text style={[styles.itineraryDateChipDayNumber, isActive && styles.itineraryDateChipTextActive]}>
                        {section.date.getDate()}
                      </Text>
                      <Text style={[styles.itineraryDateChipWeekday, isActive && styles.itineraryDateChipTextActive]}>
                        {formatItineraryChipWeekday(section.date)}
                      </Text>
                      <Text style={[styles.itineraryDateChipMonth, isActive && styles.itineraryDateChipTextActive]}>
                        {formatItineraryChipMonth(section.date)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.itineraryList}>
              {selectedItinerarySection ? (
                <View
                  key={selectedItinerarySection.key}
                  ref={(node) => {
                    if (node) sectionRefs.current[safeSelectedItineraryDayIndex] = node;
                  }}
                  style={[
                    styles.itineraryDaySection,
                    dropTargetSectionIndex === safeSelectedItineraryDayIndex && styles.itineraryDaySectionActive
                  ]}
                  onLayout={() => {
                    sectionRefs.current[safeSelectedItineraryDayIndex]?.measureInWindow?.((_x, y, _width, height) => {
                    sectionLayouts.current[safeSelectedItineraryDayIndex] = { y, height };
                    });
                  }}
                >
                  <View style={styles.itineraryDayContent}>
                    {selectedItinerarySection.places.length === 0 ? (
                      <View style={styles.itineraryEmptyState}>
                        <Text style={styles.itineraryEmptyTitle}>Nothing planned yet</Text>
                        <Text style={styles.itineraryEmpty}>Start building this day with the + button.</Text>
                      </View>
                    ) : (
                      <View style={styles.itineraryItemsList}>
                        {/* Vertical timeline thread */}
                        {selectedItinerarySection.places.length > 1 && (
                          <View style={styles.timelineTrack} pointerEvents="none" />
                        )}
                        {selectedItinerarySection.places.map((p, placeIndex) => {
                          const isDragged = draggedPlaceId === p.id;
                          const isEditingTime = editingTimePlaceId === p.id;
                          const isEditingActivity = editingActivityPlaceId === p.id;
                          const activityDraft = activityDrafts[p.id];
                          const timeValue = isEditingTime
                            ? (timeDrafts[p.id] ?? formatItineraryTimeValue(p.displayTime))
                            : formatItineraryTimeValue(p.displayTime);
                          const iconBg = ACTIVITY_ICON_COLORS[placeIndex % ACTIVITY_ICON_COLORS.length];
                          const iconName = getActivityIcon(p.name);
                          return (
                            <Animated.View
                              key={p.id}
                              ref={(node) => {
                                if (node) itemRefs.current[p.id] = node;
                              }}
                              style={[
                                styles.itineraryRow,
                                isDragged && styles.itineraryRowDragging,
                                isDragged && { transform: [{ translateY: dragTranslateY }] }
                              ]}
                              onLayout={() => {
                                itemRefs.current[p.id]?.measureInWindow?.((_x, y, _width, height) => {
                                  itemLayouts.current[p.id] = {
                                    id: p.id,
                                    sectionIndex: safeSelectedItineraryDayIndex,
                                    index: placeIndex,
                                    y,
                                    height
                                  };
                                });
                                itemLayouts.current[p.id] = {
                                  ...(itemLayouts.current[p.id] ?? {}),
                                  sectionIndex: safeSelectedItineraryDayIndex,
                                  index: placeIndex
                                };
                              }}
                              {...createPlacePanHandlers(p.id)}
                            >
                              <View style={styles.itineraryRowShell}>
                                {/* Timeline node dot */}
                                <View style={styles.timelineNodeCol}>
                                  <View style={[styles.timelineNodeDot, { borderColor: iconBg }]} />
                                </View>

                                {/* Card */}
                                <View style={styles.itineraryRowCard}>
                                  {isEditingActivity ? (
                                    <View style={styles.itineraryEditArea}>
                                      <TextInput
                                        style={styles.itineraryNameInput}
                                        value={activityDraft?.name ?? ''}
                                        onChangeText={(value) => updateActivityDraft(p.id, 'name', value)}
                                        placeholder="Activity name"
                                        placeholderTextColor="#A3A39D"
                                        autoFocus
                                        returnKeyType="done"
                                        onSubmitEditing={Keyboard.dismiss}
                                      />
                                      <TextInput
                                        style={styles.itineraryNoteInput}
                                        value={activityDraft?.note ?? ''}
                                        onChangeText={(value) => updateActivityDraft(p.id, 'note', value)}
                                        placeholder="Add details"
                                        placeholderTextColor="#A3A39D"
                                        multiline
                                        returnKeyType="done"
                                        blurOnSubmit
                                      />
                                      <TouchableOpacity
                                        style={styles.itinerarySaveActivityButton}
                                        activeOpacity={0.85}
                                        onPress={() => saveActivityDetails(p)}
                                      >
                                        <Text style={styles.itinerarySaveActivityButtonText}>Save</Text>
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View style={styles.cardContentRow}>
                                      {/* Pastel icon box */}
                                      <View style={[styles.itineraryIconBox, { backgroundColor: iconBg }]}>
                                        <Ionicons name={iconName} size={15} color="#2B2927" />
                                      </View>

                                      {/* Activity text — pressable */}
                                      <Pressable
                                        style={styles.itineraryTextFlex}
                                        delayLongPress={220}
                                        onLongPress={() => beginHoldingPlace(p.id)}
                                        onPress={() => {
                                          if (!suppressPlacePressRef.current) {
                                            setSelectedPlaceDetail({ place: p, dateLabel: selectedItinerarySection.title });
                                          }
                                        }}
                                        onPressOut={() => {
                                          if (dragReadyPlaceId.current === p.id && !isPanDragging.current) {
                                            resetDraggingState();
                                          }
                                        }}
                                      >
                                        <Text style={styles.itineraryName} numberOfLines={2}>{p.name}</Text>
                                        {p.note ? <Text style={styles.itineraryNote} numberOfLines={1}>{p.note}</Text> : null}
                                      </Pressable>

                                      {/* Time — right column with divider */}
                                      <View style={styles.itineraryTimeRight}>
                                        <View style={styles.itineraryTimeDivider} />
                                        <View style={styles.itineraryTimeColumn}>
                                          <TextInput
                                            style={[
                                              styles.itineraryTimeInput,
                                              isEditingTime && styles.itineraryTimeInputEditing
                                            ]}
                                            value={timeValue}
                                            onFocus={() => startEditingTime(p)}
                                            onChangeText={(value) => updateTimeDraft(p.id, value)}
                                            onBlur={() => finishEditingTime(p)}
                                            onSubmitEditing={() => finishEditingTime(p)}
                                            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                                            returnKeyType="done"
                                            maxLength={5}
                                            selectTextOnFocus
                                            placeholder="09:00"
                                            placeholderTextColor="#A3A39D"
                                          />
                                          <Ionicons name="time-outline" size={11} color="#8C867E" />
                                        </View>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </Animated.View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              ) : null}
              </View>
            </View>
          </View>

          <View style={styles.addLinkFooter}>
            <View style={styles.addLinkRow}>
              <TextInput
                placeholder="Paste a video link"
                value={linkInput}
                onChangeText={setLinkInput}
                style={styles.linkInput}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleAddLink}
              />
              <TouchableOpacity style={styles.detailActionButton} onPress={handleAddLink}>
                <BlurView intensity={28} tint="extraLight" style={styles.detailActionBlur}>
                  <Text style={styles.detailActionText}>Add</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.recommendationsButton} onPress={onOpenRecommendations}>
              <BlurView intensity={28} tint="extraLight" style={styles.recommendationsButtonBlur}>
                <Text style={styles.recommendationsButtonText}>Personal Recommendations</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PlaceDetailModal
        visible={Boolean(selectedPlaceDetail)}
        place={selectedPlaceDetail?.place}
        tripTitle={board.title}
        location={board.location || board.subtitle}
        dateLabel={selectedPlaceDetail?.dateLabel}
        fallbackImage={board.image}
        onClose={() => setSelectedPlaceDetail(null)}
        onDelete={() => {
          if (!selectedPlaceDetail?.place) return;
          const nextItinerary = itinerary.filter((p) => p.id !== selectedPlaceDetail.place.id);
          setItinerary(nextItinerary);
          persistItinerary(nextItinerary);
          setSelectedPlaceDetail(null);
        }}
      />

      <Modal
        visible={Boolean(addActivityModal)}
        transparent
        animationType="fade"
        onRequestClose={() => { setAddActivityModal(null); setShowAddActivityTimePicker(false); }}
      >
        <KeyboardAvoidingView behavior={undefined} style={styles.addActivityKAV}>
          <Pressable style={styles.addActivityOverlay} onPress={() => { Keyboard.dismiss(); setAddActivityModal(null); setShowAddActivityTimePicker(false); }}>
            <Pressable style={styles.addActivityCard} onPress={() => {}}>
              <ScrollView
                ref={addActivityScrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets
                style={styles.addActivityScroll}
                contentContainerStyle={styles.addActivityScrollContent}
              >
                <Text style={styles.addActivityTitle}>New activity</Text>
                {selectedItinerarySection ? (
                  <Text style={styles.addActivityDate}>{selectedItinerarySection.title}</Text>
                ) : null}
                <TextInput
                  style={styles.addActivityNameInput}
                  placeholder="Activity name"
                  placeholderTextColor="#AFAFA9"
                  value={addActivityModal?.name ?? ''}
                  onChangeText={(value) => setAddActivityModal((current) => ({ ...current, name: value }))}
                  autoFocus
                  returnKeyType="done"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={styles.addActivityFieldInput}
                  activeOpacity={0.8}
                  onPress={() => { Keyboard.dismiss(); setShowAddActivityTimePicker((v) => !v); }}
                >
                  <Text style={addActivityModal?.time ? styles.addActivityFieldValue : styles.addActivityFieldPlaceholder}>
                    {addActivityModal?.time || 'Time (optional)'}
                  </Text>
                </TouchableOpacity>
                {showAddActivityTimePicker && (
                  <View style={styles.addActivityTimePickerWrap}>
                    <DateTimePicker
                      value={(() => {
                        const d = new Date();
                        const minutes = parseItineraryTimeValue(addActivityModal?.time);
                        if (minutes !== null) {
                          d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                        }
                        return d;
                      })()}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minuteInterval={5}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') setShowAddActivityTimePicker(false);
                        if (selectedDate && event.type !== 'dismissed') {
                          const h = selectedDate.getHours();
                          const m = selectedDate.getMinutes();
                          setAddActivityModal((current) => ({
                            ...current,
                            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                          }));
                        }
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity style={styles.addActivityTimePickerDone} onPress={() => setShowAddActivityTimePicker(false)}>
                        <Text style={styles.addActivityTimePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={styles.addActivityAddressWrap}>
                  <TextInput
                    style={styles.addActivityFieldInput}
                    placeholder="Address (optional)"
                    placeholderTextColor="#AFAFA9"
                    value={addActivityModal?.address ?? ''}
                    onChangeText={(value) => setAddActivityModal((current) => ({ ...current, address: value }))}
                    onFocus={() => {
                      clearTimeout(addressBlurTimer.current);
                      setIsAddressFocused(true);
                      addActivityScrollRef.current?.scrollToEnd({ animated: true });
                    }}
                    onBlur={() => {
                      addressBlurTimer.current = setTimeout(() => setIsAddressFocused(false), 180);
                    }}
                    returnKeyType="done"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {isAddressFocused && (addActivityModal?.address?.trim().length ?? 0) >= 2 && (
                    <View style={styles.addActivityAddressDropdown}>
                      {addressSuggestions.length > 0 ? (
                        <>
                          {addressSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                              key={suggestion.fullAddress + index}
                              style={[styles.accommodationOption, index < addressSuggestions.length - 1 && styles.accommodationOptionDivider]}
                              activeOpacity={0.8}
                              onPressIn={() => clearTimeout(addressBlurTimer.current)}
                              onPress={() => {
                                clearTimeout(addressBlurTimer.current);
                                setAddActivityModal((current) => ({ ...current, address: suggestion.fullAddress }));
                                setAddressSuggestions([]);
                                setIsAddressFocused(false);
                                Keyboard.dismiss();
                              }}
                            >
                              <Text style={styles.accommodationOptionPrimary} numberOfLines={1}>{suggestion.primaryName}</Text>
                              <Text style={styles.accommodationOptionFull} numberOfLines={1}>{suggestion.fullAddress}</Text>
                            </TouchableOpacity>
                          ))}
                          {isSearchingAddress && (
                            <View style={styles.accommodationDropdownLoadingInline}>
                              <ActivityIndicator size="small" color="#A97C50" />
                            </View>
                          )}
                        </>
                      ) : isSearchingAddress ? (
                        <View style={styles.accommodationDropdownLoading}>
                          <ActivityIndicator size="small" color="#A97C50" />
                        </View>
                      ) : (
                        <View style={styles.accommodationDropdownLoading}>
                          <Text style={styles.accommodationNoResults}>No results found</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <TextInput
                  style={styles.addActivityNoteInput}
                  placeholder="Notes (optional)"
                  placeholderTextColor="#AFAFA9"
                  value={addActivityModal?.note ?? ''}
                  onChangeText={(value) => setAddActivityModal((current) => ({ ...current, note: value }))}
                  onFocus={() => addActivityScrollRef.current?.scrollToEnd({ animated: true })}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit
                />
              </ScrollView>
              <View style={styles.addActivityActions}>
                <TouchableOpacity style={styles.addActivityCancelBtn} activeOpacity={0.8} onPress={() => { setAddActivityModal(null); setShowAddActivityTimePicker(false); }}>
                  <Text style={styles.addActivityCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addActivityDoneBtn} activeOpacity={0.85} onPress={handleConfirmAddActivity}>
                  <Text style={styles.addActivityDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  detailScreen: {
    flex: 1,
    backgroundColor: '#F4F0EB'
  },
  detailScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20
  },
  editScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 28
  },
  detailCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#2B2927',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22
  },
  editHeaderTitle: {
    color: '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  editSaveButton: {
    minWidth: 54,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  editSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 0,
    minWidth: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 28
  },
  backButtonText: {
    color: '#4A4A4A',
    fontSize: 26,
    lineHeight: 26,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  headerMenuButton: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    paddingRight: 8,
    height: 28
  },
  headerMenuButtonText: {
    color: '#4A4A4A',
    fontSize: 26,
    lineHeight: 26,
    marginTop: -4,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  detailTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#111111'
  },
  detailLocation: {
    color: '#575757',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginTop: -2,
    flex: 1
  },
  detailTitleGroup: {
    marginBottom: 16
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  detailImage: {
    width: '100%',
    height: 176,
    borderRadius: 18,
    marginBottom: 16
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6F6F6B',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 14,
    textAlign: 'center'
  },
  datesTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 2,
    marginBottom: 14
  },
  dateField: {
    flex: 1,
    marginRight: 8
  },
  dateFieldLast: {
    marginRight: 0
  },
  dateBox: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden'
  },
  dateBoxLast: {
    marginRight: 0
  },
  dateBoxActive: {
    borderColor: '#B8B8B2',
    backgroundColor: '#FFFFFF'
  },
  inlineCalendarWrap: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEDEDA',
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
    color: '#111111',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    marginBottom: 8,
    marginLeft: 4
  },
  datesValue: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    color: '#111111'
  },
  accommodationSection: {
    marginTop: 4,
    marginBottom: 18
  },
  accommodationLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    color: '#111111',
    marginBottom: 8,
    marginLeft: 4
  },
  accommodationInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 6,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
    color: '#111111',
    textAlign: 'left',
    writingDirection: 'ltr'
  },
  accommodationInputWrap: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden'
  },
  accommodationInputFocused: {
    borderColor: '#8F8F8B'
  },
  glassDateFieldBlur: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(244,240,235,0.9)',
  },
  glassInputFieldBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(244,240,235,0.9)',
  },
  accommodationClearButton: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  accommodationClearButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: '#6F6F6B',
    fontFamily: 'Nunito_400Regular',
    fontWeight: '500'
  },
  accommodationDropdown: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEDEDA',
    overflow: 'hidden'
  },
  accommodationDropdownLoading: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  accommodationDropdownLoadingInline: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECECE8'
  },
  accommodationNoResults: {
    fontSize: 13,
    color: '#6F6F6B',
    fontFamily: 'Nunito_400Regular',
    fontWeight: '500'
  },
  accommodationOption: {
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  accommodationOptionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECECE8'
  },
  accommodationOptionPrimary: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: '#111111'
  },
  accommodationOptionFull: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6F6F6B',
    fontFamily: 'Nunito_400Regular',
    marginTop: 2
  },
  detailBody: {
    minHeight: 0
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#111111',
    marginTop: 4
  },
  itinerarySectionCard: {
    marginTop: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4DED6',
    backgroundColor: '#F8F5F0',
    padding: 16,
  },
  itineraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14
  },
  itineraryHeading: {
    marginTop: 0,
    marginBottom: 4
  },
  itinerarySubheading: {
    color: '#7A7A74',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Nunito_400Regular'
  },
  itineraryAddButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(216,216,210,0.95)',
    backgroundColor: 'transparent'
  },
  itineraryAddButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243,243,241,0.86)'
  },
  itineraryAddButtonText: {
    color: '#4A4A4A',
    fontSize: 24,
    lineHeight: 24,
    marginTop: -1,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '500'
  },
  itineraryDateScroll: {
    marginBottom: 18
  },
  itineraryDateRow: {
    paddingRight: 4,
    gap: 8
  },
  itineraryDateChip: {
    width: 50,
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: '#EEE9E2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E4DED6',
  },
  itineraryDateChipActive: {
    backgroundColor: '#2B2927',
    borderColor: '#2B2927',
  },
  itineraryDateChipDayNumber: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  itineraryDateChipWeekday: {
    marginTop: 2,
    color: '#4F4F4A',
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  itineraryDateChipMonth: {
    marginTop: 1,
    color: '#8A8A84',
    fontSize: 9,
    lineHeight: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '600'
  },
  itineraryDateChipTextActive: {
    color: '#FFFFFF'
  },
  itineraryList: {
    overflow: 'visible'
  },
  itineraryEmptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECECE7',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 16,
    paddingVertical: 18
  },
  itineraryEmptyTitle: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  itineraryEmpty: {
    color: '#6F6F6B',
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  itineraryDaySection: {
    alignItems: 'stretch',
    overflow: 'visible'
  },
  itineraryDaySectionActive: {
    backgroundColor: 'transparent'
  },
  itineraryDayContent: {
    flex: 1,
    paddingTop: 0,
    paddingRight: 0,
    paddingLeft: 0,
    paddingBottom: 0,
    overflow: 'visible'
  },
  itineraryItemsList: {
    gap: 10,
    position: 'relative',
  },
  timelineTrack: {
    position: 'absolute',
    left: 13,
    top: 18,
    bottom: 18,
    width: 1.5,
    backgroundColor: '#E4DED6',
  },
  timelineNodeCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 15,
    flexShrink: 0,
  },
  timelineNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFDF8',
    borderWidth: 2,
  },
  itineraryRow: {
    overflow: 'visible',
  },
  itineraryRowShell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  itineraryRowCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DED6',
    backgroundColor: '#FFFDF8',
    overflow: 'hidden',
  },
  itineraryEditArea: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 65,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
  },
  itineraryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    margin: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itineraryTextFlex: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 4,
    justifyContent: 'center',
    minHeight: 56,
  },
  itineraryTimeRight: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexShrink: 0,
  },
  itineraryTimeDivider: {
    width: 1,
    backgroundColor: '#E4DED6',
    marginVertical: 10,
  },
  itineraryTimeColumn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    gap: 3,
  },
  itineraryTextWrap: {
    flex: 1,
    minWidth: 0
  },
  itineraryRowDragging: {
    backgroundColor: '#EFEFEC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CFCFC9',
    opacity: 0.96,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
  },
  itineraryName: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    color: '#111111'
  },
  itineraryNameInput: {
    fontSize: 16,
    lineHeight: 21,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 6,
    color: '#111111',
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  itineraryTimeInput: {
    color: '#8C867E',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    minHeight: 18,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
  },
  itineraryTimeInputEditing: {
    color: '#2B2927',
  },
  itineraryNote: {
    color: '#6F6F6B',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
    fontFamily: 'Nunito_400Regular'
  },
  itineraryNoteInput: {
    color: '#6F6F6B',
    fontSize: 14,
    lineHeight: 18,
    minHeight: 38,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    fontFamily: 'Nunito_400Regular'
  },
  itinerarySaveActivityButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itinerarySaveActivityButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  editFieldGroup: {
    marginBottom: 16
  },
  editLabel: {
    color: '#111111',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  editInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#111111',
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular'
  },
  editTextArea: {
    minHeight: 112
  },
  editDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  editDateField: {
    flex: 1
  },
  editDateButton: {
    justifyContent: 'center'
  },
  editDateValue: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Nunito_400Regular'
  },
  editCalendarWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5DF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16
  },
  editPrivacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 2
  },
  editPrivacyTitle: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  editPrivacySubtitle: {
    color: '#6F6F6B',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    fontFamily: 'Nunito_400Regular'
  },
  editPrivacyPill: {
    minWidth: 72,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ECECE7'
  },
  editPrivacyPillActive: {
    backgroundColor: '#111111'
  },
  editPrivacyPillText: {
    color: '#64645F',
    fontSize: 12,
    lineHeight: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  editPrivacyPillTextActive: {
    color: '#FFFFFF'
  },
  editActionsSection: {
    marginTop: 22,
    gap: 10
  },
  editSecondaryAction: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5DF',
    backgroundColor: '#F7F7F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editSecondaryActionText: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  editDangerAction: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D2D2',
    backgroundColor: '#FFF9F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editDangerActionText: {
    color: '#B24C4C',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  addLinkFooter: {
    paddingTop: 14,
    paddingBottom: 0,
    marginHorizontal: -16,
    paddingHorizontal: 16
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
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DEDEDA',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular'
  },
  detailActionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    width: 104,
    overflow: 'hidden'
  },
  detailActionBlur: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  detailActionText: {
    color: '#111111',
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700'
  },
  recommendationsButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    overflow: 'hidden'
  },
  recommendationsButtonBlur: {
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  recommendationsButtonText: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700'
  },
  addActivityKAV: {
    flex: 1
  },
  addActivityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  addActivityAddressWrap: {
    marginBottom: 0
  },
  addActivityAddressDropdown: {
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEDEDA',
    overflow: 'hidden'
  },
  addActivityCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    maxHeight: '90%',
    overflow: 'hidden',
    paddingBottom: 20
  },
  addActivityScroll: {
    flexShrink: 1
  },
  addActivityScrollContent: {
    padding: 20,
    paddingBottom: 4
  },
  addActivityTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#111111',
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4
  },
  addActivityDate: {
    fontSize: 13,
    lineHeight: 16,
    color: '#7A7A74',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 16
  },
  addActivityNameInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 20,
    color: '#111111',
    textAlign: 'left',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 10
  },
  addActivityFieldInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
    marginBottom: 10
  },
  addActivityFieldValue: {
    fontSize: 15,
    lineHeight: 19,
    color: '#111111',
    textAlign: 'left',
    fontFamily: 'Nunito_400Regular'
  },
  addActivityFieldPlaceholder: {
    fontSize: 15,
    lineHeight: 19,
    color: '#AFAFA9',
    textAlign: 'left',
    fontFamily: 'Nunito_400Regular'
  },
  addActivityTimePickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    overflow: 'hidden',
    marginBottom: 10
  },
  addActivityTimePickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 10
  },
  addActivityTimePickerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Nunito_700Bold'
  },
  addActivityNoteInput: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#F7F7F4',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    lineHeight: 19,
    color: '#111111',
    textAlign: 'left',
    textAlignVertical: 'top',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 18
  },
  addActivityActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  addActivityCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5DF',
    backgroundColor: '#F7F7F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addActivityCancelText: {
    color: '#4A4A4A',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Nunito_700Bold'
  },
  addActivityDoneBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addActivityDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  }
});

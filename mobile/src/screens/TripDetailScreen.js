import { ActivityIndicator, Animated, Image, Keyboard, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { autocompleteAccommodation } from '../../data/liveRecommendations';

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
  const [activeDateField, setActiveDateField] = useState(null);
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
  const isPublic = Boolean(board.isPublic);
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
    if (url.includes('tiktok.com')) {
      return [
        { id: `p-${Date.now()}-1`, name: `${board.title} - Highlight 1`, note: 'From TikTok', sourceUrl: url, dayIndex: 0 },
        { id: `p-${Date.now()}-2`, name: `${board.title} - Highlight 2`, note: 'From TikTok', sourceUrl: url, dayIndex: 0 }
      ];
    }
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const token = parts.slice(-1)[0] || url;
      return [{ id: `p-${Date.now()}`, name: decodeURIComponent(token), note: 'From link', sourceUrl: url, dayIndex: 0 }];
    } catch (e) {
      return [{ id: `p-${Date.now()}`, name: url, note: 'From link', sourceUrl: url, dayIndex: 0 }];
    }
  };

  const handleAddLink = async () => {
    const places = await extractPlacesFromUrl(linkInput.trim());
    if (places.length) {
      const next = [...itinerary, ...places];
      setItinerary(next);
      onUpdateBoard?.({
        placesList: next,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    }
    setLinkInput('');
  };

  const toggleDateField = (field) => {
    setActiveDateField((current) => (current === field ? null : field));
  };

  const handleStartDateChange = (_event, selectedDate) => {
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
    setActiveDateField('end');
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
    setActiveDateField(null);
  };

  const updatePrivacy = (nextIsPublic) => {
    onUpdateBoard?.({ isPublic: nextIsPublic });
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
            <TouchableOpacity style={styles.headerMenuButton} onPress={() => {}}>
              <Text style={styles.headerMenuButtonText}>...</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailTitleGroup}>
            <View style={styles.detailTitleRow}>
              <Text style={styles.detailTitle} numberOfLines={2}>
                {board.title}
              </Text>
              <TouchableOpacity
                style={styles.privacySwitch}
                activeOpacity={0.8}
                onPress={() => updatePrivacy(!isPublic)}
              >
                <BlurView intensity={28} tint="extraLight" style={styles.privacySwitchBlur}>
                  <View style={[styles.privacySwitchThumb, isPublic ? styles.privacySwitchThumbPublic : styles.privacySwitchThumbPrivate]} />
                  <Text style={[styles.privacySwitchOption, isPublic && styles.privacySwitchOptionActive]}>Public</Text>
                  <Text style={[styles.privacySwitchOption, !isPublic && styles.privacySwitchOptionActive]}>Private</Text>
                </BlurView>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.dateBox, activeDateField === 'start' && styles.dateBoxActive]}
                onPress={() => toggleDateField('start')}
                activeOpacity={0.75}
              >
                <BlurView intensity={28} tint="extraLight" style={styles.glassDateFieldBlur}>
                  <Text style={styles.datesValue}>{formatTripHeaderDate(startDate)}</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
            <View style={[styles.dateField, styles.dateFieldLast]}>
              <Text style={styles.statLabel}>End</Text>
              <TouchableOpacity
                style={[styles.dateBox, styles.dateBoxLast, activeDateField === 'end' && styles.dateBoxActive]}
                onPress={() => toggleDateField('end')}
                activeOpacity={0.75}
              >
                <BlurView intensity={28} tint="extraLight" style={styles.glassDateFieldBlur}>
                  <Text style={styles.datesValue}>{formatTripHeaderDate(endDate)}</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
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
            <Text style={[styles.sectionTitle, styles.itineraryHeading]}>Itinerary</Text>
            <View style={styles.itineraryList}>
            {itinerarySections.map((section, index) => (
              <View
                key={section.key}
                ref={(node) => {
                  if (node) sectionRefs.current[index] = node;
                }}
                style={[styles.itineraryDaySection, dropTargetSectionIndex === index && styles.itineraryDaySectionActive]}
                onLayout={() => {
                  sectionRefs.current[index]?.measureInWindow?.((_x, y, _width, height) => {
                  sectionLayouts.current[index] = { y, height };
                  });
                }}
              >
                <View style={styles.itineraryDayRail}>
                  <View style={styles.itineraryDayDot} />
                  {index < itinerarySections.length - 1 && <View style={styles.itineraryDayLine} />}
                </View>
                <View style={styles.itineraryDayContent}>
                  <Text style={styles.itineraryDayTitle}>{section.title}</Text>
                  {section.places.length === 0 && <Text style={styles.itineraryEmpty}>No plans yet.</Text>}
                  {section.places.length > 0 ? (
                    <View style={styles.itineraryItemsGroup}>
                      <BlurView intensity={28} tint="extraLight" style={styles.itineraryItemsGroupGlass} />
                      {section.places.map((p, placeIndex) => {
                        const isDragged = draggedPlaceId === p.id;
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
                                  sectionIndex: index,
                                  index: placeIndex,
                                  y,
                                  height
                                };
                              });
                              itemLayouts.current[p.id] = {
                                ...(itemLayouts.current[p.id] ?? {}),
                                sectionIndex: index,
                                index: placeIndex
                              };
                            }}
                            {...createPlacePanHandlers(p.id)}
                          >
                            <Pressable
                              delayLongPress={220}
                              onLongPress={() => beginHoldingPlace(p.id)}
                              onPress={() => {
                                if (!suppressPlacePressRef.current) {
                                  setSelectedPlaceDetail({ place: p, dateLabel: section.title });
                                }
                              }}
                              onPressOut={() => {
                                if (dragReadyPlaceId.current === p.id && !isPanDragging.current) {
                                  resetDraggingState();
                                }
                              }}
                            >
                              <Text style={styles.itineraryName}>{p.name}</Text>
                              {p.note && <Text style={styles.itineraryNote}>{p.note}</Text>}
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailScreen: {
    flex: 1,
    backgroundColor: '#F3F3F1'
  },
  detailScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden'
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  detailTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800',
    color: '#111111'
  },
  detailLocation: {
    color: '#575757',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
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
  privacySwitch: {
    width: 148,
    height: 40,
    flexShrink: 0,
    marginLeft: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    overflow: 'hidden'
  },
  privacySwitchBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  privacySwitchThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 70,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)'
  },
  privacySwitchThumbPublic: {
    left: 3
  },
  privacySwitchThumbPrivate: {
    right: 3
  },
  privacySwitchOption: {
    flex: 1,
    zIndex: 1,
    color: '#72726E',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '700'
  },
  privacySwitchOptionActive: {
    color: '#111111',
    fontWeight: '700'
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    marginBottom: 8,
    marginLeft: 4
  },
  datesValue: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: '400',
    color: '#111111'
  },
  accommodationSection: {
    marginTop: 4,
    marginBottom: 18
  },
  accommodationLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
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
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  glassInputFieldBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(243,243,241,0.88)'
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: '#111111'
  },
  accommodationOptionFull: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6F6F6B',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    marginTop: 2
  },
  detailBody: {
    minHeight: 0
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800',
    color: '#111111',
    marginTop: 4
  },
  itineraryHeading: {
    marginTop: 8,
    marginBottom: 12
  },
  itineraryList: {
    overflow: 'visible'
  },
  itineraryEmpty: {
    color: '#6F6F6B',
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  itineraryDaySection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    overflow: 'visible'
  },
  itineraryDaySectionActive: {
    backgroundColor: 'transparent'
  },
  itineraryDayRail: {
    width: 24,
    alignItems: 'center'
  },
  itineraryDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B8B8B2',
    marginTop: 5
  },
  itineraryDayLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E1E1DC',
    marginTop: 4
  },
  itineraryDayContent: {
    flex: 1,
    paddingTop: 0,
    paddingRight: 14,
    paddingLeft: 2,
    paddingBottom: 14,
    overflow: 'visible'
  },
  itineraryDayTitle: {
    marginTop: 0,
    marginBottom: 14,
    color: '#111111',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800'
  },
  itineraryRow: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  itineraryRowDragging: {
    backgroundColor: '#EFEFEC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFCFC9',
    borderBottomColor: '#CFCFC9',
    paddingHorizontal: 10,
    opacity: 0.96,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
  },
  itineraryItemsGroup: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent'
  },
  itineraryItemsGroupGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  itineraryName: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    color: '#111111'
  },
  itineraryNote: {
    color: '#6F6F6B',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  addLinkFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E1E1DC',
    paddingTop: 14,
    paddingBottom: 0,
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
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DEDEDA',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
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
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '700'
  }
});

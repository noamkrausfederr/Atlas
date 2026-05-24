import { Animated, Image, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlaceDetailScreen } from '../components/PlaceDetailModal';

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

  if (selectedPlaceDetail) {
    return (
      <PlaceDetailScreen
        place={selectedPlaceDetail.place}
        tripTitle={board.title}
        location={board.location || board.subtitle}
        dateLabel={selectedPlaceDetail.dateLabel}
        fallbackImage={board.image}
        onBack={() => setSelectedPlaceDetail(null)}
      />
    );
  }

  return (
    <View style={styles.detailScreen}>
      <ScrollView
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingItinerary}
      >
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleGroup}>
            <Text style={styles.detailTitle} numberOfLines={2}>
              {board.title}
            </Text>
            {board.location ? (
              <Text style={styles.detailLocation} numberOfLines={1}>
                {board.location}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.privacySwitch}
              activeOpacity={0.8}
              onPress={() => updatePrivacy(!isPublic)}
            >
              <View style={[styles.privacySwitchThumb, isPublic ? styles.privacySwitchThumbPublic : styles.privacySwitchThumbPrivate]} />
              <Text style={[styles.privacySwitchOption, isPublic && styles.privacySwitchOptionActive]}>Public</Text>
              <Text style={[styles.privacySwitchOption, !isPublic && styles.privacySwitchOptionActive]}>Private</Text>
            </TouchableOpacity>
          </View>
        </View>

        {board.image ? <Image source={{ uri: board.image }} style={styles.detailImage} /> : null}

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
            </View>
          ))}
          </View>
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
      </ScrollView>
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
    overflow: 'hidden'
  },
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20
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
    fontSize: 20,
    fontWeight: '800',
    color: '#2A0A2B',
    textAlign: 'right'
  },
  detailLocation: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'right'
  },
  detailTitleGroup: {
    flex: 1,
    marginLeft: 8,
    alignItems: 'flex-end',
    marginRight: -4
  },
  privacySwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 136,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 3,
    marginTop: 10,
    overflow: 'hidden'
  },
  privacySwitchThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: 64,
    borderRadius: 999,
    backgroundColor: '#F6E4F8'
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
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '800'
  },
  privacySwitchOptionActive: {
    color: '#7D3DBA',
    fontWeight: '800'
  },
  detailImage: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    marginBottom: 14
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
    overflow: 'visible'
  },
  itineraryEmpty: {
    color: '#94A3B8',
    marginBottom: 10,
    fontSize: 13
  },
  itineraryDaySection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    overflow: 'visible'
  },
  itineraryDaySectionActive: {
    backgroundColor: '#FDF4FF'
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
    paddingBottom: 18,
    overflow: 'visible'
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
  itineraryRowDragging: {
    backgroundColor: '#F6E4F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DD77F2',
    borderBottomColor: '#DD77F2',
    paddingHorizontal: 10,
    opacity: 0.96,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#C26CF8',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
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

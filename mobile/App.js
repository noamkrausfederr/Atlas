import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { sampleBoards } from './data/trips';
import { getPastTrips, getUpcomingTrips } from './data/tripUtils';
import { getRecommendationById } from './data/recommendations';

// Components & Screens
import { BoardCard } from './src/components/BoardCard';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { ExploreScreen, ExploreMoreScreen } from './src/screens/ExploreScreen';
import { RecommendationDetailScreen } from './src/screens/RecommendationDetailScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

function InnerApp() {
  const [boards, setBoards] = useState(sampleBoards);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [tripStack, setTripStack] = useState(null);
  const [activeTab, setActiveTab] = useState('Trips');
  const [exploreStack, setExploreStack] = useState(null);
  const [addedRecIds, setAddedRecIds] = useState({});
  const [tripRecommendationRefreshes, setTripRecommendationRefreshes] = useState({});
  const [isCreateBoardVisible, setIsCreateBoardVisible] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [isCitySearchLoading, setIsCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [activeDraftDateField, setActiveDraftDateField] = useState(null);
  const [draftBoard, setDraftBoard] = useState({
    title: '',
    location: '',
    startDate: '',
    endDate: ''
  });

  const parseDateInput = (value) => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const candidate = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  };

  const formatDateForInput = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const getDraftDateValue = (field) => {
    const parsed = parseDateInput(draftBoard[field]);
    if (parsed) return parsed;
    const fallback = field === 'endDate' ? parseDateInput(draftBoard.startDate) : null;
    return fallback || new Date();
  };

  const handleDraftDateChange = (field, _event, selectedDate) => {
    if (Platform.OS === 'android') {
      setActiveDraftDateField(null);
    }
    if (!selectedDate) {
      return;
    }

    const nextDate = new Date(selectedDate);
    nextDate.setHours(0, 0, 0, 0);

    setDraftBoard((current) => {
      if (field === 'startDate') {
        const currentEnd = parseDateInput(current.endDate);
        const next = { ...current, startDate: formatDateForInput(nextDate) };
        if (!currentEnd || currentEnd < nextDate) {
          next.endDate = formatDateForInput(nextDate);
        }
        return next;
      }

      const start = parseDateInput(current.startDate);
      const safeEnd = start && nextDate < start ? start : nextDate;
      return { ...current, endDate: formatDateForInput(safeEnd) };
    });
  };

  const getBoardImageUrl = (location) => {
    const cityImages = {
      amsterdam: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80',
      barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
      berlin: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
      kyoto: 'https://images.unsplash.com/photo-1445820136801-051b6a111f34?auto=format&fit=crop&w=800&q=80',
      london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      madrid: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
      'new york': 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=800&q=80',
      paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      'san francisco': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
      venice: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80'
    };
    const normalizedLocation = location
      .replace(/[^a-z0-9\s-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const cityKey = Object.keys(cityImages).find((city) => normalizedLocation.includes(city));

    if (cityKey) {
      return cityImages[cityKey];
    }

    const photoQuery = encodeURIComponent(`${location} city travel`);
    return `https://loremflickr.com/800/600/${photoQuery}`;
  };

  useEffect(() => {
    const query = draftBoard.location.trim();
    let isActive = true;

    if (!isCreateBoardVisible || !isLocationFocused || query.length < 2) {
      setCityOptions([]);
      setIsCitySearchLoading(false);
      setCitySearchError('');
      return undefined;
    }

    setCitySearchError('');
    setIsCitySearchLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
        );
        const data = await response.json();

        if (!isActive) {
          return;
        }

        const seen = new Set();
        const options = (data.results ?? [])
          .filter((result) => result.name && result.country)
          .map((result) => ({
            id: `${result.id}-${result.latitude}-${result.longitude}`,
            label: `${result.name}, ${result.country}`,
            city: result.name,
            country: result.country
          }))
          .filter((option) => {
            const key = option.label.toLowerCase();
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          })
          .slice(0, 6);

        setCityOptions(options);
        setCitySearchError('');
      } catch (error) {
        if (isActive) {
          setCityOptions([]);
          setCitySearchError('City search unavailable');
        }
      } finally {
        if (isActive) {
          setIsCitySearchLoading(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [draftBoard.location, isCreateBoardVisible, isLocationFocused]);
  
  const insets = useSafeAreaInsets();
  const tabBarHeight = 8 + 44 + Math.max(insets.bottom, 6) + 8;
  
  const upcomingBoards = getUpcomingTrips(boards);
  const pastTrips = getPastTrips(boards);

  const updateBoard = (boardId, patch) => {
    setBoards((current) => current.map((board) => (board.id === boardId ? { ...board, ...patch } : board)));
    setSelectedBoard((current) => (current?.id === boardId ? { ...current, ...patch } : current));
  };

  const openBoard = (board) => {
    setSelectedBoard(boards.find((item) => item.id === board.id) ?? board);
    setTripStack(null);
  };

  const openExploreRecommendation = (boardId, recId, from) => {
    setExploreStack({ screen: 'detail', boardId, recId, from });
  };

  const openTab = (tab) => {
    setActiveTab(tab);
    setSelectedBoard(null);
    setTripStack(null);
    setExploreStack(null);
  };

  const getRecommendationDayIndex = (rec) => {
    const match = rec.dayLabel?.match(/\d+/);
    return match ? Math.max(Number(match[0]) - 1, 0) : 0;
  };

  const refreshTripRecommendationSection = (boardId, sectionTitle) => {
    setTripRecommendationRefreshes((current) => ({
      ...current,
      [boardId]: {
        ...(current[boardId] ?? {}),
        [sectionTitle]: (current[boardId]?.[sectionTitle] ?? 1) + 1
      }
    }));
  };

  const addRecommendationToItinerary = (boardId, rec) => {
    const board = boards.find((item) => item.id === boardId);
    if (!board) {
      return;
    }
    const alreadySaved = (board.placesList ?? []).some((place) => place.name === rec.title);
    if (alreadySaved) {
      setAddedRecIds((current) => ({ ...current, [rec.id]: true }));
      return;
    }
    const newPlace = {
      id: `p-${Date.now()}`,
      name: rec.title,
      note: `Added from Recommendations · ${rec.category} · ${rec.price}`,
      dayIndex: getRecommendationDayIndex(rec)
    };
    updateBoard(boardId, { placesList: [...(board.placesList ?? []), newPlace] });
    setAddedRecIds((current) => ({ ...current, [rec.id]: true }));
  };

  const resetDraftBoard = () => {
    setDraftBoard({
      title: '',
      location: '',
      startDate: '',
      endDate: ''
    });
    setCityOptions([]);
    setCitySearchError('');
    setIsLocationFocused(false);
    setActiveDraftDateField(null);
  };

  const openNewBoard = () => {
    resetDraftBoard();
    setIsCreateBoardVisible(true);
  };

  const closeNewBoard = () => {
    setIsCreateBoardVisible(false);
    setActiveDraftDateField(null);
  };

  const addPublicTripToBoards = (trip) => {
    const alreadyAdded = boards.some((board) => board.sourcePublicTripId === trip.id);
    if (alreadyAdded) {
      return;
    }

    const copiedTrip = {
      ...trip,
      id: `board-${Date.now()}`,
      sourcePublicTripId: trip.id,
      subtitle: trip.location,
      placesList: (trip.placesList ?? []).map((place, index) => ({
        ...place,
        id: `p-${Date.now()}-${index}`
      }))
    };

    setBoards((current) => [copiedTrip, ...current]);
    setActiveTab('Trips');
    setSelectedBoard(copiedTrip);
    setTripStack(null);
    setExploreStack(null);
  };

  const handleCreateBoard = () => {
    const title = draftBoard.title.trim();
    const location = draftBoard.location.trim();
    if (!title) {
      return;
    }

    const start = parseDateInput(draftBoard.startDate) || new Date();
    start.setHours(0, 0, 0, 0);

    const endValue = parseDateInput(draftBoard.endDate);
    const endDate = endValue ? new Date(endValue) : new Date(start);
    if (endDate < start) {
      endDate.setTime(start.getTime());
    }

    const newBoard = {
      id: `board-${Date.now()}`,
      title,
      subtitle: location || 'New trip',
      location,
      image: getBoardImageUrl(location || title),
      places: 0,
      days: Math.max(1, Math.round((endDate - start) / (1000 * 60 * 60 * 24)) + 1),
      startDate: start.toISOString(),
      endDate: endDate.toISOString(),
      placesList: []
    };

    setBoards((current) => [newBoard, ...current]);
    setSelectedBoard(newBoard);
    setCityOptions([]);
    setIsLocationFocused(false);
    closeNewBoard();
  };

  const renderCreateBoardModal = () => (
    <Modal visible={isCreateBoardVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Create new trip</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.modalForm}>
            <Text style={styles.modalLabel}>Trip title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Venice Streets"
              value={draftBoard.title}
              onChangeText={(value) => setDraftBoard((current) => ({ ...current, title: value }))}
              placeholderTextColor="#A1A1AA"
            />
            <Text style={styles.modalLabel}>Location</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="London"
              value={draftBoard.location}
              onFocus={() => setIsLocationFocused(true)}
              onChangeText={(value) => {
                setIsLocationFocused(true);
                setDraftBoard((current) => ({ ...current, location: value }));
              }}
              placeholderTextColor="#A1A1AA"
            />
            {isLocationFocused && (draftBoard.location.trim().length >= 2 || cityOptions.length > 0) && (
              <View style={styles.cityDropdown}>
                {isCitySearchLoading && (
                  <View style={styles.cityDropdownStatus}>
                    <ActivityIndicator size="small" color="#7D3DBA" />
                    <Text style={styles.cityDropdownStatusText}>Searching cities</Text>
                  </View>
                )}
                {!isCitySearchLoading &&
                  cityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.cityOption}
                      onPress={() => {
                        setDraftBoard((current) => ({ ...current, location: option.label }));
                        setCityOptions([]);
                        setIsLocationFocused(false);
                      }}
                    >
                      <Text style={styles.cityOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                {!isCitySearchLoading && cityOptions.length === 0 && !citySearchError && (
                  <Text style={styles.cityDropdownEmpty}>No cities found</Text>
                )}
                {!isCitySearchLoading && citySearchError && (
                  <Text style={styles.cityDropdownEmpty}>{citySearchError}</Text>
                )}
              </View>
            )}
            <Text style={styles.modalLabel}>Start date</Text>
            <TouchableOpacity
              style={[styles.modalInput, styles.modalDateButton]}
              onPress={() => setActiveDraftDateField((current) => (current === 'startDate' ? null : 'startDate'))}
              activeOpacity={0.78}
            >
              <Text style={[styles.modalDateText, !draftBoard.startDate && styles.modalDatePlaceholder]}>
                {draftBoard.startDate || 'DD/MM/YYYY'}
              </Text>
            </TouchableOpacity>
            {activeDraftDateField === 'startDate' && (
              <View style={styles.modalCalendarWrap}>
                <DateTimePicker
                  value={getDraftDateValue('startDate')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => handleDraftDateChange('startDate', event, selectedDate)}
                  style={styles.inlineCalendar}
                />
              </View>
            )}
            <Text style={styles.modalLabel}>End date</Text>
            <TouchableOpacity
              style={[styles.modalInput, styles.modalDateButton]}
              onPress={() => setActiveDraftDateField((current) => (current === 'endDate' ? null : 'endDate'))}
              activeOpacity={0.78}
            >
              <Text style={[styles.modalDateText, !draftBoard.endDate && styles.modalDatePlaceholder]}>
                {draftBoard.endDate || 'DD/MM/YYYY'}
              </Text>
            </TouchableOpacity>
            {activeDraftDateField === 'endDate' && (
              <View style={styles.modalCalendarWrap}>
                <DateTimePicker
                  value={getDraftDateValue('endDate')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={parseDateInput(draftBoard.startDate) || new Date()}
                  onChange={(event, selectedDate) => handleDraftDateChange('endDate', event, selectedDate)}
                  style={styles.inlineCalendar}
                />
              </View>
            )}
          </ScrollView>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={closeNewBoard}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalSaveButton]} onPress={handleCreateBoard}>
              <Text style={styles.modalSaveText}>Save trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExploreContent = () => {
    return <ExploreScreen boards={boards} onAddPublicTrip={addPublicTripToBoards} />;
  };

  const renderSelectedBoardContent = () => {
    if (tripStack?.screen === 'recommendationDetail') {
      const board = boards.find((item) => item.id === selectedBoard.id) ?? selectedBoard;
      const refreshSeed = tripRecommendationRefreshes[board.id] ?? 1;
      const rec = getRecommendationById(board, tripStack.recId, refreshSeed);
      if (!rec) {
        return null;
      }
      const alreadyInItinerary =
        Boolean(addedRecIds[rec.id]) || (board.placesList ?? []).some((place) => place.name === rec.title);

      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <RecommendationDetailScreen
            board={board}
            rec={rec}
            added={alreadyInItinerary}
            onBack={() => setTripStack({ screen: 'recommendations' })}
            onAddToItinerary={() => addRecommendationToItinerary(board.id, rec)}
          />
        </ScrollView>
      );
    }

    if (tripStack?.screen === 'recommendations') {
      const board = boards.find((item) => item.id === selectedBoard.id) ?? selectedBoard;
      const refreshSeed = tripRecommendationRefreshes[board.id] ?? 1;
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ExploreMoreScreen
            board={board}
            refreshSeed={refreshSeed}
            onBack={() => setTripStack(null)}
            onOpenRecommendation={(_boardId, recId) => setTripStack({ screen: 'recommendationDetail', recId })}
            onRefreshSection={(sectionTitle) => refreshTripRecommendationSection(board.id, sectionTitle)}
          />
        </ScrollView>
      );
    }

    return (
      <TripDetailScreen
        board={selectedBoard}
        onBack={() => {
          setSelectedBoard(null);
          setTripStack(null);
        }}
        onUpdateBoard={(patch) => updateBoard(selectedBoard.id, patch)}
        onOpenRecommendations={() => setTripStack({ screen: 'recommendations' })}
      />
    );
  };

  const renderContent = () => {
    if (activeTab === 'Explore') {
      return renderExploreContent();
    }

    if (activeTab === 'Profile') {
      return <ProfileScreen boards={boards} pastTrips={pastTrips} onOpenBoard={openBoard} onCreateBoard={openNewBoard} />;
    }

    return (
      <>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>Upcoming trips</Text>
            <Text style={styles.sectionTitle}>Your journey preview</Text>
          </View>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>
              Atlas
              <Text style={styles.logoDot}>.</Text>
            </Text>
          </View>
        </View>

        <View style={styles.verticalCards}>
          {upcomingBoards.map((board) => (
            <BoardCard key={board.id} board={board} onPress={openBoard} style={styles.fullBoardCard} />
          ))}
        </View>

        <View style={styles.createTripRow}>
          <TouchableOpacity style={styles.createTripButton} onPress={openNewBoard}>
            <Text style={styles.createTripButtonText}>Create new trip</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.contentWrapper}>
        {selectedBoard ? (
          <View style={[styles.detailContainer, { paddingBottom: tabBarHeight }]}>
            {renderSelectedBoardContent()}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.container, exploreStack && styles.exploreStackContainer]}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        )}
        {renderCreateBoardModal()}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          {['Trips', 'Explore', 'Profile'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.navButton, activeTab === item && styles.navButtonActive]}
              onPress={() => openTab(item)}
            >
              <Text style={[styles.navText, activeTab === item && styles.navTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <InnerApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF5F8'
  },
  container: {
    padding: 20,
    paddingBottom: 140
  },
  contentWrapper: {
    flex: 1,
    position: 'relative'
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#F9D5E5',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    marginBottom: 24
  },
  brandLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#C26CF8',
    fontWeight: '700',
    marginBottom: 10
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#2A0A2B',
    marginBottom: 12
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6F3E56',
    marginBottom: 18
  },
  heroButton: {
    backgroundColor: '#DD77F2',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center'
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  logoWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A0A2B'
  },
  logoDot: {
    color: '#C26CF8'
  },
  verticalCards: {
    marginBottom: 24
  },
  fullBoardCard: {
    width: '100%',
    marginBottom: 16
  },
  createTripRow: {
    marginTop: 10,
    alignItems: 'center'
  },
  createTripButton: {
    width: '100%',
    backgroundColor: '#DD77F2',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center'
  },
  createTripButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  },
  sectionLabel: {
    color: '#C26CF8',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A0A2B',
    marginTop: 4
  },
  sectionAction: {
    color: '#7D3DBA',
    fontWeight: '700'
  },
  horizontalCards: {
    marginBottom: 24
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#F3D5F0',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  mapLabel: {
    color: '#C26CF8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  mapBadge: {
    color: '#6F3E56',
    fontWeight: '700'
  },
  mapPlaceholder: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  mapPlaceholderText: {
    color: '#7D3DBA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500'
  },
  statValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A'
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 20,
    elevation: 10
  },
  navButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  navButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1'
  },
  navText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  navTextActive: {
    color: '#0F172A',
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 15, 0.45)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D1633',
    marginBottom: 18
  },
  modalForm: {
    marginBottom: 16
  },
  modalLabel: {
    color: '#6F3E56',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600'
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalDateButton: {
    justifyContent: 'center'
  },
  modalDateText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600'
  },
  modalDatePlaceholder: {
    color: '#A1A1AA',
    fontWeight: '400'
  },
  modalCalendarWrap: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: -6,
    marginBottom: 14
  },
  inlineCalendar: {
    width: Platform.OS === 'ios' ? '108%' : '100%',
    alignSelf: 'center',
    transform: Platform.OS === 'ios' ? [{ scale: 0.92 }] : [],
    marginVertical: Platform.OS === 'ios' ? -12 : 0
  },
  cityDropdown: {
    marginTop: -6,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  cityDropdownStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  cityDropdownStatusText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  },
  cityOption: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  cityOptionText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600'
  },
  cityDropdownEmpty: {
    color: '#64748B',
    fontSize: 13,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  modalCancelButton: {
    backgroundColor: '#F3E5F6'
  },
  modalCancelText: {
    color: '#7D3DBA',
    fontWeight: '700'
  },
  modalSaveButton: {
    backgroundColor: '#9C27B0'
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4
  },
  exploreStackContainer: {
    paddingBottom: 120
  }
});

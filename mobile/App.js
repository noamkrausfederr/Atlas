import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black
} from '@expo-google-fonts/nunito';
import { colors, fonts, radius, shadow } from './src/theme';

import { publicTrips as publicTripMetadata, sampleBoards } from './data/trips';
import { getPastTrips, getUpcomingTrips } from './data/tripUtils';
import { getBoardImageUrl, hydrateTripImages } from './data/cityPhotos';

// Components & Screens
import { BoardCard } from './src/components/BoardCard';
import { IllustratedTripCard } from './src/components/IllustratedTripCard';
import { IllustratedHero } from './src/components/IllustratedHero';
import { StatsDashboard } from './src/components/StatsDashboard';
import { TripDetailScreen, TripEditScreen } from './src/screens/TripDetailScreen';
import { ExploreScreen, ExploreMoreScreen } from './src/screens/ExploreScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { ProfileScreen, SettingsScreen } from './src/screens/ProfileScreen';

function formatInboxHandle(ownerName) {
  return `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

function buildSeedInboxThreads() {
  const now = Date.now();
  const minute = 60 * 1000;

  const createThread = (ownerName, unreadCount, messages) => {
    const normalizedMessages = messages.map((message, index) => ({
      id: `${ownerName}-${index + 1}`,
      author: message.incoming ? ownerName : 'You',
      incoming: message.incoming,
      text: message.text,
      createdAt: new Date(now - message.minutesAgo * minute).toISOString(),
      read: !message.incoming || index < messages.length - unreadCount
    }));
    const lastMessage = normalizedMessages[normalizedMessages.length - 1];

    return [
      ownerName,
      {
        ownerName,
        handle: formatInboxHandle(ownerName),
        messages: normalizedMessages,
        unreadCount,
        lastMessageText: lastMessage.text,
        lastMessageAt: lastMessage.createdAt
      }
    ];
  };

  return Object.fromEntries([
    createThread('Maya R.', 2, [
      { incoming: true, text: 'I finally posted the London food map.', minutesAgo: 180 },
      { incoming: false, text: 'Need it immediately. Which market should I start with?', minutesAgo: 164 },
      { incoming: true, text: 'Borough first, then walk toward Neal’s Yard if you still have energy.', minutesAgo: 22 },
      { incoming: true, text: 'Also save room for dinner in Soho.', minutesAgo: 6 }
    ]),
    createThread('Nina K.', 0, [
      { incoming: false, text: 'Your Tokyo cafés list is unreal.', minutesAgo: 250 },
      { incoming: true, text: 'Ahh thank you. I can send my quiet study spots too.', minutesAgo: 238 },
      { incoming: false, text: 'Yes please, especially around Shibuya.', minutesAgo: 210 }
    ]),
    createThread('Daniel C.', 1, [
      { incoming: true, text: 'If you do the Lisbon tram route early, the photos come out so much better.', minutesAgo: 95 },
      { incoming: false, text: 'That is exactly the kind of tip I needed.', minutesAgo: 74 },
      { incoming: true, text: 'I’ll send you the breakfast stop I paired with it.', minutesAgo: 9 }
    ])
  ]);
}


function InnerApp() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black
  });

  const createBoardFormRef = useRef(null);
  const createBoardLocationInputRef = useRef(null);
  const [boards, setBoards] = useState(sampleBoards);
  const [hydratedPublicTrips, setHydratedPublicTrips] = useState(publicTripMetadata);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [tripStack, setTripStack] = useState(null);
  const [activeTab, setActiveTab] = useState('Trips');
  const [exploreStack, setExploreStack] = useState(null);
  const [profileStack, setProfileStack] = useState(null);
  const [exploreResetKey, setExploreResetKey] = useState(0);
  const [likedPublicTripIds, setLikedPublicTripIds] = useState([]);
  const [followedProfileNames, setFollowedProfileNames] = useState([]);
  const [selectedInboxProfileName, setSelectedInboxProfileName] = useState(null);
  const [isInboxThreadOpen, setIsInboxThreadOpen] = useState(false);
  const [inboxThreads, setInboxThreads] = useState(() => buildSeedInboxThreads());
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isCreateBoardVisible, setIsCreateBoardVisible] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [isCitySearchLoading, setIsCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [activeDraftDateField, setActiveDraftDateField] = useState(null);
  const [draftBoard, setDraftBoard] = useState({
    title: '',
    location: '',
    description: '',
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

  const scrollCreateBoardFormToEnd = () => {
    setTimeout(() => {
      createBoardFormRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const handleDraftDateChange = (field, _event, selectedDate) => {
    const advanceDateField = () => {
      if (field === 'startDate') {
        setActiveDraftDateField('endDate');
        scrollCreateBoardFormToEnd();
      } else {
        setActiveDraftDateField(null);
      }
    };

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

    if (Platform.OS === 'android' && field === 'startDate') {
      setTimeout(advanceDateField, 0);
    } else {
      advanceDateField();
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

  useEffect(() => {
    let isActive = true;

    Promise.all([
      hydrateTripImages(sampleBoards),
      hydrateTripImages(publicTripMetadata)
    ]).then(([hydratedBoards, nextPublicTrips]) => {
      if (!isActive) return;

      const imageUrls = [...hydratedBoards, ...nextPublicTrips].map((trip) => trip.image).filter(Boolean);
      imageUrls.forEach((imageUrl) => Image.prefetch(imageUrl));

      const hydratedImagesById = hydratedBoards.reduce((images, board) => {
        images[board.id] = board.image;
        return images;
      }, {});

      setHydratedPublicTrips(nextPublicTrips);
      setBoards((current) =>
        current.map((board) => (
          hydratedImagesById[board.id] ? { ...board, image: hydratedImagesById[board.id] } : board
        ))
      );
      setSelectedBoard((current) => (
        current && hydratedImagesById[current.id] ? { ...current, image: hydratedImagesById[current.id] } : current
      ));
    });

    return () => {
      isActive = false;
    };
  }, []);
  
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 6);

  if (!fontsLoaded) return null;
  const isInboxChatOpen = activeTab === 'Inbox' && isInboxThreadOpen;
  const shouldHideBottomNav = isInboxChatOpen && isKeyboardVisible;
  
const upcomingBoards = getUpcomingTrips(boards);
  const pastTrips = getPastTrips(boards);
  const likedPublicTrips = hydratedPublicTrips.filter((trip) => likedPublicTripIds.includes(trip.id));
  const isTripsRootView = !selectedBoard && activeTab === 'Trips';
  const isExploreView = activeTab === 'Explore';
  const isInboxView = activeTab === 'Inbox';
  const isProfileView = activeTab === 'Profile';
  const isTripDetailView = Boolean(selectedBoard);
  const inboxProfileDirectory = hydratedPublicTrips.reduce((profiles, trip) => {
    if (!profiles[trip.ownerName]) {
      profiles[trip.ownerName] = {
        ownerName: trip.ownerName,
        handle: formatInboxHandle(trip.ownerName),
        image: null
      };
    }
    return profiles;
  }, {});

  const updateBoard = (boardId, patch) => {
    setBoards((current) => current.map((board) => (board.id === boardId ? { ...board, ...patch } : board)));
    setSelectedBoard((current) => (current?.id === boardId ? { ...current, ...patch } : current));
  };

  const duplicateBoard = (board) => {
    const duplicatedBoard = {
      ...board,
      id: `board-${Date.now()}`,
      title: board.title.includes('Copy') ? board.title : `${board.title} Copy`,
      isPublic: false,
      placesList: (board.placesList ?? []).map((place, index) => ({
        ...place,
        id: `${place.id || 'p'}-copy-${Date.now()}-${index}`
      }))
    };

    setBoards((current) => [duplicatedBoard, ...current]);
    setSelectedBoard(duplicatedBoard);
    setTripStack(null);
  };

  const deleteBoard = (boardId) => {
    setBoards((current) => current.filter((board) => board.id !== boardId));
    setSelectedBoard((current) => (current?.id === boardId ? null : current));
    setTripStack(null);
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
    setProfileStack(null);
    if (tab === 'Explore') {
      setExploreResetKey((current) => current + 1);
    }
    if (tab === 'Inbox') {
      setIsInboxThreadOpen(false);
    }
  };

  const markInboxThreadRead = (ownerName) => {
    if (!ownerName) return;

    setInboxThreads((current) => {
      const thread = current[ownerName];
      if (!thread || thread.unreadCount === 0) {
        return current;
      }

      return {
        ...current,
        [ownerName]: {
          ...thread,
          unreadCount: 0,
          messages: thread.messages.map((message) => (
            message.incoming ? { ...message, read: true } : message
          ))
        }
      };
    });
  };

  const openInboxThread = (ownerName = null) => {
    setSelectedInboxProfileName(ownerName);
    setIsInboxThreadOpen(Boolean(ownerName));
    setActiveTab('Inbox');
    setSelectedBoard(null);
    setTripStack(null);
    setExploreStack(null);
    setProfileStack(null);
    markInboxThreadRead(ownerName);
  };

  const sendInboxMessage = (ownerName, text) => {
    if (!ownerName || !text.trim()) {
      return;
    }

    const nextMessage = {
      id: `${ownerName}-${Date.now()}`,
      author: 'You',
      incoming: false,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: true
    };

    setInboxThreads((current) => {
      const existingThread = current[ownerName];
      const profile = inboxProfileDirectory[ownerName] ?? {
        ownerName,
        handle: formatInboxHandle(ownerName),
        image: null
      };

      return {
        ...current,
        [ownerName]: {
          ownerName,
          handle: profile.handle,
          messages: [...(existingThread?.messages ?? []), nextMessage],
          unreadCount: existingThread?.unreadCount ?? 0,
          lastMessageText: nextMessage.text,
          lastMessageAt: nextMessage.createdAt
        }
      };
    });
  };

  const resetDraftBoard = () => {
    setDraftBoard({
      title: '',
      location: '',
      description: '',
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
      isPublic: false,
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
  const toggleLikedPublicTrip = (tripId) => {
    setLikedPublicTripIds((current) => (
      current.includes(tripId) ? current.filter((id) => id !== tripId) : [...current, tripId]
    ));
  };
  const toggleFollowedProfile = (ownerName) => {
    setFollowedProfileNames((current) => (
      current.includes(ownerName) ? current.filter((name) => name !== ownerName) : [...current, ownerName]
    ));
  };

  const handleCreateBoard = async () => {
    const title = draftBoard.title.trim();
    const location = draftBoard.location.trim();
    if (!title || isCreatingBoard) {
      return;
    }
    setIsCreatingBoard(true);

    try {
      const start = parseDateInput(draftBoard.startDate) || new Date();
      start.setHours(0, 0, 0, 0);

      const endValue = parseDateInput(draftBoard.endDate);
      const endDate = endValue ? new Date(endValue) : new Date(start);
      if (endDate < start) {
        endDate.setTime(start.getTime());
      }
      const description = draftBoard.description.trim();
      const image = await getBoardImageUrl(location || title);

      const newBoard = {
        id: `board-${Date.now()}`,
        title,
        subtitle: location || 'New trip',
        location,
        description,
        image,
        places: 0,
        days: Math.max(1, Math.round((endDate - start) / (1000 * 60 * 60 * 24)) + 1),
        startDate: start.toISOString(),
        endDate: endDate.toISOString(),
        isPublic: false,
        placesList: []
      };

      setBoards((current) => [newBoard, ...current]);
      setSelectedBoard(newBoard);
      setCityOptions([]);
      setIsLocationFocused(false);
      closeNewBoard();
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const renderCreateBoardModal = () => (
    <Modal visible={isCreateBoardVisible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={undefined}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Create new trip</Text>
          <ScrollView
            ref={createBoardFormRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets={true}
            style={styles.modalForm}
            contentContainerStyle={styles.modalFormContent}
          >
            <Text style={styles.modalLabel}>Trip title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Venice food weekend"
              value={draftBoard.title}
              returnKeyType="done"
              onChangeText={(value) => setDraftBoard((current) => ({ ...current, title: value }))}
              onSubmitEditing={Keyboard.dismiss}
              placeholderTextColor="#AAAAAA"
            />
            <Text style={styles.modalLabel}>Location</Text>
            <TextInput
              ref={createBoardLocationInputRef}
              style={styles.modalInput}
              placeholder="e.g. London, United Kingdom"
              value={draftBoard.location}
              returnKeyType="done"
              onFocus={() => setIsLocationFocused(true)}
              onChangeText={(value) => {
                setIsLocationFocused(true);
                setDraftBoard((current) => ({ ...current, location: value }));
              }}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                setIsLocationFocused(false);
              }}
              placeholderTextColor="#AAAAAA"
            />
            {isLocationFocused && (draftBoard.location.trim().length >= 2 || cityOptions.length > 0) && (
              <View style={styles.cityDropdown}>
                {isCitySearchLoading && (
                  <View style={styles.cityDropdownStatus}>
                    <ActivityIndicator size="small" color="#A97C50" />
                    <Text style={styles.cityDropdownStatusText}>Searching cities</Text>
                  </View>
                )}
                {!isCitySearchLoading &&
                  cityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.cityOption}
                      onPress={() => {
                        Keyboard.dismiss();
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
              onPress={() => { Keyboard.dismiss(); setActiveDraftDateField((current) => (current === 'startDate' ? null : 'startDate')); }}
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
              onPress={() => {
                Keyboard.dismiss();
                setActiveDraftDateField((current) => {
                  const next = current === 'endDate' ? null : 'endDate';
                  if (next === 'endDate') {
                    scrollCreateBoardFormToEnd();
                  }
                  return next;
                });
              }}
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
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalMultilineInput]}
              placeholder="Describe the trip in 1-2 sentences"
              value={draftBoard.description}
              multiline
              blurOnSubmit={true}
              textAlignVertical="top"
              returnKeyType="done"
              onFocus={scrollCreateBoardFormToEnd}
              onSubmitEditing={Keyboard.dismiss}
              onChangeText={(value) => setDraftBoard((current) => ({ ...current, description: value }))}
              placeholderTextColor="#AAAAAA"
            />
          </ScrollView>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={closeNewBoard}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton, isCreatingBoard && styles.modalSaveButtonDisabled]}
              onPress={handleCreateBoard}
              disabled={isCreatingBoard}
            >
              <Text style={styles.modalSaveText}>{isCreatingBoard ? 'Finding photo...' : 'Save trip'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderExploreContent = () => {
    return (
      <ExploreScreen
        key={exploreResetKey}
        boards={boards}
        publicTrips={hydratedPublicTrips}
        likedPublicTripIds={likedPublicTripIds}
        followedProfileNames={followedProfileNames}
        onAddPublicTrip={addPublicTripToBoards}
        onToggleLikePublicTrip={toggleLikedPublicTrip}
        onToggleFollowProfile={toggleFollowedProfile}
        onMessageProfile={openInboxThread}
      />
    );
  };

  const renderSelectedBoardContent = () => {
    if (tripStack?.screen === 'recommendations') {
      const board = boards.find((item) => item.id === selectedBoard.id) ?? selectedBoard;
      return (
        <ExploreMoreScreen
          board={board}
          onBack={() => setTripStack(null)}
        />
      );
    }

    if (tripStack?.screen === 'edit') {
      const board = boards.find((item) => item.id === selectedBoard.id) ?? selectedBoard;
      return (
        <TripEditScreen
          board={board}
          onBack={() => setTripStack(null)}
          onSave={(patch) => updateBoard(board.id, patch)}
          onDuplicateBoard={() => duplicateBoard(board)}
          onDeleteBoard={() => deleteBoard(board.id)}
        />
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
        onOpenEditTrip={() => setTripStack({ screen: 'edit' })}
      />
    );
  };

  const renderContent = () => {
    if (activeTab === 'Explore') {
      return renderExploreContent();
    }

    if (activeTab === 'Profile') {
      if (profileStack?.screen === 'settings') {
        return (
          <SettingsScreen
            onBack={() => setProfileStack(null)}
          />
        );
      }

      return (
        <ProfileScreen
          boards={boards}
          followingCount={382 + followedProfileNames.length}
          onOpenBoard={openBoard}
          onOpenSettings={() => setProfileStack({ screen: 'settings' })}
        />
      );
    }

    if (activeTab === 'Inbox') {
      return (
        <InboxScreen
          profileDirectory={inboxProfileDirectory}
          threads={inboxThreads}
          selectedProfileName={selectedInboxProfileName}
          isThreadOpen={isInboxThreadOpen}
          onSelectThread={(ownerName) => {
            setSelectedInboxProfileName(ownerName);
            setIsInboxThreadOpen(true);
            markInboxThreadRead(ownerName);
          }}
          onCloseThread={() => setIsInboxThreadOpen(false)}
          onSendMessage={sendInboxMessage}
        />
      );
    }

    const totalPlaces = boards.reduce((sum, b) => sum + (b.placesList?.length ?? 0), 0);
    const countrySet = new Set(boards.map((b) => (b.location || '').split(',').pop().trim()).filter(Boolean));

    return (
      <>
        {/* Illustrated hero header */}
        <IllustratedHero />

        {/* Stats dashboard */}
        <StatsDashboard
          trips={boards.length}
          countries={countrySet.size}
          places={totalPlaces}
          upcoming={upcomingBoards.length}
        />

        {/* Upcoming trips */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Upcoming</Text>
          <View style={[styles.sectionHeaderPill, { backgroundColor: '#D8EAF8' }]}>
            <Text style={[styles.sectionHeaderPillText, { color: '#1A508A' }]}>{upcomingBoards.length}</Text>
          </View>
        </View>

        {upcomingBoards.length > 0 ? (
          <View style={styles.tripStack}>
            {/* Featured first trip */}
            <IllustratedTripCard
              key={upcomingBoards[0].id}
              board={upcomingBoards[0]}
              onPress={openBoard}
              featured
              style={styles.featuredCard}
            />
            {/* Mini grid for the rest */}
            {upcomingBoards.length > 1 && (
              <View style={styles.miniGrid}>
                {upcomingBoards.slice(1).map((board) => (
                  <IllustratedTripCard key={board.id} board={board} onPress={openBoard} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="airplane-outline" size={28} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptySectionText}>No upcoming trips yet.</Text>
          </View>
        )}

        {/* Past trips */}
        <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
          <Text style={styles.sectionHeaderTitle}>Past trips</Text>
          <View style={[styles.sectionHeaderPill, { backgroundColor: '#EEE9E2' }]}>
            <Text style={[styles.sectionHeaderPillText, { color: '#5C5650' }]}>{pastTrips.length}</Text>
          </View>
        </View>

        {pastTrips.length > 0 ? (
          <View style={styles.miniGrid}>
            {pastTrips.map((board) => (
              <IllustratedTripCard key={board.id} board={board} onPress={openBoard} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyTrips} />
        )}
      </>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        (isTripsRootView || isExploreView || isInboxView || isProfileView) && styles.tripsSafeArea,
        isTripDetailView && styles.detailSafeArea
      ]}
      edges={['top']}
    >
      <StatusBar style="dark" />
      <View
        style={[
          styles.contentWrapper,
          isTripsRootView && styles.tripsContentWrapper,
          isTripDetailView && styles.detailContentWrapper,
          (isExploreView || isInboxView || isProfileView) && styles.tripsContentWrapper
        ]}
      >
        {selectedBoard ? (
          <View style={[styles.detailContainer, styles.tripDetailContainer, { paddingBottom: tabBarHeight }]}>
            {renderSelectedBoardContent()}
          </View>
        ) : activeTab === 'Inbox' || activeTab === 'Profile' ? (
          <View style={[styles.detailContainer, styles.tripDetailContainer, { paddingBottom: shouldHideBottomNav ? 0 : tabBarHeight }]}>
            {renderContent()}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.container,
              exploreStack && styles.exploreStackContainer,
              isTripsRootView && styles.tripsContainer,
              isExploreView && styles.exploreContainer
            ]}
            style={isTripsRootView ? styles.tripsScrollView : isExploreView ? styles.exploreScrollView : null}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        )}
        {renderCreateBoardModal()}
        {!shouldHideBottomNav && (
          <BlurView intensity={40} tint="light" style={styles.bottomNav}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Trips' && styles.navButtonActive]}
                onPress={() => openTab('Trips')}
              >
                <Ionicons name={activeTab === 'Trips' ? 'home' : 'home-outline'} size={26} color={activeTab === 'Trips' ? colors.accent : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Explore' && styles.navButtonActive]}
                onPress={() => openTab('Explore')}
              >
                <Ionicons name={activeTab === 'Explore' ? 'search' : 'search-outline'} size={26} color={activeTab === 'Explore' ? colors.accent : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.createTripNavButton} onPress={openNewBoard}>
                <Text style={styles.createTripNavButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Inbox' && styles.navButtonActive]}
                onPress={() => openTab('Inbox')}
              >
                <Ionicons name={activeTab === 'Inbox' ? 'chatbubbles' : 'chatbubbles-outline'} size={26} color={activeTab === 'Inbox' ? colors.accent : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Profile' && styles.navButtonActive]}
                onPress={() => openTab('Profile')}
              >
                <Ionicons name={activeTab === 'Profile' ? 'person' : 'person-outline'} size={26} color={activeTab === 'Profile' ? colors.accent : '#AAAAAA'} />
              </TouchableOpacity>
            </View>
            <View style={{ height: Math.max(insets.bottom, 6) }} />
          </BlurView>
        )}
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
    backgroundColor: '#F4F0EB'
  },
  tripsSafeArea: {
    backgroundColor: '#F4F0EB'
  },
  detailSafeArea: {
    backgroundColor: '#F4F0EB'
  },
  container: {
    padding: 20,
    paddingBottom: 92
  },
  tripsContainer: {
    backgroundColor: '#F4F0EB',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100
  },
  exploreContainer: {
    paddingHorizontal: 12,
    backgroundColor: '#F4F0EB'
  },
  contentWrapper: {
    flex: 1,
    position: 'relative'
  },
  tripsContentWrapper: {
    backgroundColor: '#F4F0EB'
  },
  detailContentWrapper: {
    backgroundColor: '#F4F0EB'
  },
  tripsScrollView: {
    backgroundColor: '#F4F0EB'
  },
  exploreScrollView: {
    backgroundColor: '#F4F0EB'
  },
  heroCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#E7C7B2',
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
    color: '#C89B6D',
    fontWeight: '700',
    marginBottom: 10
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#4B3A32',
    marginBottom: 12
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7A6658',
    marginBottom: 18
  },
  heroButton: {
    backgroundColor: '#E6A6B3',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center'
  },
  heroButtonText: {
    color: '#FFF8F0',
    fontWeight: '700',
    fontSize: 15
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingLeft: 2,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionHeaderPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionHeaderPillText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  tripStack: {
    gap: 10,
    marginBottom: 4,
  },
  featuredCard: {
    marginBottom: 0,
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  horizontalCards: {
    marginBottom: 20
  },
  emptyTrips: {
    height: 18,
    marginBottom: 12
  },
  emptySection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20
  },
  emptySectionText: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    fontSize: 14
  },
  createTripButton: {
    width: 44,
    height: 44,
    backgroundColor: '#E6A6B3',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createTripButtonText: {
    color: '#FFF8F0',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 26
  },
  sectionLabel: {
    color: '#C89B6D',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B3A32',
    marginTop: 4
  },
  sectionAction: {
    color: '#A97C50',
    fontWeight: '700'
  },
  mapCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#EBCAB8',
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
    color: '#C89B6D',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  mapBadge: {
    color: '#7A6658',
    fontWeight: '700'
  },
  mapPlaceholder: {
    backgroundColor: '#F1E7DA',
    borderRadius: 20,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2D3BF'
  },
  mapPlaceholderText: {
    color: '#A97C50',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244,240,235,0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(228,222,214,0.9)',
    zIndex: 20,
    elevation: 10,
    overflow: 'hidden'
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6
  },
  navButton: {
    width: 48,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navButtonActive: {},
  createTripNavButton: {
    width: 52,
    height: 52,
    backgroundColor: '#2B2927',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6
  },
  createTripNavButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300'
  },
  navText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  navTextActive: {
    color: '#555555',
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
    fontFamily: fonts.extraBold,
    color: colors.text,
    marginBottom: 18
  },
  modalForm: {
    marginBottom: 0
  },
  modalFormContent: {
    paddingBottom: 0
  },
  modalLabel: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '700',
    fontFamily: fonts.bold
  },
  modalInput: {
    backgroundColor: '#F4F0EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 14,
    color: '#111111',
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    textAlign: 'left'
  },
  modalMultilineInput: {
    minHeight: 112,
    paddingTop: Platform.OS === 'ios' ? 16 : 12
  },
  modalDateButton: {
    justifyContent: 'center'
  },
  modalDateText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600'
  },
  modalDatePlaceholder: {
    color: '#AAAAAA',
    fontWeight: '400'
  },
  modalCalendarWrap: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
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
    backgroundColor: '#F4F0EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
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
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.semiBold
  },
  cityOption: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  cityOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.semiBold
  },
  cityDropdownEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
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
    backgroundColor: '#F4F0EB',
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)'
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '700',
    fontFamily: fonts.bold
  },
  modalSaveButton: {
    backgroundColor: colors.text,
    borderWidth: 1,
    borderColor: colors.text
  },
  modalSaveButtonDisabled: {
    opacity: 0.55
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fonts.bold
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  tripDetailContainer: {
    backgroundColor: '#F4F0EB'
  },
  exploreStackContainer: {
    paddingBottom: 120
  }
});

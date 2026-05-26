import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { publicTrips as publicTripMetadata, sampleBoards } from './data/trips';
import { getPastTrips, getUpcomingTrips } from './data/tripUtils';
import { getBoardImageUrl, hydrateTripImages } from './data/cityPhotos';

// Components & Screens
import { BoardCard } from './src/components/BoardCard';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { ExploreScreen, ExploreMoreScreen } from './src/screens/ExploreScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const INBOX_PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=500&q=80'
];

function formatInboxHandle(ownerName) {
  return `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

function getInboxProfileImage(ownerName) {
  const seed = ownerName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return INBOX_PROFILE_IMAGES[seed % INBOX_PROFILE_IMAGES.length];
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
  const createBoardFormRef = useRef(null);
  const createBoardLocationInputRef = useRef(null);
  const [boards, setBoards] = useState(sampleBoards);
  const [hydratedPublicTrips, setHydratedPublicTrips] = useState(publicTripMetadata);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [tripStack, setTripStack] = useState(null);
  const [activeTab, setActiveTab] = useState('Trips');
  const [exploreStack, setExploreStack] = useState(null);
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
  const isInboxChatOpen = activeTab === 'Inbox' && isInboxThreadOpen;
  const shouldHideBottomNav = isInboxChatOpen && isKeyboardVisible;
  
const upcomingBoards = getUpcomingTrips(boards);
  const pastTrips = getPastTrips(boards);
  const likedPublicTrips = hydratedPublicTrips.filter((trip) => likedPublicTripIds.includes(trip.id));
  const isTripsRootView = !selectedBoard && activeTab === 'Trips';
  const isExploreView = activeTab === 'Explore';
  const isInboxView = activeTab === 'Inbox';
  const isTripDetailView = Boolean(selectedBoard);
  const inboxProfileDirectory = hydratedPublicTrips.reduce((profiles, trip) => {
    if (!profiles[trip.ownerName]) {
      profiles[trip.ownerName] = {
        ownerName: trip.ownerName,
        handle: formatInboxHandle(trip.ownerName),
        image: getInboxProfileImage(trip.ownerName)
      };
    }
    return profiles;
  }, {});

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
        image: getInboxProfileImage(ownerName)
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
      return (
        <ProfileScreen
          boards={boards}
          likedTrips={likedPublicTrips}
          followingCount={382 + followedProfileNames.length}
          onOpenBoard={openBoard}
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

    return (
      <>
        <View style={styles.sectionHeader}>
          <View style={styles.logoWrap}>
            <BlurView intensity={28} tint="light" style={styles.logoBlur}>
              <Text style={styles.logoText}>
                Atlas
                <Text style={styles.logoDot}>.</Text>
              </Text>
            </BlurView>
          </View>
        </View>

        <View style={styles.tripSectionHeader}>
          <Text style={styles.tripSectionTitle}>Upcoming trips</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalCards}>
          {upcomingBoards.map((board) => (
            <BoardCard key={board.id} board={board} onPress={openBoard} />
          ))}
        </ScrollView>

        <View style={styles.tripSectionHeader}>
          <Text style={styles.tripSectionTitle}>Past trips</Text>
        </View>
        {pastTrips.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalCards}>
            {pastTrips.map((board) => (
              <BoardCard key={board.id} board={board} onPress={openBoard} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyTrips} />
        )}
      </>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, (isTripsRootView || isExploreView || isInboxView) && styles.tripsSafeArea, isTripDetailView && styles.detailSafeArea]}
      edges={['top']}
    >
      <StatusBar style="dark" />
      <View
        style={[
          styles.contentWrapper,
          isTripsRootView && styles.tripsContentWrapper,
          isTripDetailView && styles.detailContentWrapper,
          (isExploreView || isInboxView) && styles.tripsContentWrapper
        ]}
      >
        {selectedBoard ? (
          <View style={[styles.detailContainer, styles.tripDetailContainer, { paddingBottom: tabBarHeight }]}>
            {renderSelectedBoardContent()}
          </View>
        ) : activeTab === 'Inbox' ? (
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
                <Ionicons name="home-outline" size={28} color={activeTab === 'Trips' ? '#555555' : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Explore' && styles.navButtonActive]}
                onPress={() => openTab('Explore')}
              >
                <Ionicons name="search-outline" size={28} color={activeTab === 'Explore' ? '#555555' : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.createTripNavButton} onPress={openNewBoard}>
                <Text style={styles.createTripNavButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Inbox' && styles.navButtonActive]}
                onPress={() => openTab('Inbox')}
              >
                <Ionicons name="chatbubbles-outline" size={28} color={activeTab === 'Inbox' ? '#555555' : '#AAAAAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, activeTab === 'Profile' && styles.navButtonActive]}
                onPress={() => openTab('Profile')}
              >
                <Ionicons name="person-outline" size={28} color={activeTab === 'Profile' ? '#555555' : '#AAAAAA'} />
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
    backgroundColor: '#F6EFE5'
  },
  tripsSafeArea: {
    backgroundColor: '#F3F3F1'
  },
  detailSafeArea: {
    backgroundColor: '#F3F3F1'
  },
  container: {
    padding: 20,
    paddingBottom: 92
  },
  tripsContainer: {
    backgroundColor: '#F3F3F1',
    paddingHorizontal: 12,
    paddingTop: 8
  },
  exploreContainer: {
    paddingHorizontal: 12,
    backgroundColor: '#F3F3F1'
  },
  contentWrapper: {
    flex: 1,
    position: 'relative'
  },
  tripsContentWrapper: {
    backgroundColor: '#F3F3F1'
  },
  detailContentWrapper: {
    backgroundColor: '#F3F3F1'
  },
  tripsScrollView: {
    backgroundColor: '#F3F3F1'
  },
  exploreScrollView: {
    backgroundColor: '#F3F3F1'
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  tripSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8
  },
  tripSectionTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: '#111111',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800',
    textTransform: 'lowercase'
  },
  logoWrap: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    overflow: 'hidden'
  },
  logoBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.82)'
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111'
  },
  logoDot: {
    color: '#555555'
  },
  horizontalCards: {
    marginBottom: 12
  },
  emptyTrips: {
    height: 18,
    marginBottom: 12
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
  horizontalCards: {
    marginBottom: 24
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F1E7DA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  statLabel: {
    color: '#A8998A',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500'
  },
  statValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: '#4B3A32'
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243,243,241,0.82)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(215,215,210,0.95)',
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
    width: 48,
    height: 48,
    backgroundColor: '#111111',
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
    color: '#111111',
    marginBottom: 18
  },
  modalForm: {
    marginBottom: 0
  },
  modalFormContent: {
    paddingBottom: 0
  },
  modalLabel: {
    color: '#111111',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600'
  },
  modalInput: {
    backgroundColor: '#F3F3F1',
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
    backgroundColor: '#F3F3F1',
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
    color: '#7F7063',
    fontSize: 13,
    fontWeight: '600'
  },
  cityOption: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE3D6'
  },
  cityOptionText: {
    color: '#4B3A32',
    fontSize: 14,
    fontWeight: '600'
  },
  cityDropdownEmpty: {
    color: '#7F7063',
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
    backgroundColor: '#F3F3F1',
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)'
  },
  modalCancelText: {
    color: '#111111',
    fontWeight: '700'
  },
  modalSaveButton: {
    backgroundColor: '#F3F3F1',
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)'
  },
  modalSaveButtonDisabled: {
    opacity: 0.72
  },
  modalSaveText: {
    color: '#111111',
    fontWeight: '700'
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  tripDetailContainer: {
    backgroundColor: '#F3F3F1'
  },
  exploreStackContainer: {
    paddingBottom: 120
  }
});

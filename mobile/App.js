import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

// Components & Screens
import { BoardCard } from './src/components/BoardCard';
import { TripDetailScreen, TripEditScreen } from './src/screens/TripDetailScreen';
import { ExploreScreen, ExploreMoreScreen } from './src/screens/ExploreScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { EditProfileScreen, ProfileScreen, SettingsScreen, TripListScreen } from './src/screens/ProfileScreen';
import { CreateAccountScreen, LoginScreen, WelcomeScreen } from './src/screens/AuthScreens';

function formatInboxHandle(ownerName) {
  return `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

function buildSeedInboxThreads() {
  const now = Date.now();
  const minute = 60 * 1000;

  const createThread = (ownerName, unreadCount, tripName, messages) => {
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
        tripName,
        messages: normalizedMessages,
        unreadCount,
        lastMessageText: lastMessage.text,
        lastMessageAt: lastMessage.createdAt
      }
    ];
  };

  return Object.fromEntries([
    createThread('Maya R.', 2, 'London Food Map', [
      { incoming: true, text: 'I finally posted the London food map.', minutesAgo: 180 },
      { incoming: false, text: 'Need it immediately. Which market should I start with?', minutesAgo: 164 },
      { incoming: true, text: 'Borough first, then walk toward Neal\'s Yard if you still have energy.', minutesAgo: 22 },
      { incoming: true, text: 'Also save room for dinner in Soho.', minutesAgo: 6 }
    ]),
    createThread('Nina K.', 0, 'Tokyo Cafés', [
      { incoming: false, text: 'Your Tokyo cafés list is unreal.', minutesAgo: 250 },
      { incoming: true, text: 'Ahh thank you. I can send my quiet study spots too.', minutesAgo: 238 },
      { incoming: false, text: 'Yes please, especially around Shibuya.', minutesAgo: 210 }
    ]),
    createThread('Daniel C.', 1, 'Lisbon Tram Route', [
      { incoming: true, text: 'If you do the Lisbon tram route early, the photos come out so much better.', minutesAgo: 95 },
      { incoming: false, text: 'That is exactly the kind of tip I needed.', minutesAgo: 74 },
      { incoming: true, text: 'I\'ll send you the breakfast stop I paired with it.', minutesAgo: 9 }
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
    Nunito_900Black,
    Gaya: require('./assets/fonts/gayatrial-italic.otf'),
    LuckyBones: require('./assets/fonts/Luckybones-Bold.otf'),
    SKMoralist: require('./assets/fonts/SKMoralist-Regular.ttf'),
    Biro: require('./assets/fonts/Biro_Script_reduced.ttf')
  });

  const createBoardFormRef = useRef(null);
  const createBoardLocationInputRef = useRef(null);
  const [boards, setBoards] = useState(sampleBoards);
  const hydratedPublicTrips = publicTripMetadata;
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [tripStack, setTripStack] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState('welcome');
  const [exploreStack, setExploreStack] = useState(null);
  const [profileStack, setProfileStack] = useState(null);
  const [settingsStack, setSettingsStack] = useState(null);
  const [exploreResetKey, setExploreResetKey] = useState(0);
  const [likedPublicTripIds, setLikedPublicTripIds] = useState([]);
  const [followedProfileNames, setFollowedProfileNames] = useState([]);
  const [selectedInboxProfileName, setSelectedInboxProfileName] = useState(null);
  const [isInboxThreadOpen, setIsInboxThreadOpen] = useState(false);
  const [inboxThreads, setInboxThreads] = useState(() => buildSeedInboxThreads());
  const [isExploreFilterHeaderHidden, setIsExploreFilterHeaderHidden] = useState(false);
  const [isCreateBoardVisible, setIsCreateBoardVisible] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [isCitySearchLoading, setIsCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isPickingTripPhoto, setIsPickingTripPhoto] = useState(false);
  const [tripPhotoError, setTripPhotoError] = useState('');
  const [activeDraftDateField, setActiveDraftDateField] = useState(null);
  const [draftBoard, setDraftBoard] = useState({
    title: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    image: ''
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

  if (!fontsLoaded) return null;

  if (!isAuthenticated) {
    const finishAuth = () => setIsAuthenticated(true);

    return (
      <SafeAreaView
        style={[styles.safeArea, authScreen === 'welcome' && { backgroundColor: colors.surfaceDeep }]}
        edges={['top', 'bottom']}
      >
        <StatusBar style="dark" />
        {authScreen === 'login' ? (
          <LoginScreen
            onBack={() => setAuthScreen('welcome')}
            onSubmit={finishAuth}
            onCreateAccountPress={() => setAuthScreen('createAccount')}
          />
        ) : authScreen === 'createAccount' ? (
          <CreateAccountScreen
            onBack={() => setAuthScreen('welcome')}
            onSubmit={finishAuth}
            onLoginPress={() => setAuthScreen('login')}
          />
        ) : (
          <WelcomeScreen
            onLoginPress={() => setAuthScreen('login')}
            onCreateAccountPress={() => setAuthScreen('createAccount')}
          />
        )}
      </SafeAreaView>
    );
  }

  const isInboxChatOpen = activeTab === 'Inbox' && isInboxThreadOpen;
  
  const upcomingBoards = getUpcomingTrips(boards);
  const pastTrips = getPastTrips(boards);
  const likedPublicTrips = hydratedPublicTrips.filter((trip) => likedPublicTripIds.includes(trip.id));
  const isExploreView = activeTab === 'Explore';
  const isInboxView = activeTab === 'Inbox';
  const isProfileView = activeTab === 'Profile';
  const isSettingsView = activeTab === 'Settings';
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

  const inboxUnreadCount = Object.values(inboxThreads).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

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
    setSettingsStack(null);
    if (tab === 'Explore') {
      setExploreResetKey((current) => current + 1);
    }
    if (tab === 'Inbox') {
      setIsInboxThreadOpen(false);
    }
  };

  const handleLogout = () => {
    setActiveTab('Profile');
    setSelectedBoard(null);
    setTripStack(null);
    setExploreStack(null);
    setProfileStack(null);
    setSettingsStack(null);
    setAuthScreen('welcome');
    setIsAuthenticated(false);
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
      endDate: '',
      image: ''
    });
    setCityOptions([]);
    setCitySearchError('');
    setTripPhotoError('');
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

  const handlePickTripPhoto = async () => {
    if (isPickingTripPhoto) {
      return;
    }

    setTripPhotoError('');
    setIsPickingTripPhoto(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 5],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setDraftBoard((current) => ({ ...current, image: result.assets[0].uri }));
      }
    } catch (error) {
      setTripPhotoError('Could not open photo library. Try restarting Expo once.');
    } finally {
      setIsPickingTripPhoto(false);
    }
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
    setActiveTab('Profile');
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
    const description = draftBoard.description.trim();
    const selectedImage = draftBoard.image.trim();
    const startValue = parseDateInput(draftBoard.startDate);
    const endValue = parseDateInput(draftBoard.endDate);

    if (
      isCreatingBoard ||
      !title ||
      !location ||
      !description ||
      !selectedImage ||
      !startValue ||
      !endValue
    ) {
      return;
    }
    setIsCreatingBoard(true);

    try {
      const start = new Date(startValue);
      start.setHours(0, 0, 0, 0);

      const endDate = new Date(endValue);
      if (endDate < start) {
        endDate.setTime(start.getTime());
      }

      const newBoard = {
        id: `board-${Date.now()}`,
        title,
        subtitle: location || 'New trip',
        location,
        description,
        image: selectedImage,
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

  const isDraftBoardComplete = Boolean(
    draftBoard.title.trim() &&
    draftBoard.location.trim() &&
    draftBoard.description.trim() &&
    draftBoard.startDate.trim() &&
    draftBoard.endDate.trim() &&
    draftBoard.image.trim()
  );

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
                    <ActivityIndicator size="small" color={colors.accent} />
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
            <Text style={styles.modalLabel}>Trip photo</Text>
            <TouchableOpacity
              style={styles.photoPickerButton}
              activeOpacity={0.82}
              onPress={handlePickTripPhoto}
            >
              {draftBoard.image ? (
                <Image source={{ uri: draftBoard.image }} style={styles.photoPickerPreview} />
              ) : (
                <View style={styles.photoPickerPlaceholder}>
                  {isPickingTripPhoto ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                  )}
                  <Text style={styles.photoPickerPlaceholderText}>Upload trip photo</Text>
                  <Text style={styles.photoPickerHelperText}>
                    {isPickingTripPhoto ? 'Opening photo library...' : 'This is required before saving'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {tripPhotoError ? <Text style={styles.photoPickerError}>{tripPhotoError}</Text> : null}
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
              style={[
                styles.modalButton,
                styles.modalSaveButton,
                (!isDraftBoardComplete || isCreatingBoard) && styles.modalSaveButtonDisabled
              ]}
              onPress={handleCreateBoard}
              disabled={!isDraftBoardComplete || isCreatingBoard}
            >
              <Text style={styles.modalSaveText}>{isCreatingBoard ? 'Saving trip...' : 'Save trip'}</Text>
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
        onFilterPageVisibilityChange={setIsExploreFilterHeaderHidden}
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
          onAddRecommendation={(recommendation) => {
            const startDate = board.startDate ? new Date(board.startDate) : new Date();
            const nextPlace = {
              id: `p-${Date.now()}`,
              name: recommendation.title,
              note: recommendation.reason || recommendation.description || '',
              address: recommendation.address || '',
              sourceUrl: recommendation.websiteUrl || recommendation.sourceAttributions?.[0]?.url || '',
              dayIndex: 0,
              day: 1,
              date: startDate.toISOString()
            };
            updateBoard(board.id, {
              placesList: [...(board.placesList ?? []), nextPlace]
            });
          }}
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
      if (profileStack?.screen === 'editProfile') {
        return (
          <EditProfileScreen
            onBack={() => setProfileStack(null)}
          />
        );
      }

      if (profileStack?.screen === 'settings') {
        return (
          <SettingsScreen
            onBack={() => setProfileStack(null)}
            onLogoutPress={handleLogout}
          />
        );
      }

      if (profileStack?.screen === 'allUpcoming') {
        return (
          <TripListScreen
            title="Upcoming Trips"
            boards={upcomingBoards}
            compact={false}
            onBack={() => setProfileStack(null)}
            onOpenBoard={openBoard}
          />
        );
      }

      if (profileStack?.screen === 'allPast') {
        return (
          <TripListScreen
            title="Past Trips"
            boards={pastTrips}
            compact={false}
            onBack={() => setProfileStack(null)}
            onOpenBoard={openBoard}
          />
        );
      }

      return (
        <ProfileScreen
          boards={boards}
          upcomingBoards={upcomingBoards}
          pastTrips={pastTrips}
          followingCount={382 + followedProfileNames.length}
          onOpenBoard={openBoard}
          onSeeAllUpcoming={() => setProfileStack({ screen: 'allUpcoming' })}
          onSeeAllPast={() => setProfileStack({ screen: 'allPast' })}
          onEditProfilePress={() => setProfileStack({ screen: 'editProfile' })}
        />
      );
    }

    if (activeTab === 'Settings') {
      if (settingsStack?.screen === 'editProfile') {
        return (
          <EditProfileScreen
            onBack={() => setSettingsStack(null)}
          />
        );
      }

      return (
        <SettingsScreen
          onBack={() => openTab('Profile')}
          onEditProfilePress={() => setSettingsStack({ screen: 'editProfile' })}
          onLogoutPress={handleLogout}
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
          onNavigateToTab={openTab}
        />
      );
    }
    return null;
  };

  const showTabBar = !selectedBoard && !isInboxChatOpen && !isExploreFilterHeaderHidden;
  const floatingFabBottom = (showTabBar ? 88 : 20) + insets.bottom;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        (isExploreView || isInboxView || isProfileView || isSettingsView) && styles.tripsSafeArea,
        isTripDetailView && styles.detailSafeArea
      ]}
      edges={['top']}
    >
      <StatusBar style="dark" />

      {showTabBar && !isExploreFilterHeaderHidden && (
        <View style={styles.appHeader}>
          <View style={styles.appHeaderInner}>
            <View style={styles.appHeaderBrand}>
              <Text style={styles.appHeaderBrandText}>
                Atlas
                <Text style={styles.appHeaderBrandTextDot}>.</Text>
              </Text>
            </View>
            {isExploreView || isProfileView || isInboxView || isSettingsView ? (
              <View style={styles.appHeaderActions}>
                <TouchableOpacity
                  style={[styles.appHeaderActionButton, styles.appHeaderActionButtonRelative]}
                  onPress={() => openTab('Inbox')}
                  activeOpacity={0.8}
                >
                  <Ionicons name={activeTab === 'Inbox' ? 'notifications' : 'notifications-outline'} size={20} color={colors.text} />
                  {inboxUnreadCount > 0 && (
                    <View style={styles.appHeaderBadge}>
                      <Text style={styles.appHeaderBadgeText}>{inboxUnreadCount > 9 ? '9+' : String(inboxUnreadCount)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.appHeaderActionButton, styles.appHeaderProfileButton]}
                  onPress={() => openTab('Profile')}
                  activeOpacity={0.8}
                >
                  <Ionicons name={activeTab === 'Profile' ? 'person' : 'person-outline'} size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.appHeaderActionButton, styles.appHeaderProfileButton]}
                  onPress={() => openTab('Settings')}
                  activeOpacity={0.8}
                >
                  <Ionicons name={activeTab === 'Settings' ? 'settings' : 'settings-outline'} size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      )}

      <View
        style={[
          styles.contentWrapper,
          isTripDetailView && styles.detailContentWrapper,
          (isExploreView || isInboxView || isProfileView || isSettingsView) && styles.tripsContentWrapper
        ]}
      >
        {selectedBoard ? (
          <View style={[styles.detailContainer, styles.tripDetailContainer, { paddingBottom: 0 }]}>
            {renderSelectedBoardContent()}
          </View>
        ) : activeTab === 'Inbox' || activeTab === 'Profile' || activeTab === 'Settings' ? (
          <View style={[styles.detailContainer, styles.tripDetailContainer, { paddingBottom: 0 }]}>
            {renderContent()}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.container,
              exploreStack && styles.exploreStackContainer,
              isExploreView && styles.exploreContainer
            ]}
            style={isExploreView ? styles.exploreScrollView : null}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        )}
        {renderCreateBoardModal()}
      </View>

      {isProfileView && !selectedBoard && !profileStack && (
        <TouchableOpacity
          style={[styles.floatingFAB, { bottom: floatingFabBottom }]}
          onPress={openNewBoard}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      )}

      {showTabBar && (
        <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomTabBarInner}>
            <TouchableOpacity style={styles.bottomTabButton} onPress={() => openTab('Explore')}>
              <Ionicons name={activeTab === 'Explore' ? 'compass' : 'compass-outline'} size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    backgroundColor: colors.background
  },
  tripsSafeArea: {
    backgroundColor: colors.background
  },
  detailSafeArea: {
    backgroundColor: colors.background
  },
  container: {
    padding: 20,
    paddingBottom: 32
  },
  tripsContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24
  },
  exploreContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    backgroundColor: colors.background
  },
  contentWrapper: {
    flex: 1,
    position: 'relative'
  },
  tripsContentWrapper: {
    backgroundColor: colors.background
  },
  detailContentWrapper: {
    backgroundColor: colors.background
  },
  tripsScrollView: {
    backgroundColor: colors.background
  },
  exploreScrollView: {
    backgroundColor: colors.background
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
    backgroundColor: '#F26B64',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center'
  },
  heroButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textMuted,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionHeaderSeeAll: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textMuted,
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
    borderRadius: 16,
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
    backgroundColor: '#F26B64',
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
  appHeader: {
    backgroundColor: colors.background,
    zIndex: 20
  },
  appHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  appHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceDeep
  },
  appHeaderBrandText: {
    fontSize: 22,
    fontFamily: 'Gaya',
    color: '#FF3C37',
    letterSpacing: -0.4
  },
  appHeaderBrandTextDot: {
    color: '#FF3C37'
  },
  appHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  appHeaderActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  appHeaderProfileButton: {
    backgroundColor: 'transparent',
  },
  appHeaderActionButtonRelative: {
    position: 'relative'
  },
  appHeaderBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(242,107,100,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 0.5,
    borderColor: '#F26B64'
  },
  appHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F26B64'
  },
  bottomTabBar: {
    backgroundColor: colors.background,
    zIndex: 20
  },
  bottomTabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: colors.background
  },
  bottomTabButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingFAB: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F26B64',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F26B64',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 30
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 15, 0.45)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
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
    backgroundColor: colors.surfaceDeep,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  modalDatePlaceholder: {
    color: colors.textMuted,
    fontWeight: '400'
  },
  modalCalendarWrap: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surfaceDeep,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  photoPickerButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoPickerPreview: {
    width: '100%',
    height: 180,
  },
  photoPickerPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceDeep,
    paddingHorizontal: 20,
  },
  photoPickerPlaceholderText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  photoPickerHelperText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  photoPickerError: {
    color: '#C9524E',
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: -6,
    marginBottom: 10,
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
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '700',
    fontFamily: fonts.bold
  },
  modalSaveButton: {
    backgroundColor: '#F26B64',
    borderWidth: 1,
    borderColor: '#F26B64'
  },
  modalSaveButtonDisabled: {
    opacity: 0.55
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: fonts.bold
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  tripDetailContainer: {
    backgroundColor: colors.background
  },
  exploreStackContainer: {
    paddingBottom: 120
  }
});

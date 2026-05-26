import { ActivityIndicator, Image, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecommendationCard } from '../components/RecommendationCard';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { formatDateRange } from '../../data/recommendations';
import { fetchBoardRecommendations } from '../../data/liveRecommendations';
import { PublicProfileView } from './ProfileScreen';

const DAY_RANGE_MIN = 1;
const DAY_RANGE_MAX = 30;
const EXPLORE_BATCH_SIZE = 8;
const PUBLIC_PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=500&q=80'
];

const FILTER_DEFAULTS = {
  country: [],
  minDays: DAY_RANGE_MIN,
  maxDays: DAY_RANGE_MAX,
  pace: [],
  travelerType: [],
  accessibility: [],
  budget: [],
  startDate: '',
  endDate: ''
};

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Cote d’Ivoire', 'Croatia', 'Cuba', 'Cyprus',
  'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala',
  'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

function uniqueValues(items, key) {
  return ['All', ...Array.from(new Set(items.map((item) => item[key]).filter(Boolean)))];
}

function parseFilterDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForInput(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getOrdinalSuffix(day) {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th';
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

function getTripDateSections(startDateValue, endDateValue) {
  const start = new Date(startDateValue);
  const end = new Date(endDateValue);
  const sections = [];
  const cursor = Number.isNaN(start.getTime()) ? new Date() : start;
  const finalDate = Number.isNaN(end.getTime()) ? cursor : end;
  cursor.setHours(0, 0, 0, 0);
  finalDate.setHours(0, 0, 0, 0);

  while (cursor <= finalDate && sections.length < 60) {
    sections.push({
      key: getDateKey(cursor),
      title: formatItineraryDate(cursor),
      date: new Date(cursor),
      places: []
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return sections.length ? sections : [{ key: getDateKey(start), title: formatItineraryDate(start), date: start, places: [] }];
}

function getPublicPlaceSectionIndex(place, placeIndex, sectionCount) {
  if (typeof place.dayIndex === 'number') return Math.min(Math.max(place.dayIndex, 0), sectionCount - 1);
  if (typeof place.day === 'number') return Math.min(Math.max(place.day - 1, 0), sectionCount - 1);
  if (place.date) {
    const placeDate = new Date(place.date);
    if (!Number.isNaN(placeDate.getTime())) return placeDate;
  }
  return Math.min(placeIndex, sectionCount - 1);
}

function getPublicProfileData(ownerName, trips, isFollowing = false) {
  const profileSeed = ownerName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const uniqueTags = Array.from(new Set(
    trips.flatMap((trip) => [trip.travelerType, trip.pace, trip.budget, trip.accessibility].filter(Boolean))
  )).slice(0, 5);
  const baseFollowers = 4200 + (profileSeed % 9000);

  return {
    image: PUBLIC_PROFILE_IMAGES[profileSeed % PUBLIC_PROFILE_IMAGES.length],
    handle: `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    bio: `Public itineraries for ${trips.map((trip) => trip.location.split(',')[0]).slice(0, 2).join(', ')} and the kind of trips you send straight to friends.`,
    followers: baseFollowers + (isFollowing ? 1 : 0),
    following: 140 + (profileSeed % 360),
    likes: trips.reduce((sum, trip) => sum + (trip.placesList?.length ?? 0), 0) + trips.length * 7,
    travelTags: uniqueTags.length > 0 ? uniqueTags : ['Foodie', 'City walks', 'Weekend escapes']
  };
}

function formatDateRangeWithYear(trip) {
  if (!trip.startDate || !trip.endDate) return `${trip.days || 3} days`;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}, ${end.getFullYear()}`;
}

function getPublicTripLikeCount(trip, isLiked = false) {
  const seed = trip.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const baseLikes = 120 + (seed % 780);
  return baseLikes + (isLiked ? 1 : 0);
}

function getFilterDateValue(filters, field) {
  const parsed = parseFilterDate(filters[field]);
  if (parsed) return parsed;
  const fallback = field === 'endDate' ? parseFilterDate(filters.startDate) : null;
  return fallback || new Date();
}

function matchesPublicTripFilters(trip, filters) {
  if (filters.country.length > 0 && !filters.country.includes(trip.country)) return false;
  const lowDays = Math.min(filters.minDays, filters.maxDays);
  const highDays = Math.max(filters.minDays, filters.maxDays);
  if (trip.days < lowDays) return false;
  if (trip.days > highDays) return false;
  if (filters.pace.length > 0 && !filters.pace.includes(trip.pace)) return false;
  if (filters.travelerType.length > 0 && !filters.travelerType.includes(trip.travelerType)) return false;
  if (filters.accessibility.length > 0 && !filters.accessibility.includes(trip.accessibility)) return false;
  if (filters.budget.length > 0 && !filters.budget.includes(trip.budget)) return false;

  const filterStart = parseFilterDate(filters.startDate);
  const filterEnd = parseFilterDate(filters.endDate);
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  if (filterStart && tripEnd < filterStart) return false;
  if (filterEnd && tripStart > filterEnd) return false;
  return true;
}

export function ExploreScreen({
  boards,
  publicTrips,
  likedPublicTripIds,
  followedProfileNames,
  onAddPublicTrip,
  onToggleLikePublicTrip,
  onToggleFollowProfile,
  onMessageProfile
}) {
  const [isFilterPageOpen, setIsFilterPageOpen] = useState(false);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [selectedPublicTrip, setSelectedPublicTrip] = useState(null);
  const [selectedOwnerName, setSelectedOwnerName] = useState(null);
  const [profileReturnTrip, setProfileReturnTrip] = useState(null);
  const [activeFilterDateField, setActiveFilterDateField] = useState(null);
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [seenTripIds, setSeenTripIds] = useState(new Set());

  useEffect(() => {
    setSelectedPublicTrip((current) => (
      current ? publicTrips.find((trip) => trip.id === current.id) ?? current : current
    ));
    setProfileReturnTrip((current) => (
      current ? publicTrips.find((trip) => trip.id === current.id) ?? current : current
    ));
  }, [publicTrips]);

  const paceOptions = useMemo(() => uniqueValues(publicTrips, 'pace'), [publicTrips]);
  const travelerTypeOptions = useMemo(() => uniqueValues(publicTrips, 'travelerType'), [publicTrips]);
  const accessibilityOptions = useMemo(() => uniqueValues(publicTrips, 'accessibility'), [publicTrips]);
  const budgetOptions = useMemo(() => uniqueValues(publicTrips, 'budget'), [publicTrips]);
  const filteredTrips = useMemo(() =>
    publicTrips
      .filter((trip) => matchesPublicTripFilters(trip, filters))
      .filter((trip) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return trip.title.toLowerCase().includes(q) || trip.location.toLowerCase().includes(q);
      }),
    [publicTrips, filters, searchQuery]
  );

  useEffect(() => {
    setSeenTripIds(new Set());
  }, [filters, searchQuery]);

  const unseenFiltered = useMemo(
    () => filteredTrips.filter((t) => !seenTripIds.has(t.id)),
    [filteredTrips, seenTripIds]
  );
  const tripsToShow = useMemo(
    () => (unseenFiltered.length > 0 ? unseenFiltered : filteredTrips).slice(0, EXPLORE_BATCH_SIZE),
    [unseenFiltered, filteredTrips]
  );

  const addedPublicTripIds = new Set(boards.map((board) => board.sourcePublicTripId).filter(Boolean));
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleCountryFilter = (country) => {
    setFilters((current) => {
      const selected = current.country.includes(country)
        ? current.country.filter((item) => item !== country)
        : [...current.country, country];
      return { ...current, country: selected };
    });
    setCountrySearch('');
    setShowCountryOptions(false);
  };
  const clearFilters = () => {
    setFilters(FILTER_DEFAULTS);
    setCountrySearch('');
    setShowCountryOptions(false);
  };
  const handleRefresh = () => {
    setSeenTripIds((prev) => {
      const next = new Set(prev);
      tripsToShow.forEach((t) => next.add(t.id));
      if (filteredTrips.every((t) => next.has(t.id))) return new Set();
      return next;
    });
  };
  const updateDayRange = (minDays, maxDays) => setFilters((current) => ({ ...current, minDays, maxDays }));
  const handleFilterDateChange = (field, _event, selectedDate) => {
    if (Platform.OS === 'android') {
      setActiveFilterDateField(null);
    }
    if (!selectedDate) return;

    const nextDate = new Date(selectedDate);
    nextDate.setHours(0, 0, 0, 0);

    setFilters((current) => {
      if (field === 'startDate') {
        const currentEnd = parseFilterDate(current.endDate);
        const next = { ...current, startDate: formatDateForInput(nextDate) };
        if (currentEnd && currentEnd < nextDate) {
          next.endDate = formatDateForInput(nextDate);
        }
        return next;
      }

      const start = parseFilterDate(current.startDate);
      const safeEnd = start && nextDate < start ? start : nextDate;
      return { ...current, endDate: formatDateForInput(safeEnd) };
    });

    if (field === 'startDate') {
      setActiveFilterDateField('endDate');
    } else {
      setActiveFilterDateField(null);
    }
  };
  const openPublicTrip = (trip) => {
    setSelectedPublicTrip(trip);
    setSelectedOwnerName(null);
    setProfileReturnTrip(null);
  };
  const openPublicProfile = (ownerName, returnTrip = null) => {
    setSelectedOwnerName(ownerName);
    setSelectedPublicTrip(null);
    setProfileReturnTrip(returnTrip);
  };
  const closePublicProfile = () => {
    if (profileReturnTrip) {
      setSelectedPublicTrip(profileReturnTrip);
    }
    setSelectedOwnerName(null);
    setProfileReturnTrip(null);
  };

  if (selectedPublicTrip) {
    return (
      <PublicTripDetail
        trip={selectedPublicTrip}
        alreadyAdded={addedPublicTripIds.has(selectedPublicTrip.id)}
        isLiked={likedPublicTripIds.includes(selectedPublicTrip.id)}
        likeCount={getPublicTripLikeCount(selectedPublicTrip, likedPublicTripIds.includes(selectedPublicTrip.id))}
        onBack={() => setSelectedPublicTrip(null)}
        onOpenProfile={() => openPublicProfile(selectedPublicTrip.ownerName, selectedPublicTrip)}
        onAddPublicTrip={onAddPublicTrip}
        onToggleLike={() => onToggleLikePublicTrip(selectedPublicTrip.id)}
      />
    );
  }

  if (selectedOwnerName) {
    const ownerTrips = publicTrips.filter((trip) => trip.ownerName === selectedOwnerName);
    return (
      <PublicProfile
        ownerName={selectedOwnerName}
        trips={ownerTrips}
        isFollowing={followedProfileNames.includes(selectedOwnerName)}
        onBack={closePublicProfile}
        onOpenTrip={openPublicTrip}
        onToggleFollow={() => onToggleFollowProfile(selectedOwnerName)}
        onMessagePress={() => onMessageProfile(selectedOwnerName)}
      />
    );
  }

  if (isFilterPageOpen) {
    return (
      <ExploreFilterScreen
        filters={filters}
        activeFilterDateField={activeFilterDateField}
        showCountryOptions={showCountryOptions}
        countrySearch={countrySearch}
        paceOptions={paceOptions}
        travelerTypeOptions={travelerTypeOptions}
        accessibilityOptions={accessibilityOptions}
        budgetOptions={budgetOptions}
        onBack={() => {
          setIsFilterPageOpen(false);
          setActiveFilterDateField(null);
          setShowCountryOptions(false);
        }}
        onUpdateFilter={updateFilter}
        onToggleCountry={toggleCountryFilter}
        onSearchCountry={(value) => {
          setCountrySearch(value);
          setShowCountryOptions(true);
        }}
        onFocusCountrySearch={() => setShowCountryOptions(true)}
        onUpdateDayRange={updateDayRange}
        onFilterDateChange={handleFilterDateChange}
        onToggleDateField={(field) => setActiveFilterDateField((current) => (current === field ? null : field))}
        onClearFilters={clearFilters}
      />
    );
  }

  return (
    <View>
      <View style={styles.exploreHeader}>
        <Text style={styles.explorePageTitle}>Explore</Text>
      </View>
      <View style={styles.exploreSearchRow}>
        <View style={styles.exploreSearchBar}>
          <Ionicons name="search-outline" size={16} color="#AAAAAA" />
          <TextInput
            style={styles.exploreSearchInput}
            placeholder="Search"
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.exploreIconGroup}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterPageOpen(true)}>
            <Ionicons name="funnel-outline" size={22} color="#AAAAAA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={handleRefresh}>
            <Ionicons name="swap-vertical-outline" size={22} color="#AAAAAA" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.publicTripMasonry}>
        {[0, 1].map((column) => (
          <View key={column} style={styles.publicTripMasonryColumn}>
            {tripsToShow
              .filter((_, index) => index % 2 === column)
              .map((trip, index) => (
                <PublicTripCard
                  key={trip.id}
                  trip={trip}
                  variantIndex={index * 2 + column}
                  onOpenTrip={() => openPublicTrip(trip)}
                  onOpenProfile={() => openPublicProfile(trip.ownerName)}
                />
              ))}
          </View>
        ))}
      </View>

      {tripsToShow.length === 0 && (
        <View style={styles.emptyPublicTrips}>
          <Text style={styles.emptyPublicTripsText}>No public trips match these filters.</Text>
        </View>
      )}
    </View>
  );
}

function PublicTripCard({ trip, onOpenTrip, onOpenProfile, variantIndex = 0 }) {
  const imageHeights = [100, 80, 110, 85, 95, 80];
  const imageHeight = imageHeights[variantIndex % imageHeights.length];

  return (
    <View style={styles.publicTripCard}>
      <TouchableOpacity activeOpacity={0.88} onPress={onOpenTrip}>
        <Image source={{ uri: trip.image }} style={[styles.publicTripImage, { height: imageHeight }]} />
      </TouchableOpacity>
      <View style={styles.publicTripBody}>
        <TouchableOpacity onPress={onOpenTrip} activeOpacity={0.85}>
          <Text style={styles.publicTripTitle} numberOfLines={2}>{trip.title}</Text>
          <Text style={styles.publicTripMeta} numberOfLines={2}>{trip.location}</Text>
          <Text style={styles.publicTripDates} numberOfLines={1}>{formatDateRange(trip)}</Text>
          {trip.description ? <Text style={styles.publicTripDescription} numberOfLines={3}>{trip.description}</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenProfile} style={styles.publicTripOwnerButton}>
          <Text style={styles.publicTripOwner} numberOfLines={1}>By {trip.ownerName}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExploreFilterScreen({
  filters,
  activeFilterDateField,
  showCountryOptions,
  countrySearch,
  paceOptions,
  travelerTypeOptions,
  accessibilityOptions,
  budgetOptions,
  onBack,
  onUpdateFilter,
  onToggleCountry,
  onSearchCountry,
  onFocusCountrySearch,
  onUpdateDayRange,
  onFilterDateChange,
  onToggleDateField,
  onClearFilters
}) {
  return (
    <View style={styles.exploreSubScreen}>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={[styles.exploreSubHeaderText, styles.filterSubHeaderText]}>
          <Text style={styles.exploreSubTitle}>Filters</Text>
        </View>
      </View>

      <View style={styles.filterPanel}>
        <Text style={styles.filterLabel}>Dates</Text>
        <View style={styles.filterDateRow}>
          <FilterDateButton
            label="From"
            value={filters.startDate}
            active={activeFilterDateField === 'startDate'}
            onPress={() => onToggleDateField('startDate')}
          />
          <FilterDateButton
            label="To"
            value={filters.endDate}
            active={activeFilterDateField === 'endDate'}
            onPress={() => onToggleDateField('endDate')}
          />
        </View>
        {activeFilterDateField === 'startDate' && (
          <View style={styles.filterCalendarWrap}>
            <DateTimePicker
              value={getFilterDateValue(filters, 'startDate')}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => onFilterDateChange('startDate', event, selectedDate)}
              style={styles.inlineCalendar}
            />
          </View>
        )}
        {activeFilterDateField === 'endDate' && (
          <View style={styles.filterCalendarWrap}>
            <DateTimePicker
              value={getFilterDateValue(filters, 'endDate')}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={parseFilterDate(filters.startDate) || undefined}
              onChange={(event, selectedDate) => onFilterDateChange('endDate', event, selectedDate)}
              style={styles.inlineCalendar}
            />
          </View>
        )}

        <CountryMultiSelect
          selectedCountries={filters.country}
          searchValue={countrySearch}
          showOptions={showCountryOptions}
          onSearchChange={onSearchCountry}
          onFocusSearch={onFocusCountrySearch}
          onToggleCountry={onToggleCountry}
        />
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Trip length</Text>
          <DaysRangeSlider
            minValue={DAY_RANGE_MIN}
            maxValue={DAY_RANGE_MAX}
            valueMin={filters.minDays}
            valueMax={filters.maxDays}
            onChange={onUpdateDayRange}
          />
        </View>
        <FilterChips label="Traveler type" options={travelerTypeOptions} value={filters.travelerType} onChange={(value) => onUpdateFilter('travelerType', value)} />
        <FilterChips label="Budget" options={budgetOptions} value={filters.budget} onChange={(value) => onUpdateFilter('budget', value)} />
        <FilterChips label="Traveler pace" options={paceOptions} value={filters.pace} onChange={(value) => onUpdateFilter('pace', value)} />
        <FilterChips label="Accessibility" options={accessibilityOptions} value={filters.accessibility} onChange={(value) => onUpdateFilter('accessibility', value)} />

        <TouchableOpacity style={styles.clearFiltersButton} onPress={onClearFilters}>
          <Text style={styles.clearFiltersText}>Clear filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FilterDateButton({ label, value, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.filterDateButton, active && styles.filterDateButtonActive]} onPress={onPress} activeOpacity={0.78}>
      <Text style={styles.filterDateButtonLabel}>{label}</Text>
      <Text style={[styles.filterDateButtonText, !value && styles.filterDatePlaceholder]}>{value || 'DD/MM/YYYY'}</Text>
    </TouchableOpacity>
  );
}

function PublicTripTags({ trip }) {
  return (
    <View style={styles.publicTripTagRow}>
      {[trip.travelerType, trip.budget, trip.pace, trip.accessibility].filter(Boolean).map((tag) => (
        <View key={tag} style={styles.publicTripTag}>
          <Text style={styles.publicTripTagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function CountryMultiSelect({
  selectedCountries,
  searchValue,
  showOptions,
  onSearchChange,
  onFocusSearch,
  onToggleCountry
}) {
  const visibleCountries = COUNTRY_OPTIONS.filter((country) =>
    country.toLowerCase().includes(searchValue.trim().toLowerCase())
  ).slice(0, 18);

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>Country</Text>
      <TextInput
        style={styles.countrySearchInput}
        placeholder="Search country"
        value={searchValue}
        onChangeText={onSearchChange}
        onFocus={onFocusSearch}
        placeholderTextColor="#AAAAAA"
      />

      {selectedCountries.length > 0 && (
        <View style={styles.selectedCountryRow}>
          {selectedCountries.map((country) => (
            <TouchableOpacity key={country} style={styles.selectedCountryBubble} onPress={() => onToggleCountry(country)}>
              <Text style={styles.selectedCountryBubbleText}>{country} x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showOptions && (
        <View style={styles.countryDropdownPanel}>
          <View style={styles.countryOptionList}>
            {visibleCountries.map((country) => {
              const selected = selectedCountries.includes(country);
              return (
                <TouchableOpacity
                  key={country}
                  style={[styles.countryOption, selected && styles.countryOptionSelected]}
                  onPress={() => onToggleCountry(country)}
                >
                  <Text style={[styles.countryOptionText, selected && styles.countryOptionTextSelected]}>{country}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function DaysRangeSlider({ minValue, maxValue, valueMin, valueMax, onChange }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [activeThumb, setActiveThumb] = useState(null);
  const activeThumbRef = useRef(null);
  const range = Math.max(1, maxValue - minValue);
  const lowerValue = Math.min(valueMin, valueMax);
  const upperValue = Math.max(valueMin, valueMax);
  const minPosition = trackWidth * ((lowerValue - minValue) / range);
  const maxPosition = trackWidth * ((upperValue - minValue) / range);

  const positionToValue = (position) => {
    const clampedPosition = Math.max(0, Math.min(position, trackWidth));
    return Math.round((clampedPosition / Math.max(1, trackWidth)) * range + minValue);
  };
  const updateRangeFromPosition = (position, thumb = activeThumbRef.current || activeThumb) => {
    const selectedThumb = thumb || (Math.abs(position - minPosition) <= Math.abs(position - maxPosition) ? 'min' : 'max');
    const nextValue = Math.min(positionToValue(position), upperValue);
    const nextUpperValue = Math.max(positionToValue(position), lowerValue);

    if (selectedThumb === 'min') {
      onChange(nextValue, upperValue);
      return selectedThumb;
    }

    onChange(lowerValue, nextUpperValue);
    return selectedThumb;
  };
  const handleRangeGrant = (event) => {
    const position = event.nativeEvent.locationX;
    const selectedThumb = Math.abs(position - minPosition) <= Math.abs(position - maxPosition) ? 'min' : 'max';
    activeThumbRef.current = selectedThumb;
    setActiveThumb(selectedThumb);
    updateRangeFromPosition(position, selectedThumb);
  };
  const handleRangeMove = (event) => {
    updateRangeFromPosition(event.nativeEvent.locationX);
  };
  const clearActiveThumb = () => {
    activeThumbRef.current = null;
    setActiveThumb(null);
  };

  return (
    <View style={styles.daysRangeContainer}>
      <Text style={styles.daysRangeValue}>
        {lowerValue === upperValue ? `${lowerValue} days` : `${lowerValue} - ${upperValue} days`}
      </Text>
      <View
        style={styles.daysRangeTrackWrap}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderGrant={handleRangeGrant}
        onResponderMove={handleRangeMove}
        onResponderRelease={clearActiveThumb}
        onResponderTerminate={clearActiveThumb}
        onResponderTerminationRequest={() => false}
      >
        <View style={styles.daysRangeTrack} />
        <View
          style={[
            styles.daysRangeFill,
            {
              left: minPosition,
              width: Math.max(0, maxPosition - minPosition)
            }
          ]}
        />
        <View pointerEvents="none" style={[styles.daysRangeThumb, styles.daysRangeThumbMin, { left: Math.max(0, Math.min(trackWidth - 20, minPosition - 10)) }]} />
        <View pointerEvents="none" style={[styles.daysRangeThumb, styles.daysRangeThumbMax, { left: Math.max(0, Math.min(trackWidth - 20, maxPosition - 10)) }]} />
      </View>
      <View style={styles.daysRangeEndLabels}>
        <Text style={styles.daysRangeEndLabel}>{minValue}</Text>
        <Text style={styles.daysRangeEndLabel}>{maxValue}</Text>
      </View>
    </View>
  );
}

function PublicTripDetail({
  trip,
  alreadyAdded,
  isLiked,
  likeCount,
  onBack,
  onOpenProfile,
  onAddPublicTrip,
  onToggleLike
}) {
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const itinerarySections = getTripDateSections(trip.startDate, trip.endDate);
  (trip.placesList ?? []).forEach((place, index) => {
    const target = getPublicPlaceSectionIndex(place, index, itinerarySections.length);
    if (target instanceof Date) {
      const matchingIndex = itinerarySections.findIndex((section) => section.key === getDateKey(target));
      itinerarySections[matchingIndex >= 0 ? matchingIndex : 0].places.push(place);
      return;
    }
    itinerarySections[target].places.push(place);
  });

  return (
    <View style={styles.publicDetailScreen}>
      <View style={styles.publicDetailCard}>
        <View style={styles.publicDetailHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.backButton, styles.publicDetailBackButton]}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleLike} style={[styles.publicHeartButton, styles.publicDetailHeaderAction]}>
            <Text style={[styles.publicHeartButtonText, isLiked && styles.publicHeartButtonTextActive]}>
              {isLiked ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.publicProfileInline}>
          <TouchableOpacity onPress={onOpenProfile} style={styles.publicProfilePressable}>
            <Image
              source={{ uri: PUBLIC_PROFILE_IMAGES[trip.ownerName.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % PUBLIC_PROFILE_IMAGES.length] }}
              style={styles.publicProfileAvatarImage}
            />
            <View style={styles.publicProfileTextWrap}>
              <Text style={styles.publicProfileName} numberOfLines={1}>{trip.ownerName}</Text>
              <Text style={styles.publicProfileSubtext} numberOfLines={1}>View public profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.publicDetailTitleGroup}>
          <Text style={styles.publicDetailTitle} numberOfLines={2}>{trip.title}</Text>
          {trip.location ? <Text style={styles.publicDetailLocation}>{trip.location}</Text> : null}
          <Text style={styles.publicDetailMeta}>{formatDateRangeWithYear(trip)}</Text>
        </View>

        <Image source={{ uri: trip.image }} style={styles.publicDetailImage} />

        {trip.description ? <Text style={styles.publicDetailDescription}>{trip.description}</Text> : null}

        <PublicTripTags trip={trip} />

        <View style={styles.publicDetailItineraryHead}>
          <Text style={styles.publicDetailSectionTitle}>Itinerary</Text>
        </View>
        {itinerarySections.map((section, index) => (
          <View key={section.key} style={styles.publicItineraryDaySection}>
            <View style={styles.publicItineraryDayRail}>
              <View style={styles.publicItineraryDayDot} />
              {index < itinerarySections.length - 1 && <View style={styles.publicItineraryDayLine} />}
            </View>
            <View style={styles.publicItineraryDayContent}>
              <Text style={styles.publicItineraryDayTitle}>{section.title}</Text>
              {section.places.length === 0 && <Text style={styles.publicItineraryEmpty}>No plans yet.</Text>}
              {section.places.length > 0 && (
                <View style={styles.publicPlaceGroup}>
                  <BlurView intensity={28} tint="extraLight" style={styles.publicPlaceGroupGlass} />
                  {section.places.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.publicPlaceRow}
                      activeOpacity={0.82}
                      onPress={() => setSelectedPlaceDetail({ place, dateLabel: section.title })}
                    >
                      <Text style={styles.publicPlaceName}>{place.name}</Text>
                      {place.note && <Text style={styles.publicPlaceNote}>{place.note}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addPublicTripButton, styles.publicDetailAddButton, alreadyAdded && styles.addPublicTripButtonDone]}
          onPress={() => onAddPublicTrip(trip)}
          disabled={alreadyAdded}
        >
          <Text style={styles.addPublicTripButtonText}>{alreadyAdded ? 'Added to my trips' : 'Add to my trips'}</Text>
        </TouchableOpacity>
      </View>

      <PlaceDetailModal
        visible={Boolean(selectedPlaceDetail)}
        place={selectedPlaceDetail?.place}
        tripTitle={trip.title}
        location={trip.location}
        dateLabel={selectedPlaceDetail?.dateLabel}
        fallbackImage={trip.image}
        onClose={() => setSelectedPlaceDetail(null)}
      />
    </View>
  );
}

function PublicProfile({ ownerName, trips, isFollowing, onBack, onOpenTrip, onToggleFollow, onMessagePress }) {
  const profile = getPublicProfileData(ownerName, trips, isFollowing);

  return (
    <View>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>
      <PublicProfileView
        name={ownerName}
        handle={profile.handle}
        bio={profile.bio}
        image={profile.image}
        followers={profile.followers}
        following={profile.following}
        likes={profile.likes}
        travelTags={profile.travelTags}
        publicBoards={trips}
        onOpenBoard={onOpenTrip}
        showFollowButton
        showMessageButton
        isFollowing={isFollowing}
        onToggleFollow={onToggleFollow}
        onMessagePress={onMessagePress}
      />
    </View>
  );
}

function FilterChips({ label, options, value, onChange, compact = false }) {
  const isAll = value.length === 0;

  const handlePress = (option) => {
    if (option === 'All') {
      onChange([]);
      return;
    }
    const next = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(next);
  };

  return (
    <View style={!compact && styles.filterGroup}>
      {label && <Text style={styles.filterLabel}>{label}</Text>}
      <View style={[styles.filterChipRow, compact && styles.filterChipRowCompact]}>
        {options.map((option) => {
          const isActive = option === 'All' ? isAll : value.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => handlePress(option)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function ExploreMoreScreen({ board, onBack }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [sourceMeta, setSourceMeta] = useState({
    usedFallback: false,
    usedMockData: false,
    providersUsed: [],
    error: '',
    hasMore: true
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const hasSearched = Boolean(activeSearchQuery);
  const insets = useSafeAreaInsets();
  const tabBarHeight = 8 + 44 + Math.max(insets.bottom, 6) + 8;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const runSearch = async () => {
    const trimmedSearchQuery = searchInput.trim();
    if (!trimmedSearchQuery) {
      setActiveSearchQuery('');
      setRecommendations([]);
      setSourceMeta({
        usedFallback: false,
        usedMockData: false,
        providersUsed: [],
        error: '',
        hasMore: true
      });
      return;
    }

    Keyboard.dismiss();
    setSearchInput('');
    setIsLoading(true);
    setActiveSearchQuery(trimmedSearchQuery);

    let result = await fetchBoardRecommendations(board, { searchQuery: trimmedSearchQuery });
    let remainingBatches = 8;
    const seenProviders = new Set((result.meta.providersUsed || []).filter((p) => p !== 'mock'));

    while (result.meta.hasMore && remainingBatches > 0) {
      result = await fetchBoardRecommendations(board, { loadMore: true, searchQuery: trimmedSearchQuery });
      remainingBatches -= 1;
      (result.meta.providersUsed || []).filter((p) => p !== 'mock').forEach((p) => seenProviders.add(p));
    }

    const allProviders = seenProviders.size > 0 ? Array.from(seenProviders) : ['mock'];
    setRecommendations(result.recommendations);
    setSourceMeta({ ...result.meta, providersUsed: allProviders, usedMockData: seenProviders.size === 0 });
    setIsLoading(false);
  };

  const bottomMargin = Platform.OS === 'ios' && keyboardHeight > 0
    ? keyboardHeight - tabBarHeight + 12
    : 16;

  return (
    <View style={[styles.exploreSubScreen, { flex: 1, paddingBottom: 0 }]}>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.exploreSubHeaderText}>
          <Text style={styles.exploreSubTitle}>{board.title}</Text>
          {board.location ? (
            <Text style={[styles.exploreSubMeta, { color: '#887462', marginBottom: 2, marginTop: 2 }]}>
              {board.location}
            </Text>
          ) : null}
          <Text style={styles.exploreSubMeta}>
            {hasSearched ? `${formatDateRange(board)} · ${recommendations.length} activities` : formatDateRange(board)}
          </Text>
          {hasSearched && sourceMeta.providersUsed?.length ? (
            <Text style={styles.recommendationSourceMeta}>
              {`Live from ${sourceMeta.providersUsed
                .map((p) => ({ geoapify: 'Geoapify', wikipedia: 'Wikipedia', opentripmap: 'OpenTripMap', ticketmaster: 'Ticketmaster', foursquare: 'Foursquare', google: 'Google', tripadvisor: 'Tripadvisor', yelp: 'Yelp', mock: 'mock data' }[p] ?? p))
                .join(', ')}.`}
            </Text>
          ) : null}
          {hasSearched && sourceMeta.error ? (
            <Text style={styles.recommendationErrorMeta}>
              {sourceMeta.error}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.recommendationsListContainer}
        contentContainerStyle={styles.recommendationsListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasSearched ? (
          <View style={styles.userQueryBubbleRow}>
            <View style={styles.userQueryBubble}>
              <Text style={styles.userQueryBubbleText}>{activeSearchQuery}</Text>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.recommendationStateCard}>
            <ActivityIndicator color="#A97C50" />
            <Text style={styles.recommendationStateText}>Finding {activeSearchQuery.toLowerCase()}...</Text>
          </View>
        ) : null}

        {!isLoading && !hasSearched ? (
          <View style={styles.recommendationStateCard}>
            <Text style={styles.recommendationStateText}>
              Start with a search like museums, cafes, shopping, or concerts.
            </Text>
          </View>
        ) : null}

        {!isLoading && hasSearched && !recommendations.length ? (
          <View style={styles.recommendationStateCard}>
            <Text style={styles.recommendationStateText}>{`No results yet for "${activeSearchQuery}".`}</Text>
          </View>
        ) : null}

        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onPress={(item) => setSelectedRecommendation(item)} />
        ))}
      </ScrollView>

      <View style={[styles.recommendationSearchComposer, { marginBottom: bottomMargin }]}>
        <Text style={styles.recommendationSearchLabel}>What are we looking for?</Text>
        <View style={styles.recommendationSearchRow}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Museums, cafes, shopping, concerts..."
            placeholderTextColor="#B1A294"
            style={styles.recommendationSearchInput}
            returnKeyType="search"
            onSubmitEditing={runSearch}
          />
          <TouchableOpacity
            onPress={runSearch}
            style={[styles.recommendationSearchButton, !searchInput.trim() && styles.recommendationSearchButtonDisabled]}
            disabled={!searchInput.trim()}
          >
            <Text style={styles.recommendationSearchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PlaceDetailModal
        visible={Boolean(selectedRecommendation)}
        place={selectedRecommendation}
        tripTitle={board.title}
        location={board.location}
        dateLabel={selectedRecommendation?.dayLabel}
        fallbackImage={board.image}
        onClose={() => setSelectedRecommendation(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12
  },
  explorePageTitle: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800',
    textTransform: 'lowercase',
    marginLeft: 12
  },
  exploreSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 0,
    paddingRight: 10
  },
  exploreIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10
  },
  exploreSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginLeft: 6
  },
  exploreSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif', default: 'System' }),
    includeFontPadding: false
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    padding: 18,
    marginBottom: 16
  },
  filterGroup: {
    marginTop: 20
  },
  filterLabel: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10
  },
  filterDateRow: {
    flexDirection: 'row',
    gap: 10
  },
  filterDateButton: {
    flex: 1,
    backgroundColor: '#F3F3F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  filterDateButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8B8B2'
  },
  filterDateButtonLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
    marginBottom: 3
  },
  filterDateButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700'
  },
  filterDatePlaceholder: {
    color: '#AAAAAA',
    fontWeight: '400'
  },
  filterCalendarWrap: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 10
  },
  inlineCalendar: {
    width: Platform.OS === 'ios' ? '108%' : '100%',
    alignSelf: 'center',
    transform: Platform.OS === 'ios' ? [{ scale: 0.92 }] : [],
    marginVertical: Platform.OS === 'ios' ? -12 : 0
  },
  selectedCountryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  selectedCountryBubble: {
    backgroundColor: '#F3F3F1',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  selectedCountryBubbleText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700'
  },
  countryDropdownPanel: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    padding: 10
  },
  countrySearchInput: {
    backgroundColor: '#F3F3F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111111',
    marginBottom: 0
  },
  countryOptionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  countryOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    backgroundColor: '#F3F3F1',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  countryOptionSelected: {
    backgroundColor: '#E8E8E8',
    borderColor: '#B8B8B2'
  },
  countryOptionText: {
    color: '#575757',
    fontSize: 12,
    fontWeight: '700'
  },
  countryOptionTextSelected: {
    color: '#111111'
  },
  daysRangeContainer: {
    backgroundColor: '#F3F3F1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10
  },
  daysRangeValue: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 18
  },
  daysRangeTrackWrap: {
    width: '100%',
    height: 28,
    justifyContent: 'center'
  },
  daysRangeTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(215,215,210,0.95)'
  },
  daysRangeFill: {
    position: 'absolute',
    top: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#B8B8B2'
  },
  daysRangeThumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#555555',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
  daysRangeThumbMin: {
    zIndex: 2
  },
  daysRangeThumbMax: {
    zIndex: 3
  },
  daysRangeEndLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  daysRangeEndLabel: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '700'
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterChipRowCompact: {
    marginBottom: 4
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#F3F3F1',
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipActive: {
    backgroundColor: '#E8E8E8',
    borderColor: '#B8B8B2'
  },
  filterChipText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '700'
  },
  filterChipTextActive: {
    color: '#111111'
  },
  clearFiltersButton: {
    marginTop: 22,
    alignItems: 'center',
    paddingVertical: 10
  },
  clearFiltersText: {
    color: '#555555',
    fontWeight: '700'
  },
  publicTripMasonry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  publicTripMasonryColumn: {
    flex: 1,
    gap: 14
  },
  publicTripCard: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  publicTripImage: {
    width: '100%',
    backgroundColor: '#F3F3F1'
  },
  publicTripBody: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 10
  },
  publicTripTitle: {
    fontSize: 19,
    lineHeight: 24,
    color: '#111111',
    marginBottom: 3,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'sans-serif-medium', default: 'System' }),
    fontWeight: '800',
    textTransform: 'lowercase'
  },
  publicTripDates: {
    fontSize: 12,
    lineHeight: 16,
    color: '#7A7A7A',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif', default: 'System' }),
    fontWeight: '400'
  },
  publicTripDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: '#9A9A9A',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif', default: 'System' }),
    fontWeight: '400'
  },
  publicTripOwner: {
    color: '#575757',
    fontSize: 11,
    fontWeight: '600'
  },
  publicTripOwnerButton: {
    alignSelf: 'flex-start',
    marginTop: 10
  },
  publicTripMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: '#575757',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif', default: 'System' }),
    fontWeight: Platform.OS === 'ios' ? '600' : '500'
  },
  publicTripTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginBottom: 12
  },
  publicTripTag: {
    backgroundColor: '#F3F3F1',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  publicTripTagText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  addPublicTripButton: {
    backgroundColor: '#F3F3F1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,215,210,0.95)',
    paddingVertical: 13,
    alignItems: 'center'
  },
  addPublicTripButtonDone: {
    backgroundColor: '#F3F3F1',
    borderColor: '#DEDEDA'
  },
  addPublicTripButtonText: {
    color: '#111111',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  emptyPublicTrips: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 18,
    alignItems: 'center'
  },
  emptyPublicTripsText: {
    color: '#7F7063',
    fontWeight: '700'
  },
  publicDetailScreen: {
    backgroundColor: '#F3F3F1'
  },
  publicDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  publicDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  publicDetailBackButton: {
    marginLeft: 0,
    paddingHorizontal: 0
  },
  publicDetailHeaderAction: {
    marginRight: 0,
    paddingHorizontal: 0
  },
  publicDetailTitleGroup: {
    marginBottom: 16
  },
  publicDetailTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800',
    color: '#111111',
    textTransform: 'lowercase'
  },
  publicDetailLocation: {
    color: '#575757',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginTop: 4
  },
  publicDetailImage: {
    width: '100%',
    height: 176,
    borderRadius: 18,
    marginBottom: 16
  },
  publicProfileInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10
  },
  publicProfilePressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0
  },
  publicProfileAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19
  },
  publicProfileTextWrap: {
    flex: 1,
    minWidth: 0
  },
  publicProfileName: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  publicProfileSubtext: {
    marginTop: 2,
    color: '#575757',
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  publicHeartButton: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginRight: 6,
    height: 36
  },
  publicHeartButtonText: {
    color: '#CCCCCC',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500'
  },
  publicHeartButtonTextActive: {
    color: '#FF3B30'
  },
  publicHeartCount: {
    marginTop: 1,
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '400'
  },
  publicHeartCountActive: {
    color: '#FF3B30'
  },
  publicDetailMeta: {
    color: '#6F6F6B',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginTop: 4
  },
  publicDetailDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6F6F6B',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    }),
    marginBottom: 12,
    textAlign: 'center'
  },
  publicDetailItineraryHead: {
    marginTop: 4,
    marginBottom: 12
  },
  publicDetailSectionTitle: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800'
  },
  publicItineraryDaySection: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  publicItineraryDayRail: {
    width: 24,
    alignItems: 'center'
  },
  publicItineraryDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B8B8B2',
    marginTop: 6
  },
  publicItineraryDayLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E1E1DC',
    marginTop: 4
  },
  publicItineraryDayContent: {
    flex: 1,
    paddingBottom: 10
  },
  publicItineraryDayTitle: {
    marginBottom: 14,
    color: '#111111',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: '800'
  },
  publicItineraryEmpty: {
    color: '#6F6F6B',
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  publicPlaceGroup: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent'
  },
  publicPlaceGroupGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243,243,241,0.88)'
  },
  publicPlaceRow: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  publicPlaceName: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    }),
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  publicPlaceNote: {
    marginTop: 4,
    color: '#6F6F6B',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  publicDetailAddButton: {
    marginTop: 4
  },
  publicProfileHeader: {
    backgroundColor: '#FFF8F0',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  publicProfileAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F2D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  publicProfileAvatarLargeText: {
    color: '#A97C50',
    fontSize: 30,
    fontWeight: '800'
  },
  publicProfileHeaderName: {
    color: '#4B3A32',
    fontSize: 22,
    fontWeight: '800'
  },
  publicProfileBio: {
    marginTop: 6,
    color: '#7F7063',
    fontSize: 14,
    textAlign: 'center'
  },
  exploreSubScreen: {
    paddingBottom: 24
  },
  exploreSubScreenEmpty: {
    minHeight: 720,
    justifyContent: 'space-between'
  },
  exploreSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 0,
    marginLeft: 8,
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
  exploreSubHeaderText: {
    flex: 1
  },
  publicDetailHeaderText: {
    alignItems: 'flex-end'
  },
  filterSubHeaderText: {
    alignItems: 'flex-end',
    paddingRight: 10
  },
  exploreSubTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    textTransform: 'lowercase',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  publicDetailHeaderTitle: {
    textAlign: 'right'
  },
  exploreSubMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#7F7063'
  },
  recommendationSourceMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#A97C50',
    lineHeight: 18
  },
  recommendationFallbackMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#A8998A',
    lineHeight: 18
  },
  recommendationErrorMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18
  },
  recommendationStateCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16
  },
  recommendationStateText: {
    color: '#7F7063',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  recommendationSearchComposer: {
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 14
  },
  recommendationSearchLabel: {
    color: '#7F7063',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10
  },
  recommendationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  recommendationSearchInput: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#F1E7DA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    paddingHorizontal: 14,
    color: '#4B3A32',
    fontSize: 14
  },
  recommendationSearchButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#E6A6B3',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recommendationSearchButtonDisabled: {
    backgroundColor: '#DCC8CC'
  },
  recommendationSearchButtonText: {
    color: '#FFF8F0',
    fontSize: 13,
    fontWeight: '800'
  },
  keyboardAvoidingContainer: {
    flex: 1
  },
  recommendationsListContainer: {
    flex: 1
  },
  recommendationsListContent: {
    paddingBottom: 16
  },
  userQueryBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    marginTop: 4
  },
  userQueryBubble: {
    maxWidth: '82%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E6A6B3',
    borderWidth: 1,
    borderColor: '#DCC8CC'
  },
  userQueryBubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFF8F0',
    fontWeight: '600'
  }
});

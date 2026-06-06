import { ActivityIndicator, Image, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecommendationGroup } from '../components/RecommendationCard';
import { PlaceDetailModal } from '../components/PlaceDetailModal';
import { formatDateRange } from '../../data/recommendations';
import { fetchBoardRecommendations } from '../../data/liveRecommendations';
import { PublicProfileView } from './ProfileScreen';
import { colors, fonts, radius, shadow } from '../theme';

const DAY_RANGE_MIN = 1;
const DAY_RANGE_MAX = 30;
const EXPLORE_TAG_COLORS = [
  { bg: 'rgba(184,206,232,0.30)', text: '#B8CEE8' },
  { bg: 'rgba(211,182,211,0.30)', text: '#D3B6D3' },
  { bg: 'rgba(109,184,190,0.40)', text: '#6DB8BE' },
  { bg: 'rgba(165,187,26,0.30)', text: '#A5BB1A' },
];
const ACTIVITY_ICON_COLORS = [
  { bg: 'rgba(184,206,232,0.30)', icon: '#B8CEE8' },
  { bg: 'rgba(211,182,211,0.30)', icon: '#D3B6D3' },
  { bg: 'rgba(109,184,190,0.40)', icon: '#6DB8BE' },
  { bg: 'rgba(165,187,26,0.30)', icon: '#A5BB1A' },
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

function parsePublicItineraryTimeValue(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatPublicItineraryTimeValue(value) {
  const totalMinutes = parsePublicItineraryTimeValue(value);
  if (totalMinutes === null) return value || '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getPublicFallbackItineraryTime(index) {
  const totalMinutes = 9 * 60 + index * 120;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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

function getExploreAccent(index = 0) {
  return EXPLORE_TAG_COLORS[((index % EXPLORE_TAG_COLORS.length) + EXPLORE_TAG_COLORS.length) % EXPLORE_TAG_COLORS.length];
}

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

function formatItineraryChipWeekday(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
}

function formatItineraryChipMonth(date) {
  return date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
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
  const baseFollowers = 4200 + (profileSeed % 9000);

  return {
    image: null,
    handle: `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    bio: `Public itineraries for ${trips.map((trip) => trip.location.split(',')[0]).slice(0, 2).join(', ')} and the kind of trips you send straight to friends.`,
    followers: baseFollowers + (isFollowing ? 1 : 0),
    following: 140 + (profileSeed % 360),
    likes: trips.reduce((sum, trip) => sum + (trip.placesList?.length ?? 0), 0) + trips.length * 7
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
  onMessageProfile,
  onFilterPageVisibilityChange
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

  useEffect(() => {
    onFilterPageVisibilityChange?.(isFilterPageOpen || Boolean(selectedPublicTrip));
    return () => onFilterPageVisibilityChange?.(false);
  }, [isFilterPageOpen, selectedPublicTrip, onFilterPageVisibilityChange]);

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

  const tripsToShow = filteredTrips;

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
        <Text style={styles.explorePageTitle}>Discover Trips</Text>
        <Text style={styles.explorePageSubtitle}>Browse journeys shared by travelers</Text>
      </View>
      <View style={styles.exploreSearchRow}>
        <View style={styles.exploreSearchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.exploreSearchInput}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterPageOpen(true)}>
          <Ionicons name="funnel-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.publicTripMasonry}>
        {[0, 1].map((column) => (
          <View key={column} style={styles.publicTripMasonryColumn}>
            {tripsToShow
              .filter((_, index) => index % 2 === column)
              .map((trip) => (
                <PublicTripCard
                  key={trip.id}
                  trip={trip}
                  isLiked={likedPublicTripIds.includes(trip.id)}
                  onToggleLike={() => onToggleLikePublicTrip(trip.id)}
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

function PublicTripCard({ trip, onOpenTrip, onOpenProfile, isLiked, onToggleLike }) {
  return (
    <View style={styles.publicTripCard}>
      <TouchableOpacity activeOpacity={0.88} onPress={onOpenTrip} style={styles.publicTripImageWrap}>
        {trip.image
          ? <Image source={typeof trip.image === 'number' ? trip.image : { uri: trip.image }} style={styles.publicTripImage} />
          : <View style={[styles.publicTripImage, styles.publicTripImagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color="#d4cfc9" />
            </View>
        }
      </TouchableOpacity>
      <View style={styles.publicTripBody}>
        <Text style={styles.publicTripTitle} numberOfLines={2}>{trip.title}</Text>
        {trip.location ? <Text style={styles.publicTripMeta} numberOfLines={1}>{trip.location}</Text> : null}
        <Text style={styles.publicTripDates} numberOfLines={1}>{formatDateRangeWithYear(trip)}</Text>
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
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
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
  const [selectedPublicItineraryDayIndex, setSelectedPublicItineraryDayIndex] = useState(0);
  const itinerarySections = getTripDateSections(trip.startDate, trip.endDate);
  const locationAccent = getExploreAccent(
    trip.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  );
  (trip.placesList ?? []).forEach((place, index) => {
    const target = getPublicPlaceSectionIndex(place, index, itinerarySections.length);
    if (target instanceof Date) {
      const matchingIndex = itinerarySections.findIndex((section) => section.key === getDateKey(target));
      itinerarySections[matchingIndex >= 0 ? matchingIndex : 0].places.push(place);
      return;
    }
    itinerarySections[target].places.push(place);
  });
  const safeSelectedPublicItineraryDayIndex = Math.min(
    Math.max(selectedPublicItineraryDayIndex, 0),
    Math.max(itinerarySections.length - 1, 0)
  );
  const selectedPublicItinerarySection =
    itinerarySections[safeSelectedPublicItineraryDayIndex] ?? itinerarySections[0] ?? null;

  useEffect(() => {
    if (selectedPublicItineraryDayIndex !== safeSelectedPublicItineraryDayIndex) {
      setSelectedPublicItineraryDayIndex(safeSelectedPublicItineraryDayIndex);
    }
  }, [safeSelectedPublicItineraryDayIndex, selectedPublicItineraryDayIndex]);

  return (
    <View style={styles.publicDetailScreen}>
      <ScrollView
        contentContainerStyle={styles.publicDetailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.publicDetailHeroSection}>
          {trip.image ? (
            <Image source={typeof trip.image === 'number' ? trip.image : { uri: trip.image }} style={[styles.publicDetailHeroImage, { width: '100%', height: '100%', objectFit: 'cover' }]} />
          ) : (
            <View style={styles.publicDetailHeroPlaceholder}>
              <Ionicons name="airplane-outline" size={64} color="rgba(255,255,255,0.35)" />
            </View>
          )}
          <View style={styles.publicDetailHeroGradient} />
          <TouchableOpacity onPress={onBack} style={styles.publicDetailHeroBackBtn} activeOpacity={0.8}>
            <View style={styles.publicDetailHeroBtnInner}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>
          <View style={styles.publicDetailHeroInfoCard}>
            <BlurView intensity={22} tint="light" style={styles.publicDetailHeroInfoCardBlur}>
              <Text style={styles.publicDetailHeroInfoTitle} numberOfLines={2}>{trip.title}</Text>
              <Text style={styles.publicDetailHeroInfoMeta} numberOfLines={1}>
                {trip.location ? (
                  <>
                    <Text style={styles.publicDetailHeroInfoLocation}>{trip.location}</Text>
                    <Text>{` · ${formatDateRangeWithYear(trip)}`}</Text>
                  </>
                ) : formatDateRangeWithYear(trip)}
              </Text>
            </BlurView>
          </View>
        </View>

        <View style={styles.publicDetailFloatingCard}>
          <View style={styles.publicProfileInline}>
            <TouchableOpacity onPress={onOpenProfile} style={styles.publicProfilePressable}>
              <View style={styles.publicProfileAvatarImage}>
                <Text style={styles.publicProfileAvatarInitial}>
                  {trip.ownerName?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.publicProfileTextWrap}>
                <Text style={styles.publicProfileName} numberOfLines={1}>{trip.ownerName}</Text>
                <Text style={styles.publicProfileSubtext} numberOfLines={1}>View public profile</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleLike} style={styles.inlineHeartBtn} activeOpacity={0.8}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#F26B64' : '#CCCCCC'}
              />
            </TouchableOpacity>
          </View>

          {trip.description ? <Text style={styles.publicDetailDescription}>{trip.description}</Text> : null}

          <PublicTripTags trip={trip} />

          <View style={styles.publicDetailItineraryHead}>
            <Text style={styles.publicDetailSectionTitle}>Itinerary</Text>
          </View>
          <BlurView tint="light" intensity={60} style={styles.publicItinerarySectionCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.publicItineraryDateRow}
              style={styles.publicItineraryDateScroll}
            >
              {itinerarySections.map((section, index) => {
                const isActive = index === safeSelectedPublicItineraryDayIndex;
                return (
                  <TouchableOpacity
                    key={section.key}
                    style={[styles.publicItineraryDateChip, isActive && styles.publicItineraryDateChipActive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPublicItineraryDayIndex(index)}
                  >
                    <Text style={[styles.publicItineraryDateChipDayNumber, isActive && styles.publicItineraryDateChipTextActive]}>
                      {section.date.getDate()}
                    </Text>
                    <Text style={[styles.publicItineraryDateChipWeekday, isActive && styles.publicItineraryDateChipTextActive]}>
                      {formatItineraryChipWeekday(section.date)}
                    </Text>
                    <Text style={[styles.publicItineraryDateChipMonth, isActive && styles.publicItineraryDateChipTextActive]}>
                      {formatItineraryChipMonth(section.date)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedPublicItinerarySection ? (
              <View key={selectedPublicItinerarySection.key} style={styles.publicItineraryDaySection}>
                <View style={styles.publicItineraryDayContent}>
                  <Text style={styles.publicItineraryDayTitle}>{selectedPublicItinerarySection.title}</Text>
                  {selectedPublicItinerarySection.places.length === 0 ? (
                    <View style={styles.publicItineraryEmptyState}>
                      <Text style={styles.publicItineraryEmptyTitle}>Nothing planned yet</Text>
                      <Text style={styles.publicItineraryEmpty}>No plans yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.publicItineraryItemsList}>
                      <BlurView intensity={28} tint="extraLight" style={styles.publicPlaceGroupGlass} />
                      {selectedPublicItinerarySection.places.map((place, placeIndex) => {
                        const timeValue = formatPublicItineraryTimeValue(place.time || place.displayTime || getPublicFallbackItineraryTime(placeIndex));
                        return (
                          <View key={place.id} style={styles.publicItineraryRow}>
                            <View style={styles.publicItineraryRowShell}>
                              <TouchableOpacity
                                style={styles.publicItineraryRowCard}
                                activeOpacity={0.82}
                                onPress={() => setSelectedPlaceDetail({ place, dateLabel: selectedPublicItinerarySection.title })}
                              >
                                <View style={styles.publicCardContentRow}>
                                  <View style={styles.publicItineraryTimeLeft}>
                                    <Text style={styles.publicItineraryTimeText}>{timeValue}</Text>
                                  </View>
                                  <View style={styles.publicItineraryTimeDivider} />
                                  <View style={styles.publicItineraryTextFlex}>
                                    <Text style={styles.publicPlaceName}>{place.name}</Text>
                                    {place.note ? <Text style={styles.publicPlaceNote}>{place.note}</Text> : null}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </BlurView>

          <TouchableOpacity
            style={[styles.addPublicTripButton, styles.publicDetailAddButton, alreadyAdded && styles.addPublicTripButtonDone]}
            onPress={() => onAddPublicTrip(trip)}
            disabled={alreadyAdded}
          >
            <Text style={[styles.addPublicTripButtonText, alreadyAdded && styles.addPublicTripButtonTextDone]}>{alreadyAdded ? 'Added to my trips' : 'Add to my trips'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

function groupRecommendations(recs) {
  const groups = {};
  recs.forEach((rec) => {
    const cat = rec.category || 'Places';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(rec);
  });
  return Object.entries(groups);
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
  const locationAccent = getExploreAccent(
    board.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  );

  const hasSearched = Boolean(activeSearchQuery);
  const insets = useSafeAreaInsets();
  const tabBarHeight = Math.max(insets.bottom, 6);

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
    <View style={styles.recScreen}>
      <View style={styles.recCard}>
        <View style={styles.recPageHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerMenuButton} disabled>
            <Text style={styles.headerMenuButtonText} />
          </TouchableOpacity>
        </View>

        <View style={styles.recTitleGroup}>
          <Text style={styles.recPageTitle}>{board.title}</Text>
          {board.location ? (
            <Text style={[styles.recPageLocation, { color: locationAccent.text }]}>{board.location}</Text>
          ) : null}
          <Text style={styles.recPageMeta}>
            {hasSearched ? `${formatDateRange(board)} · ${recommendations.length} results` : formatDateRange(board)}
          </Text>
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
              <ActivityIndicator color="#ffba30" />
              <Text style={styles.recommendationStateText}>Finding {activeSearchQuery.toLowerCase()}...</Text>
            </View>
          ) : null}

          {!isLoading && !hasSearched ? (
            <View style={styles.recommendationStateCard}>
              <Text style={styles.recommendationStateText}>
                Search for museums, cafes, shopping, concerts and more.
              </Text>
            </View>
          ) : null}

          {!isLoading && hasSearched && !recommendations.length ? (
            <View style={styles.recommendationStateCard}>
              <Text style={styles.recommendationStateText}>{`No results for "${activeSearchQuery}".`}</Text>
            </View>
          ) : null}

          {groupRecommendations(recommendations).map(([category, recs]) => (
            <RecommendationGroup
              key={category}
              category={category}
              recs={recs}
              onPress={(item) => setSelectedRecommendation(item)}
            />
          ))}

          {hasSearched && sourceMeta.providersUsed?.length ? (
            <Text style={styles.recommendationSourceMeta}>
              {`Live from ${sourceMeta.providersUsed
                .map((p) => ({ geoapify: 'Geoapify', wikipedia: 'Wikipedia', opentripmap: 'OpenTripMap', ticketmaster: 'Ticketmaster', foursquare: 'Foursquare', google: 'Google', tripadvisor: 'Tripadvisor', yelp: 'Yelp', mock: 'mock data' }[p] ?? p))
                .join(', ')}.`}
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.recommendationSearchComposer, { marginBottom: bottomMargin }]}>
          <View style={styles.recommendationSearchRow}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Museums, cafes, shopping, concerts..."
              placeholderTextColor={colors.textMuted}
              style={styles.recommendationSearchInput}
              returnKeyType="search"
              onSubmitEditing={runSearch}
              textAlign="left"
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
    flexDirection: 'column',
    marginBottom: 10,
    paddingHorizontal: 2
  },
  explorePageTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 30,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  explorePageSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    marginTop: 3
  },
  exploreSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8
  },
  exploreSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  exploreSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'Nunito_400Regular',
    includeFontPadding: false
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterPanel: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16
  },
  filterGroup: {
    marginTop: 20
  },
  filterLabel: {
    color: colors.text,
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
    backgroundColor: colors.surfaceDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  filterDateButtonActive: {
    backgroundColor: '#eef3e4',
    borderColor: '#bac98e'
  },
  filterDateButtonLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
    marginBottom: 3
  },
  filterDateButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  filterDatePlaceholder: {
    color: colors.textMuted,
    fontWeight: '400'
  },
  filterCalendarWrap: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surfaceDeep,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  selectedCountryBubbleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700'
  },
  countryDropdownPanel: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10
  },
  countrySearchInput: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  countryOptionSelected: {
    backgroundColor: '#eef3e4',
    borderColor: '#bac98e'
  },
  countryOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  countryOptionTextSelected: {
    color: '#6b8a48'
  },
  daysRangeContainer: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10
  },
  daysRangeValue: {
    color: colors.text,
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
    backgroundColor: colors.border
  },
  daysRangeFill: {
    position: 'absolute',
    top: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ffba30'
  },
  daysRangeThumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: '#ffffff'
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
    color: colors.textMuted,
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
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipActive: {
    backgroundColor: '#eef3e4',
    borderColor: '#bac98e'
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  filterChipTextActive: {
    color: '#6b8a48'
  },
  clearFiltersButton: {
    marginTop: 22,
    alignItems: 'center',
    paddingVertical: 10
  },
  clearFiltersText: {
    color: colors.text,
    fontWeight: '700'
  },
  publicTripMasonry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  publicTripMasonryColumn: {
    flex: 1,
    gap: 10
  },
  publicTripCard: {
    overflow: 'visible'
  },
  publicTripImageWrap: {
    overflow: 'hidden',
    borderRadius: radius.trip,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  publicTripImage: {
    width: '100%',
    height: 214,
    backgroundColor: colors.surfaceDeep
  },
  publicTripImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  publicTripBody: {
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 4
  },
  publicTripTitle: {
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
    marginBottom: 1,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  publicTripMeta: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    flexShrink: 1
  },
  publicTripDates: {
    fontSize: 12,
    lineHeight: 15,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400'
  },
  publicTripTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginBottom: 12
  },
  publicTripTag: {
    backgroundColor: 'rgba(242,107,100,0.12)',
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  publicTripTagText: {
    color: '#F26B64',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  addPublicTripButton: {
    backgroundColor: 'rgba(242,107,100,0.12)',
    borderRadius: 14,
    borderWidth: 0,
    paddingVertical: 14,
    alignItems: 'center'
  },
  addPublicTripButtonDone: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.border
  },
  addPublicTripButtonTextDone: {
    color: colors.textMuted
  },
  addPublicTripButtonText: {
    color: '#F26B64',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold'
  },
  emptyPublicTrips: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'center'
  },
  emptyPublicTripsText: {
    color: colors.textMuted,
    fontWeight: '700'
  },
  publicDetailScreen: {
    flex: 1,
    backgroundColor: colors.background,
    marginHorizontal: -18
  },
  publicDetailScrollContent: {
    paddingBottom: 6
  },
  publicDetailHeroSection: {
    height: 240,
    position: 'relative',
    overflow: 'hidden',
  },
  publicDetailHeroImage: {
    width: '100%',
    height: 240,
  },
  publicDetailHeroPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#7a6ab8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicDetailHeroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  publicDetailHeroBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  publicDetailHeroBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(75,74,70,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  publicDetailHeroInfoCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#B9A09B',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  publicDetailHeroInfoCardBlur: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  publicDetailHeroInfoTitle: {
    color: '#000000',
    fontSize: 19,
    lineHeight: 23,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  publicDetailHeroInfoMeta: {
    marginTop: 2,
    color: '#000000',
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
    fontWeight: Platform.OS === 'ios' ? '500' : '400'
  },
  publicDetailHeroInfoLocation: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    color: '#5A5853',
  },
  publicDetailFloatingCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    paddingBottom: 10,
    overflow: 'hidden',
    shadowColor: '#B9A09B',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 3,
  },
  publicDetailTitleGroup: {
    marginBottom: 16
  },
  publicDetailTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
    textTransform: 'lowercase'
  },
  publicDetailLocation: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
  },
  publicDetailLocationPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  publicProfileInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
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
    borderRadius: 19,
    backgroundColor: '#E8E6E3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  publicProfileAvatarInitial: {
    color: '#F26B64',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  publicProfileTextWrap: {
    flex: 1,
    minWidth: 0
  },
  publicProfileName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito_700Bold'
  },
  publicProfileSubtext: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: 'Nunito_400Regular'
  },
  publicHeartButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  publicHeartButtonText: {
    color: '#CCCCCC',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '500'
  },
  publicHeartButtonTextActive: {
    color: '#F26B64'
  },
  inlineHeartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(75,74,70,0.22)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
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
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginTop: 4
  },
  publicDetailDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 12,
    textAlign: 'center'
  },
  publicDetailItineraryHead: {
    marginTop: 4,
    marginBottom: 12
  },
  publicItinerarySectionCard: {
    marginTop: 4,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,252,249,0.55)',
    padding: 16,
  },
  publicDetailSectionTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  publicItineraryDateScroll: {
    marginBottom: 18
  },
  publicItineraryDateRow: {
    paddingRight: 4,
    gap: 8
  },
  publicItineraryDateChip: {
    width: 50,
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: '#EEE9E2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  publicItineraryDateChipActive: {
    backgroundColor: '#F26B64',
    borderColor: '#F26B64'
  },
  publicItineraryDateChipDayNumber: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  publicItineraryDateChipWeekday: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  publicItineraryDateChipMonth: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '600'
  },
  publicItineraryDateChipTextActive: {
    color: '#ffffff'
  },
  publicItineraryDaySection: {
    marginBottom: 8
  },
  publicItineraryDayContent: {
    flex: 1,
    paddingBottom: 10
  },
  publicItineraryDayTitle: {
    marginBottom: 14,
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  publicItineraryEmpty: {
    color: colors.textMuted,
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  publicItineraryEmptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f0efed',
    paddingHorizontal: 16,
    paddingVertical: 18
  },
  publicItineraryEmptyTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  publicItineraryItemsList: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent'
  },
  publicPlaceGroupGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,239,237,0.90)'
  },
  publicItineraryRow: {
    overflow: 'visible',
  },
  publicItineraryRowShell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  publicItineraryRowCard: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(248,246,243,0.72)',
  },
  publicCardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
  },
  publicItineraryTextFlex: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  publicItineraryTimeLeft: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 8,
    minWidth: 54,
  },
  publicItineraryTimeDivider: {
    alignSelf: 'center',
    width: 1,
    height: 22,
    backgroundColor: 'rgba(233, 198, 190, 0.85)',
  },
  publicItineraryTimeText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.2,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
  },
  publicPlaceName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  publicPlaceNote: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  publicDetailAddButton: {
    marginTop: 14
  },
  publicProfileHeader: {
    backgroundColor: '#eef3e4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#bac98e',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  publicProfileAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8E6E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  publicProfileAvatarLargeText: {
    color: '#F26B64',
    fontSize: 30,
    fontWeight: '800'
  },
  publicProfileHeaderName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800'
  },
  publicProfileBio: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center'
  },
  recScreen: {
    paddingBottom: 24
  },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  recPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  recTitleGroup: {
    marginBottom: 16
  },
  recPageTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
    textTransform: 'lowercase'
  },
  recPageLocation: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginTop: 4
  },
  recPageMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    marginTop: 4
  },
  headerMenuButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 28
  },
  headerMenuButtonText: {
    color: colors.textSecondary,
    fontSize: 22
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
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 0,
    marginLeft: 2,
    minWidth: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 28
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 26,
    lineHeight: 26,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  publicDetailHeaderText: {
    alignItems: 'flex-end'
  },
  publicDetailHeaderTitle: {
    textAlign: 'right'
  },
  exploreSubMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted
  },
  recommendationSourceMeta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18
  },
  recommendationFallbackMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18
  },
  recommendationErrorMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18
  },
  recommendationStateCard: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16
  },
  recommendationStateText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  recommendationSearchComposer: {
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: colors.surfaceDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  recommendationSearchLabel: {
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14
  },
  recommendationSearchButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F26B64',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recommendationSearchButtonDisabled: {
    backgroundColor: '#d4cfc9'
  },
  recommendationSearchButtonText: {
    color: '#ffffff',
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
    backgroundColor: colors.text
  },
  userQueryBubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular'
  }
});

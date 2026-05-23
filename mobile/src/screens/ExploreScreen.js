import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecommendationCard } from '../components/RecommendationCard';
import { formatDateRange, generateRecommendationsForRefresh } from '../../data/recommendations';
import { publicTrips } from '../../data/trips';

const DAY_RANGE_MIN = 1;
const DAY_RANGE_MAX = 30;

function groupRecommendationsByCategory(recommendations) {
  return recommendations.reduce((sections, rec) => {
    const existing = sections.find((section) => section.title === rec.category);
    if (existing) {
      existing.items.push(rec);
      return sections;
    }
    return [...sections, { title: rec.category, items: [rec] }];
  }, []);
}

const FILTER_DEFAULTS = {
  country: [],
  minDays: DAY_RANGE_MIN,
  maxDays: DAY_RANGE_MAX,
  pace: 'All',
  travelerType: 'All',
  accessibility: 'All',
  budget: 'All',
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
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase();
  const month = date.toLocaleDateString(undefined, { month: 'long' }).toLowerCase();
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
  if (filters.pace !== 'All' && trip.pace !== filters.pace) return false;
  if (filters.travelerType !== 'All' && trip.travelerType !== filters.travelerType) return false;
  if (filters.accessibility !== 'All' && trip.accessibility !== filters.accessibility) return false;
  if (filters.budget !== 'All' && trip.budget !== filters.budget) return false;

  const filterStart = parseFilterDate(filters.startDate);
  const filterEnd = parseFilterDate(filters.endDate);
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  if (filterStart && tripEnd < filterStart) return false;
  if (filterEnd && tripStart > filterEnd) return false;
  return true;
}

export function ExploreScreen({ boards, onAddPublicTrip }) {
  const [isFilterPageOpen, setIsFilterPageOpen] = useState(false);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [selectedPublicTrip, setSelectedPublicTrip] = useState(null);
  const [selectedOwnerName, setSelectedOwnerName] = useState(null);
  const [activeFilterDateField, setActiveFilterDateField] = useState(null);
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const paceOptions = useMemo(() => uniqueValues(publicTrips, 'pace'), []);
  const travelerTypeOptions = useMemo(() => uniqueValues(publicTrips, 'travelerType'), []);
  const accessibilityOptions = useMemo(() => uniqueValues(publicTrips, 'accessibility'), []);
  const budgetOptions = useMemo(() => uniqueValues(publicTrips, 'budget'), []);
  const filteredTrips = publicTrips.filter((trip) => matchesPublicTripFilters(trip, filters));
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
  };
  const openPublicProfile = (ownerName) => {
    setSelectedOwnerName(ownerName);
    setSelectedPublicTrip(null);
  };

  if (selectedPublicTrip) {
    return (
      <PublicTripDetail
        trip={selectedPublicTrip}
        alreadyAdded={addedPublicTripIds.has(selectedPublicTrip.id)}
        onBack={() => setSelectedPublicTrip(null)}
        onOpenProfile={() => openPublicProfile(selectedPublicTrip.ownerName)}
        onAddPublicTrip={onAddPublicTrip}
      />
    );
  }

  if (selectedOwnerName) {
    const ownerTrips = publicTrips.filter((trip) => trip.ownerName === selectedOwnerName);
    return (
      <PublicProfile
        ownerName={selectedOwnerName}
        trips={ownerTrips}
        addedPublicTripIds={addedPublicTripIds}
        onBack={() => setSelectedOwnerName(null)}
        onOpenTrip={openPublicTrip}
        onAddPublicTrip={onAddPublicTrip}
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
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterPageOpen(true)}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.publicTripMasonry}>
        {[0, 1].map((column) => (
          <View key={column} style={styles.publicTripMasonryColumn}>
            {filteredTrips
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

      {filteredTrips.length === 0 && (
        <View style={styles.emptyPublicTrips}>
          <Text style={styles.emptyPublicTripsText}>No public trips match these filters.</Text>
        </View>
      )}
    </View>
  );
}

function PublicTripCard({ trip, onOpenTrip, onOpenProfile, variantIndex = 0 }) {
  const imageHeights = [210, 164, 176, 224, 190, 152];

  return (
    <View style={styles.publicTripCard}>
      <TouchableOpacity activeOpacity={0.88} onPress={onOpenTrip}>
        <Image source={{ uri: trip.image }} style={[styles.publicTripImage, { height: imageHeights[variantIndex % imageHeights.length] }]} />
      </TouchableOpacity>
      <View style={styles.publicTripBody}>
        <TouchableOpacity onPress={onOpenTrip} activeOpacity={0.85}>
          <View style={styles.publicTripTitleRow}>
            <Text style={styles.publicTripTitle} numberOfLines={2}>{trip.title}</Text>
            <Text style={styles.publicTripMore}>...</Text>
          </View>
          <Text style={styles.publicTripMeta} numberOfLines={2}>{trip.location}</Text>
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
          <Text style={styles.backButtonText}>Back</Text>
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
        placeholderTextColor="#A1A1AA"
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

function PublicTripDetail({ trip, alreadyAdded, onBack, onOpenProfile, onAddPublicTrip }) {
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
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.exploreSubHeaderText}>
          <Text style={styles.exploreSubTitle}>{trip.title}</Text>
        </View>
      </View>

      <Image source={{ uri: trip.image }} style={styles.publicDetailImage} />
      <TouchableOpacity onPress={onOpenProfile} style={styles.publicProfileInline}>
        <View style={styles.publicProfileAvatar}>
          <Text style={styles.publicProfileAvatarText}>{trip.ownerName.slice(0, 1)}</Text>
        </View>
        <View>
          <Text style={styles.publicProfileName}>{trip.ownerName}</Text>
          <Text style={styles.publicProfileSubtext}>View public profile</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.publicDetailMeta}>
        {trip.location} · {formatDateRange(trip)}
      </Text>
      <PublicTripTags trip={trip} />
      <Text style={styles.publicDetailDescription}>{trip.description}</Text>

      <Text style={styles.publicDetailSectionTitle}>Itinerary</Text>
      {itinerarySections.map((section, index) => (
        <View key={section.key} style={styles.publicItineraryDaySection}>
          <View style={styles.publicItineraryDayRail}>
            <View style={styles.publicItineraryDayDot} />
            {index < itinerarySections.length - 1 && <View style={styles.publicItineraryDayLine} />}
          </View>
          <View style={styles.publicItineraryDayContent}>
            <Text style={styles.publicItineraryDayTitle}>{section.title}</Text>
            {section.places.length === 0 && <Text style={styles.publicItineraryEmpty}>No plans yet.</Text>}
            {section.places.map((place) => (
              <View key={place.id} style={styles.publicPlaceRow}>
                <Text style={styles.publicPlaceName}>{place.name}</Text>
                {place.note && <Text style={styles.publicPlaceNote}>{place.note}</Text>}
              </View>
            ))}
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
  );
}

function PublicProfile({ ownerName, trips, addedPublicTripIds, onBack, onOpenTrip, onAddPublicTrip }) {
  const placeCount = trips.reduce((sum, trip) => sum + (trip.placesList?.length ?? 0), 0);

  return (
    <View>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.exploreSubHeaderText}>
          <Text style={styles.exploreSubTitle}>{ownerName}</Text>
          <Text style={styles.exploreSubMeta}>{trips.length} public trips · {placeCount} saved places</Text>
        </View>
      </View>

      <View style={styles.publicProfileHeader}>
        <View style={styles.publicProfileAvatarLarge}>
          <Text style={styles.publicProfileAvatarLargeText}>{ownerName.slice(0, 1)}</Text>
        </View>
        <Text style={styles.publicProfileHeaderName}>{ownerName}</Text>
        <Text style={styles.publicProfileBio}>Public trips shared with the Atlas community.</Text>
      </View>

      {trips.map((trip) => (
        <PublicTripCard
          key={trip.id}
          trip={trip}
          onOpenTrip={() => onOpenTrip(trip)}
          onOpenProfile={() => {}}
        />
      ))}
    </View>
  );
}

function FilterChips({ label, options, value, onChange, compact = false }) {
  return (
    <View style={!compact && styles.filterGroup}>
      {label && <Text style={styles.filterLabel}>{label}</Text>}
      <View style={[styles.filterChipRow, compact && styles.filterChipRowCompact]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, value === option && styles.filterChipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.filterChipText, value === option && styles.filterChipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ExploreMoreScreen({ board, onBack, onOpenRecommendation, refreshSeed = 1, onRefreshSection }) {
  const recommendations = generateRecommendationsForRefresh(board, refreshSeed);
  const sections = groupRecommendationsByCategory(recommendations);

  return (
    <View style={styles.exploreSubScreen}>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.exploreSubHeaderText}>
          <Text style={styles.exploreSubTitle}>{board.title}</Text>
          <Text style={styles.exploreSubMeta}>{formatDateRange(board)} · {recommendations.length} activities</Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.recommendationSection}>
          <View style={styles.recommendationSectionHeader}>
            <Text style={styles.recommendationSectionTitle}>{section.title}</Text>
            <TouchableOpacity style={styles.sectionRefreshButton} onPress={() => onRefreshSection(section.title)}>
              <Text style={styles.sectionRefreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {section.items.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onPress={(item) => onOpenRecommendation(board.id, item.id, 'more')} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12
  },
  explorePageTitle: {
    color: '#2A0A2B',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900'
  },
  filterButton: {
    borderRadius: 14,
    backgroundColor: '#DD77F2',
    paddingVertical: 11,
    paddingHorizontal: 16
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16
  },
  filterGroup: {
    marginTop: 12
  },
  filterLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  filterDateRow: {
    flexDirection: 'row',
    gap: 10
  },
  filterDateButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  filterDateButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8'
  },
  filterDateButtonLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3
  },
  filterDateButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800'
  },
  filterDatePlaceholder: {
    color: '#A1A1AA',
    fontWeight: '500'
  },
  filterCalendarWrap: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#F6E4F8',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DD77F2',
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  selectedCountryBubbleText: {
    color: '#7D3DBA',
    fontSize: 12,
    fontWeight: '800'
  },
  countryDropdownPanel: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10
  },
  countrySearchInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  countryOptionSelected: {
    backgroundColor: '#F6E4F8',
    borderColor: '#DD77F2'
  },
  countryOptionText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  countryOptionTextSelected: {
    color: '#7D3DBA'
  },
  daysRangeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10
  },
  daysRangeValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
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
    backgroundColor: '#E2E8F0'
  },
  daysRangeFill: {
    position: 'absolute',
    top: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#DD77F2'
  },
  daysRangeThumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#DD77F2',
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
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipActive: {
    backgroundColor: '#F6E4F8',
    borderColor: '#DD77F2'
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  filterChipTextActive: {
    color: '#7D3DBA'
  },
  clearFiltersButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10
  },
  clearFiltersText: {
    color: '#7D3DBA',
    fontWeight: '800'
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
    overflow: 'hidden'
  },
  publicTripImage: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#F8FAFC'
  },
  publicTripBody: {
    paddingTop: 8,
    paddingHorizontal: 2,
    paddingBottom: 4
  },
  publicTripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  publicTripTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  publicTripMore: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16
  },
  publicTripOwner: {
    color: '#7D3DBA',
    fontSize: 11,
    fontWeight: '700'
  },
  publicTripOwnerButton: {
    alignSelf: 'flex-start',
    marginTop: 4
  },
  publicTripMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  publicTripTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12
  },
  publicTripTag: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  publicTripTagText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800'
  },
  addPublicTripButton: {
    backgroundColor: '#DD77F2',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center'
  },
  addPublicTripButtonDone: {
    backgroundColor: '#94A3B8'
  },
  addPublicTripButtonText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  emptyPublicTrips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    alignItems: 'center'
  },
  emptyPublicTripsText: {
    color: '#64748B',
    fontWeight: '700'
  },
  publicDetailScreen: {
    paddingBottom: 24
  },
  publicDetailImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 14
  },
  publicProfileInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14
  },
  publicProfileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F6E4F8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  publicProfileAvatarText: {
    color: '#7D3DBA',
    fontSize: 18,
    fontWeight: '800'
  },
  publicProfileName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800'
  },
  publicProfileSubtext: {
    marginTop: 2,
    color: '#7D3DBA',
    fontSize: 12,
    fontWeight: '700'
  },
  publicDetailMeta: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  publicDetailDescription: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12
  },
  publicDetailSectionTitle: {
    color: '#2A0A2B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10
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
    backgroundColor: '#DD77F2',
    marginTop: 6
  },
  publicItineraryDayLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#F3E7F3',
    marginTop: 4
  },
  publicItineraryDayContent: {
    flex: 1,
    paddingBottom: 18
  },
  publicItineraryDayTitle: {
    marginBottom: 10,
    color: '#2A0A2B',
    fontSize: 15,
    fontWeight: '800'
  },
  publicItineraryEmpty: {
    color: '#94A3B8',
    marginBottom: 10,
    fontSize: 13
  },
  publicPlaceRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7F3'
  },
  publicPlaceName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800'
  },
  publicPlaceNote: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17
  },
  publicDetailAddButton: {
    marginTop: 8
  },
  publicProfileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  publicProfileAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F6E4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  publicProfileAvatarLargeText: {
    color: '#7D3DBA',
    fontSize: 30,
    fontWeight: '800'
  },
  publicProfileHeaderName: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800'
  },
  publicProfileBio: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center'
  },
  exploreSubScreen: {
    paddingBottom: 24
  },
  exploreSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10
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
  exploreSubHeaderText: {
    flex: 1
  },
  filterSubHeaderText: {
    alignItems: 'flex-end'
  },
  exploreSubTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A'
  },
  exploreSubMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B'
  },
  recommendationSection: {
    marginBottom: 18
  },
  recommendationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  recommendationSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A0A2B'
  },
  sectionRefreshButton: {
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  sectionRefreshButtonText: {
    color: '#7D3DBA',
    fontSize: 12,
    fontWeight: '800'
  }
});

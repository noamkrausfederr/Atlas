import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecommendationCard } from '../components/RecommendationCard';
import { formatDateRange, generateRecommendationsForRefresh } from '../../data/recommendations';
import { publicTrips } from '../../data/trips';

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
  country: 'All',
  continent: 'All',
  days: 'All',
  people: 'All',
  startDate: '',
  endDate: ''
};

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

function getFilterDateValue(filters, field) {
  const parsed = parseFilterDate(filters[field]);
  if (parsed) return parsed;
  const fallback = field === 'endDate' ? parseFilterDate(filters.startDate) : null;
  return fallback || new Date();
}

function formatTripDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function matchesPublicTripFilters(trip, filters) {
  if (filters.country !== 'All' && trip.country !== filters.country) return false;
  if (filters.continent !== 'All' && trip.continent !== filters.continent) return false;
  if (filters.days !== 'All' && trip.days !== Number(filters.days)) return false;
  if (filters.people !== 'All' && trip.people !== Number(filters.people)) return false;

  const filterStart = parseFilterDate(filters.startDate);
  const filterEnd = parseFilterDate(filters.endDate);
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  if (filterStart && tripEnd < filterStart) return false;
  if (filterEnd && tripStart > filterEnd) return false;
  return true;
}

export function ExploreScreen({ boards, onAddPublicTrip }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [selectedPublicTrip, setSelectedPublicTrip] = useState(null);
  const [selectedOwnerName, setSelectedOwnerName] = useState(null);
  const [activeFilterDateField, setActiveFilterDateField] = useState(null);
  const countries = useMemo(() => uniqueValues(publicTrips, 'country'), []);
  const continents = useMemo(() => uniqueValues(publicTrips, 'continent'), []);
  const dayOptions = useMemo(() => ['All', ...Array.from(new Set(publicTrips.map((trip) => trip.days))).sort((a, b) => a - b).map(String)], []);
  const peopleOptions = useMemo(
    () => ['All', ...Array.from(new Set(publicTrips.map((trip) => trip.people))).sort((a, b) => a - b).map(String)],
    []
  );
  const filteredTrips = publicTrips.filter((trip) => matchesPublicTripFilters(trip, filters));
  const addedPublicTripIds = new Set(boards.map((board) => board.sourcePublicTripId).filter(Boolean));
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
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

  return (
    <View>
      <View style={styles.exploreHeader}>
        <View>
          <Text style={styles.brandLabel}>Explore</Text>
          <Text style={styles.heroTitle}>Public trips</Text>
          <Text style={styles.heroDescription}>{publicTrips.length} trips shared by travelers on Atlas</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterOpen((current) => !current)}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {isFilterOpen && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Dates</Text>
          <View style={styles.filterDateRow}>
            <FilterDateButton
              label="From"
              value={filters.startDate}
              active={activeFilterDateField === 'startDate'}
              onPress={() => setActiveFilterDateField((current) => (current === 'startDate' ? null : 'startDate'))}
            />
            <FilterDateButton
              label="To"
              value={filters.endDate}
              active={activeFilterDateField === 'endDate'}
              onPress={() => setActiveFilterDateField((current) => (current === 'endDate' ? null : 'endDate'))}
            />
          </View>
          {activeFilterDateField === 'startDate' && (
            <View style={styles.filterCalendarWrap}>
              <DateTimePicker
                value={getFilterDateValue(filters, 'startDate')}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => handleFilterDateChange('startDate', event, selectedDate)}
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
                onChange={(event, selectedDate) => handleFilterDateChange('endDate', event, selectedDate)}
                style={styles.inlineCalendar}
              />
            </View>
          )}

          <FilterChips label="Country" options={countries} value={filters.country} onChange={(value) => updateFilter('country', value)} />
          <FilterChips label="Continent" options={continents} value={filters.continent} onChange={(value) => updateFilter('continent', value)} />
          <FilterChips label="Days" options={dayOptions} value={filters.days} onChange={(value) => updateFilter('days', value)} />
          <FilterChips label="People" options={peopleOptions} value={filters.people} onChange={(value) => updateFilter('people', value)} />

          <TouchableOpacity style={styles.clearFiltersButton} onPress={() => setFilters(FILTER_DEFAULTS)}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.publicTripCount}>
        {filteredTrips.length} public {filteredTrips.length === 1 ? 'trip' : 'trips'}
      </Text>

      {filteredTrips.map((trip) => (
        <PublicTripCard
          key={trip.id}
          trip={trip}
          onOpenTrip={() => openPublicTrip(trip)}
          onOpenProfile={() => openPublicProfile(trip.ownerName)}
        />
      ))}

      {filteredTrips.length === 0 && (
        <View style={styles.emptyPublicTrips}>
          <Text style={styles.emptyPublicTripsText}>No public trips match these filters.</Text>
        </View>
      )}
    </View>
  );
}

function PublicTripCard({ trip, onOpenTrip, onOpenProfile }) {
  return (
    <View style={styles.publicTripCard}>
      <TouchableOpacity activeOpacity={0.88} onPress={onOpenTrip}>
        <Image source={{ uri: trip.image }} style={styles.publicTripImage} />
      </TouchableOpacity>
      <View style={styles.publicTripBody}>
        <View style={styles.publicTripTopRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={onOpenTrip} activeOpacity={0.85}>
              <Text style={styles.publicTripTitle}>{trip.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenProfile} style={styles.publicTripOwnerButton}>
              <Text style={styles.publicTripOwner}>By {trip.ownerName}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.publicTripDays}>{trip.days} days</Text>
        </View>
        <TouchableOpacity onPress={onOpenTrip} activeOpacity={0.85}>
          <Text style={styles.publicTripMeta}>
            {trip.location} · {trip.people} {trip.people === 1 ? 'person' : 'people'}
          </Text>
          <View style={styles.publicTripDateRow}>
            <View style={styles.publicTripDateBox}>
              <Text style={styles.publicTripDateLabel}>Start</Text>
              <Text style={styles.publicTripDateValue}>{formatTripDate(trip.startDate)}</Text>
            </View>
            <View style={styles.publicTripDateBox}>
              <Text style={styles.publicTripDateLabel}>End</Text>
              <Text style={styles.publicTripDateValue}>{formatTripDate(trip.endDate)}</Text>
            </View>
          </View>
          <Text style={styles.publicTripDescription}>{trip.description}</Text>
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

function PublicTripDetail({ trip, alreadyAdded, onBack, onOpenProfile, onAddPublicTrip }) {
  return (
    <View style={styles.publicDetailScreen}>
      <View style={styles.exploreSubHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.exploreSubHeaderText}>
          <Text style={styles.exploreSubTitle}>{trip.title}</Text>
          <Text style={styles.exploreSubMeta}>Public trip</Text>
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
        {trip.location} · {trip.people} {trip.people === 1 ? 'person' : 'people'} · {formatDateRange(trip)}
      </Text>
      <Text style={styles.publicDetailDescription}>{trip.description}</Text>

      <View style={styles.readOnlyBadge}>
        <Text style={styles.readOnlyBadgeText}>Read-only public trip</Text>
      </View>

      <Text style={styles.publicDetailSectionTitle}>Itinerary</Text>
      {(trip.placesList ?? []).map((place) => (
        <View key={place.id} style={styles.publicPlaceRow}>
          <Text style={styles.publicPlaceName}>{place.name}</Text>
          {place.note && <Text style={styles.publicPlaceNote}>{place.note}</Text>}
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

function FilterChips({ label, options, value, onChange }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChipRow}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
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
    marginTop: 6
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
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
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
  publicTripCount: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12
  },
  publicTripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16
  },
  publicTripImage: {
    width: '100%',
    height: 170
  },
  publicTripBody: {
    padding: 16
  },
  publicTripTopRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 8
  },
  publicTripTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A'
  },
  publicTripOwner: {
    marginTop: 3,
    color: '#7D3DBA',
    fontSize: 13,
    fontWeight: '700'
  },
  publicTripOwnerButton: {
    alignSelf: 'flex-start'
  },
  publicTripDays: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800'
  },
  publicTripMeta: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10
  },
  publicTripDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  publicTripDateBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  publicTripDateLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3
  },
  publicTripDateValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800'
  },
  publicTripDescription: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
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
  readOnlyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18
  },
  readOnlyBadgeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  publicDetailSectionTitle: {
    color: '#2A0A2B',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10
  },
  publicPlaceRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10
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

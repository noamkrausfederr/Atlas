import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { colors, fonts, radius, shadow } from '../theme';
import { IllustratedTripCard } from '../components/IllustratedTripCard';

function formatSocialCount(value) {
  if (typeof value === 'string') return value;
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}

function getProfileTripLikeCount(board) {
  const seed = board.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 120 + (seed % 780);
}

function formatTripDateRange(board) {
  if (!board.startDate || !board.endDate) return '';
  const start = new Date(board.startDate);
  const end = new Date(board.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

function PublicTripGridCard({ board, onPress }) {
  const dateText = formatTripDateRange(board);

  return (
    <TouchableOpacity style={styles.tripCard} activeOpacity={0.88} onPress={() => onPress(board)}>
      <Image source={{ uri: board.image }} style={styles.tripCardImage} />
      <View style={styles.tripCardBody}>
        <Text style={styles.tripCardTitle} numberOfLines={2}>{board.title}</Text>
        <Text style={styles.tripCardLocation} numberOfLines={1}>{board.location || board.subtitle}</Text>
        {dateText ? <Text style={styles.tripCardDate} numberOfLines={1}>{dateText}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export function PublicProfileView({
  name,
  handle,
  bio,
  image = null,
  followers,
  following,
  likes,
  publicBoards,
  onOpenBoard,
  hideTripsSection = false,
  showScreenHeader = false,
  showSettingsButton = false,
  showFollowButton = true,
  showMessageButton = false,
  isFollowing = false,
  onToggleFollow,
  onMessagePress,
  onSettingsPress
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      {showScreenHeader ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {showSettingsButton ? (
            <TouchableOpacity style={styles.settingsButton} activeOpacity={0.85} onPress={onSettingsPress}>
              <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.profileHero}>
        <View style={styles.profileAvatarWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoInitial}>{name?.[0]?.toUpperCase() ?? 'A'}</Text>
            </View>
          )}
          {showSettingsButton ? (
            <TouchableOpacity style={styles.profileAvatarCamera} activeOpacity={0.8} onPress={onSettingsPress}>
              <Ionicons name="camera-outline" size={14} color="#ffffff" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileHandle}>{handle}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatSocialCount(followers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatSocialCount(following)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLast]}>
            <Text style={styles.statValue}>{formatSocialCount(likes)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
        <Text style={styles.profileBio}>{bio}</Text>

        {showFollowButton ? (
          <View style={styles.profileActionRow}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              activeOpacity={0.9}
              onPress={onToggleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            {showMessageButton ? (
              <TouchableOpacity style={styles.headerMessageButton} activeOpacity={0.9} onPress={onMessagePress}>
                <Text style={styles.headerMessageButtonText}>Message</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.profileDivider} />

      {!hideTripsSection ? (
        <>
          <View style={styles.tripsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Public trips</Text>
              <Text style={styles.sectionMeta}>
                {publicBoards.length} {publicBoards.length === 1 ? 'trip' : 'trips'}
              </Text>
            </View>

            {publicBoards.length > 0 ? (
              <View style={styles.tripGrid}>
                {publicBoards.map((board) => (
                  <PublicTripGridCard key={board.id} board={board} onPress={onOpenBoard} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No public trips yet.</Text>
              </View>
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

export function TripListScreen({ title, boards, compact, onBack, onOpenBoard }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, { paddingTop: 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tripListHeader}>
        <TouchableOpacity onPress={onBack} style={styles.tripListBackBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.tripListTitle}>{title}</Text>
      </View>
      {boards.length > 0 ? (
        <View style={styles.tripsSection}>
          <View style={styles.curatedTripGrid}>
            {boards.map((board) => (
              <IllustratedTripCard key={board.id} board={board} onPress={onOpenBoard} compact={compact} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No trips here yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

export function ProfileScreen({
  boards,
  upcomingBoards,
  pastTrips,
  followingCount,
  onOpenBoard,
  onSeeAllUpcoming,
  onSeeAllPast,
  onSettingsPress,
}) {
  const publicBoards = boards.filter((board) => board.isPublic === true);
  const totalLikesReceived = publicBoards.reduce((sum, board) => sum + getProfileTripLikeCount(board), 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHero}>
        <View style={styles.profileAvatarWrap}>
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profilePhotoInitial}>S</Text>
          </View>
          <TouchableOpacity style={styles.profileAvatarEdit} activeOpacity={0.8} onPress={onSettingsPress}>
            <Ionicons name="pencil-outline" size={16} color="#1F1E1C" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>Sofia Walker</Text>
        <Text style={styles.profileHandle}>@sofiawalks</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12.4K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatSocialCount(followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLast]}>
            <Text style={styles.statValue}>{formatSocialCount(totalLikesReceived)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
        <Text style={styles.profileBio}>
          Travel curator collecting food-first itineraries, soft city mornings, and trips worth sending to the group chat.
        </Text>
      </View>

      <View style={styles.profileDivider} />

      <View style={styles.tripsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming trips</Text>
          <TouchableOpacity onPress={onSeeAllUpcoming} activeOpacity={0.7}>
            <Text style={styles.sectionMeta}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcomingBoards.length > 0 ? (
          <View style={styles.curatedTripGrid}>
            {upcomingBoards.slice(0, 2).map((board) => (
              <IllustratedTripCard key={board.id} board={board} onPress={onOpenBoard} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming trips yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.tripsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Past trips</Text>
          <TouchableOpacity onPress={onSeeAllPast} activeOpacity={0.7}>
            <Text style={styles.sectionMeta}>See all</Text>
          </TouchableOpacity>
        </View>

        {pastTrips.length > 0 ? (
          <View>
            {pastTrips.map((board) => (
              <IllustratedTripCard key={board.id} board={board} onPress={onOpenBoard} compact />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No past trips yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SettingsToggleRow({ label, value, onValueChange, detail = '' }) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {detail ? <Text style={styles.settingsDetail}>{detail}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d4cfc9', true: '#ffba30' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#d4cfc9"
      />
    </View>
  );
}

function SettingsLinkRow({ label, detail = '', onPress, tone = 'default' }) {
  const labelStyle = tone === 'danger' ? styles.settingsLabelDanger : styles.settingsLabel;

  return (
    <TouchableOpacity style={styles.settingsRow} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.settingsCopy}>
        <Text style={labelStyle}>{label}</Text>
        {detail ? <Text style={styles.settingsDetail}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tone === 'danger' ? '#C9524E' : colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsScreen({ onBack }) {
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true);
  const [privateAccountEnabled, setPrivateAccountEnabled] = useState(false);
  const [friendActivityEnabled, setFriendActivityEnabled] = useState(true);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.settingsScreenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.settingsHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.85}>
          <Text style={styles.backButtonArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.settingsTitle}>Settings</Text>
        <View style={styles.settingsHeaderSpacer} />
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingsLinkRow label="Edit profile" detail="Name, bio, username, and photo" onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsLinkRow label="Password" detail="Last updated 3 months ago" onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsToggleRow
            label="Private account"
            detail="Only approved followers can view your trips."
            value={privateAccountEnabled}
            onValueChange={setPrivateAccountEnabled}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <SettingsToggleRow
            label="Push alerts"
            detail="Trip reminders, messages, and updates."
            value={pushAlertsEnabled}
            onValueChange={setPushAlertsEnabled}
          />
          <View style={styles.settingsDivider} />
          <SettingsToggleRow
            label="Friend activity"
            detail="When people you follow publish or update trips."
            value={friendActivityEnabled}
            onValueChange={setFriendActivityEnabled}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <SettingsLinkRow label="Saved places" detail="Manage your pinned recommendations." onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsLinkRow label="Download preferences" detail="Offline maps and media quality." onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsLinkRow label="Language" detail="English" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <SettingsLinkRow label="Help center" detail="FAQs, contact, and troubleshooting." onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsLinkRow label="Privacy policy" onPress={() => {}} />
          <View style={styles.settingsDivider} />
          <SettingsLinkRow label="Log out" tone="danger" onPress={() => {}} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  tripListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tripListBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242,107,100,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripListTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8
  },
  headerTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileHero: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8
  },
  profileAvatarWrap: {
    position: 'relative',
    marginBottom: 12
  },
  profileAvatarEdit: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profilePhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceDeep
  },
  profilePhotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8E6E3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePhotoInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F26B64',
    fontFamily: 'Nunito_800ExtraBold'
  },
  profileAvatarCamera: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f0efed'
  },
  profileName: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold'
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: 'Nunito_400Regular'
  },
  profileBio: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: 'Nunito_400Regular',
    maxWidth: 280
  },
  followButton: {
    backgroundColor: '#F26B64',
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito_700Bold'
  },
  profileActionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  followButtonActive: {
    backgroundColor: '#F26B64',
    borderWidth: 1,
    borderColor: '#F26B64'
  },
  followButtonTextActive: {
    color: '#ffffff'
  },
  headerMessageButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center'
  },
  headerMessageButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 0,
    marginTop: 12,
    paddingHorizontal: 8
  },
  profileDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
    marginBottom: 8
  },
  statCard: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border
  },
  statCardLast: {
    borderRightWidth: 0
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  statLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Nunito_400Regular'
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12
  },
  tripsSection: {
    marginTop: 12,
    marginBottom: 12
  },
  curatedTripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  tripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  tripCard: {
    width: '48%',
    overflow: 'visible'
  },
  tripCardImage: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.trip,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    ...shadow.sm
  },
  tripCardBody: {
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 4
  },
  tripCardTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 1
  },
  tripCardLocation: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400'
  },
  tripCardDate: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400',
    marginTop: 1
  },
  emptyState: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'center'
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  settingsScreenContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  settingsTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  settingsHeaderSpacer: {
    width: 28,
    height: 28
  },
  settingsSection: {
    marginBottom: 16
  },
  settingsSectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: 'Nunito_400Regular'
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  settingsRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  settingsCopy: {
    flex: 1
  },
  settingsLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  },
  settingsLabelDanger: {
    color: '#C9524E',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  },
  settingsDetail: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  settingsDivider: {
    height: 1,
    marginLeft: 16,
    backgroundColor: colors.border
  }
});

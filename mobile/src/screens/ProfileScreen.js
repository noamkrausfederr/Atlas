import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

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

function PublicTripGridCard({ board, onPress }) {
  return (
    <TouchableOpacity style={styles.tripCard} activeOpacity={0.88} onPress={() => onPress(board)}>
      <Image source={{ uri: board.image }} style={styles.tripCardImage} />
      <View style={styles.tripCardBody}>
        <Text style={styles.tripCardTitle} numberOfLines={2}>{board.title}</Text>
        <Text style={styles.tripCardLocation} numberOfLines={1}>{board.location || board.subtitle}</Text>
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
              <Ionicons name="settings-outline" size={22} color="#8a8987" />
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

export function ProfileScreen({ boards, followingCount, onOpenBoard, onOpenSettings }) {
  const publicBoards = boards.filter((board) => board.isPublic === true);
  const totalLikesReceived = publicBoards.reduce((sum, board) => sum + getProfileTripLikeCount(board), 0);

  return (
    <PublicProfileView
      name="Sofia Walker"
      handle="@sofiawalks"
      bio="Travel curator collecting food-first itineraries, soft city mornings, and trips worth sending to the group chat."
      followers="12.4K"
      following={followingCount}
      likes={totalLikesReceived}
      publicBoards={publicBoards}
      onOpenBoard={onOpenBoard}
      hideTripsSection
      showScreenHeader
      showSettingsButton
      onSettingsPress={onOpenSettings}
      showFollowButton={false}
    />
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
      <Ionicons name="chevron-forward" size={18} color={tone === 'danger' ? '#C9524E' : '#8a8987'} />
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
    backgroundColor: '#f0efed'
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
    color: '#2c2b28',
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
  profilePhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e8e5e0'
  },
  profilePhotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff4d9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePhotoInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#c48a00',
    fontFamily: 'Nunito_800ExtraBold'
  },
  profileAvatarCamera: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2c2b28',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f0efed'
  },
  profileName: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: '#2c2b28',
    fontFamily: 'Nunito_800ExtraBold'
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#8a8987',
    fontFamily: 'Nunito_400Regular'
  },
  profileBio: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: '#7a7770',
    fontFamily: 'Nunito_400Regular',
    maxWidth: 280
  },
  followButton: {
    backgroundColor: '#ffba30',
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  followButtonText: {
    color: '#2c2b28',
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
    backgroundColor: '#f0efed',
    borderWidth: 1,
    borderColor: '#e8e5e0'
  },
  followButtonTextActive: {
    color: '#7a7770'
  },
  headerMessageButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e8e5e0',
    justifyContent: 'center'
  },
  headerMessageButtonText: {
    color: '#2c2b28',
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
    backgroundColor: '#e8e5e0',
    marginHorizontal: 8,
    marginBottom: 8
  },
  statCard: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e8e5e0'
  },
  statCardLast: {
    borderRightWidth: 0
  },
  statValue: {
    color: '#2c2b28',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  statLabel: {
    marginTop: 2,
    color: '#8a8987',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Nunito_400Regular'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e8e5e0',
    padding: 18,
    marginBottom: 12
  },
  tripsSection: {
    marginTop: 12,
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#2c2b28',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  sectionMeta: {
    color: '#8a8987',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e5e0',
    shadowColor: '#2c2b28',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  tripCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e8e5e0'
  },
  tripCardBody: {
    padding: 10
  },
  tripCardTitle: {
    color: '#2c2b28',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    marginBottom: 3,
    fontFamily: 'Nunito_700Bold'
  },
  tripCardLocation: {
    color: '#8a8987',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Nunito_400Regular'
  },
  emptyState: {
    backgroundColor: '#f0efed',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8e5e0',
    padding: 18,
    alignItems: 'center'
  },
  emptyStateText: {
    color: '#8a8987',
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
    color: '#2c2b28',
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
    color: '#8a8987',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: 'Nunito_400Regular'
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8e5e0',
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
    color: '#2c2b28',
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
    color: '#8a8987',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  settingsDivider: {
    height: 1,
    marginLeft: 16,
    backgroundColor: '#e8e5e0'
  }
});

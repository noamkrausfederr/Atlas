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
          <Text style={styles.headerTitle}>profile</Text>
        </View>
      ) : null}

      {showSettingsButton ? (
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.85} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={22} color="#555555" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.profileHero}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.profilePhoto} />
        )}
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
          <View style={styles.statCard}>
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
        trackColor={{ false: '#D9D9D3', true: '#111111' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D9D9D3"
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
      <Ionicons name="chevron-forward" size={18} color={tone === 'danger' ? '#B24C4C' : '#8A8A84'} />
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
    backgroundColor: '#F3F3F1'
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 12
  },
  header: {
    marginBottom: 4,
    paddingLeft: 8
  },
  headerTitle: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 6,
    marginBottom: 2
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileHero: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    backgroundColor: '#ECECE8'
  },
  profileName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  profileHandle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#5E5E59',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  profileBio: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: '#555550',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  followButton: {
    backgroundColor: '#111111',
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  profileActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  followButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D2'
  },
  followButtonTextActive: {
    color: '#111111'
  },
  headerMessageButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D8D8D2',
    justifyContent: 'center'
  },
  headerMessageButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    marginTop: 6,
    paddingTop: 8
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#DDDDD7',
    marginHorizontal: 8,
    marginBottom: 8
  },
  statCard: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: 'center'
  },
  statValue: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  statLabel: {
    marginTop: 2,
    color: '#666661',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1E1DC',
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
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  sectionMeta: {
    color: '#6F6F6B',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  tripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  tripCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E1DC'
  },
  tripCardImage: {
    width: '100%',
    height: 146,
    backgroundColor: '#ECECE8'
  },
  tripCardBody: {
    padding: 12
  },
  tripCardTitle: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  tripCardLocation: {
    color: '#6F6F6B',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  emptyState: {
    backgroundColor: '#F7F7F4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1E1DC',
    padding: 18,
    alignItems: 'center'
  },
  emptyStateText: {
    color: '#6F6F6B',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
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
    color: '#111111',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  settingsHeaderSpacer: {
    width: 28,
    height: 28
  },
  settingsSection: {
    marginBottom: 16
  },
  settingsSectionTitle: {
    color: '#6F6F6B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E1DC',
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
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  settingsLabelDanger: {
    color: '#B24C4C',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System'
    })
  },
  settingsDetail: {
    marginTop: 3,
    color: '#6F6F6B',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System'
    })
  },
  settingsDivider: {
    height: 1,
    marginLeft: 16,
    backgroundColor: '#ECECE8'
  }
});

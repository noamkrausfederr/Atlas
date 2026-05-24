import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_PROFILE_IMAGE =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80';

const DEFAULT_TRAVEL_TAGS = ['Foodie', 'Solo', 'Boutique stays', 'City walks', 'Cafe hopping'];

function formatSocialCount(value) {
  if (typeof value === 'string') return value;
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
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
  image = DEFAULT_PROFILE_IMAGE,
  followers,
  following,
  likes,
  travelTags = DEFAULT_TRAVEL_TAGS,
  publicBoards,
  onOpenBoard,
  showFollowButton = true,
  showMessageButton = false,
  isFollowing = false,
  onToggleFollow,
  onMessagePress
}) {
  return (
    <View>
      <View style={styles.profileHero}>
        <Image source={{ uri: image }} style={styles.profilePhoto} />
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileHandle}>{handle}</Text>
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

      <View style={styles.tagSection}>
        <Text style={styles.sectionTitle}>Travel style</Text>
        <View style={styles.tagRow}>
          {travelTags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tripsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Public trips</Text>
          <Text style={styles.sectionMeta}>{publicBoards.length}</Text>
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
    </View>
  );
}

export function ProfileScreen({ boards, likedTrips, followingCount, onOpenBoard }) {
  const publicBoards = boards.filter((board) => board.isPublic !== false);

  return (
    <PublicProfileView
      name="Sofia Walker"
      handle="@sofiawalks"
      bio="Travel curator collecting food-first itineraries, soft city mornings, and trips worth sending to the group chat."
      followers="12.4K"
      following={followingCount}
      likes={likedTrips.length}
      travelTags={DEFAULT_TRAVEL_TAGS}
      publicBoards={publicBoards}
      onOpenBoard={onOpenBoard}
      showFollowButton={false}
    />
  );
}

const styles = StyleSheet.create({
  profileHero: {
    backgroundColor: '#FFF8F0',
    borderRadius: 30,
    paddingVertical: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#E7C7B2',
    shadowOpacity: 0.65,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    backgroundColor: '#D9E7D1'
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4B3A32'
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#A97C50'
  },
  profileBio: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#7A6658'
  },
  followButton: {
    backgroundColor: '#E6A6B3',
    borderRadius: 999,
    minHeight: 48,
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  followButtonText: {
    color: '#FFF8F0',
    fontSize: 15,
    fontWeight: '800'
  },
  profileActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  followButtonActive: {
    backgroundColor: '#EBDCCF'
  },
  followButtonTextActive: {
    color: '#A97C50'
  },
  headerMessageButton: {
    backgroundColor: '#F1E7DA',
    borderRadius: 999,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    justifyContent: 'center'
  },
  headerMessageButtonText: {
    color: '#A97C50',
    fontSize: 15,
    fontWeight: '800'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9DCCF'
  },
  statValue: {
    color: '#4B3A32',
    fontSize: 18,
    fontWeight: '800'
  },
  statLabel: {
    marginTop: 5,
    color: '#8D7E71',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  tagSection: {
    marginBottom: 22
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#4B3A32',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10
  },
  sectionMeta: {
    color: '#A97C50',
    fontSize: 15,
    fontWeight: '800'
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagChip: {
    backgroundColor: '#FFF8F0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4D6C8',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tagChipText: {
    color: '#7A6658',
    fontSize: 12,
    fontWeight: '700'
  },
  tripsSection: {
    marginBottom: 8
  },
  tripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  tripCard: {
    width: '48%',
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DBCD'
  },
  tripCardImage: {
    width: '100%',
    height: 146,
    backgroundColor: '#F1E7DA'
  },
  tripCardBody: {
    padding: 12
  },
  tripCardTitle: {
    color: '#4B3A32',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 4
  },
  tripCardLocation: {
    color: '#A97C50',
    fontSize: 12,
    lineHeight: 16
  },
  emptyState: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 18,
    alignItems: 'center'
  },
  emptyStateText: {
    color: '#A8998A',
    fontWeight: '700'
  }
});

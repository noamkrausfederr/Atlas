import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BoardCard } from '../components/BoardCard';
import { countSavedPlaces } from '../../data/tripUtils';

export function ProfileScreen({ boards, pastTrips, onOpenBoard }) {
  const pinCount = countSavedPlaces(boards);
  const favoriteCount = boards.length;
  const inspoCount = Math.max(1, boards.length - pastTrips.length);

  return (
    <View>
      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.profileName}>Sofia Walker</Text>
        <Text style={styles.profileRole}>Travel curator</Text>
        <Text style={styles.profileBio}>Dreamy boards, curated places, and a map made for your next escape.</Text>
      </View>

      <View style={styles.profileStatsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Boards</Text>
          <Text style={styles.statValue}>{boards.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pins</Text>
          <Text style={styles.statValue}>{pinCount}</Text>
        </View>
      </View>

      {pastTrips.length > 0 && (
        <View style={styles.pastTripsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Archive</Text>
              <Text style={styles.sectionTitle}>Past trips</Text>
            </View>
            <Text style={styles.sectionAction}>{pastTrips.length} completed</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalCards}>
            {pastTrips.map((board) => (
              <BoardCard key={board.id} board={board} onPress={onOpenBoard} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.metricGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Saved</Text>
          <Text style={styles.statValue}>{pinCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Favorites</Text>
          <Text style={styles.statValue}>{favoriteCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Inspo</Text>
          <Text style={styles.statValue}>{inspoCount}</Text>
        </View>
      </View>

      <View style={styles.profileActions}>
        <TouchableOpacity style={[styles.detailActionButton, styles.profileLogoutButton]}>
          <Text style={[styles.detailActionText, styles.profileLogoutText]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#F9D5E5',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    alignItems: 'center'
  },
  avatarPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 42,
    backgroundColor: '#F4D8EE',
    marginBottom: 18
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2A0A2B',
    marginBottom: 6
  },
  profileRole: {
    color: '#7D3DBA',
    fontSize: 14,
    marginBottom: 14
  },
  profileBio: {
    textAlign: 'center',
    color: '#6F3E56',
    lineHeight: 22,
    fontSize: 15
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500'
  },
  statValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A'
  },
  pastTripsSection: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionLabel: {
    color: '#C26CF8',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A0A2B',
    marginTop: 4
  },
  sectionAction: {
    color: '#7D3DBA',
    fontWeight: '700'
  },
  horizontalCards: {
    marginBottom: 24
  },
  profileActions: {
    gap: 12
  },
  detailActionButton: {
    backgroundColor: '#DD77F2',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center'
  },
  detailActionText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  profileLogoutButton: {
    backgroundColor: '#F9EEF8'
  },
  profileLogoutText: {
    color: '#7D3DBA'
  }
});

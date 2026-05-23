import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { BoardCard } from '../components/BoardCard';
import { countSavedPlaces } from '../../data/tripUtils';

export function ProfileScreen({ boards, pastTrips, onOpenBoard }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pinCount = countSavedPlaces(boards);

  if (isSettingsOpen) {
    return (
      <View style={styles.settingsScreen}>
        <View style={styles.settingsHeader}>
          <TouchableOpacity style={styles.settingsBackButton} onPress={() => setIsSettingsOpen(false)}>
            <Text style={styles.settingsBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>Settings</Text>
        </View>

        <View style={styles.settingsBody}>
          <Text style={styles.settingsSectionTitle}>Account</Text>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsRowLabel}>Sofia Walker</Text>
            <Text style={styles.settingsRowValue}>Travel curator</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.detailActionButton, styles.profileLogoutButton]}>
          <Text style={[styles.detailActionText, styles.profileLogoutText]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.settingsButton} onPress={() => setIsSettingsOpen(true)}>
        <Text style={styles.settingsButtonText}>Settings</Text>
      </TouchableOpacity>

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

      <View style={styles.pastTripsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>Archive</Text>
            <Text style={styles.sectionTitle}>Past trips</Text>
          </View>
          <Text style={styles.sectionAction}>{pastTrips.length} completed</Text>
        </View>
        {pastTrips.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalCards}>
            {pastTrips.map((board) => (
              <BoardCard key={board.id} board={board} onPress={onOpenBoard} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyPastTrips}>
            <Text style={styles.emptyPastTripsText}>No past trips yet.</Text>
          </View>
        )}
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12
  },
  settingsButtonText: {
    color: '#7D3DBA',
    fontSize: 12,
    fontWeight: '800'
  },
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
  emptyPastTrips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    alignItems: 'center'
  },
  emptyPastTripsText: {
    color: '#94A3B8',
    fontWeight: '700'
  },
  settingsScreen: {
    minHeight: '100%',
    paddingBottom: 120
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  settingsBackButton: {
    backgroundColor: '#F6E4F8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  settingsBackText: {
    color: '#7D3DBA',
    fontWeight: '800'
  },
  settingsTitle: {
    color: '#2A0A2B',
    fontSize: 22,
    fontWeight: '800'
  },
  settingsBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 'auto'
  },
  settingsSectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12
  },
  settingsRow: {
    gap: 4
  },
  settingsRowLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800'
  },
  settingsRowValue: {
    color: '#7D3DBA',
    fontSize: 13,
    fontWeight: '700'
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

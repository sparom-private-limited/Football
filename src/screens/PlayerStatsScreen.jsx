import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import API from '../api/api';
import MainLayout from '../components/MainLayout';

export default function PlayerStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get('/api/player/me');
      setPlayer(res.data.player);
      setUser(res.data.user);
    } catch (err) {
      console.log('PLAYER STATS ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="My Stats">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  const stats = [
    {label: 'Matches', value: player.matchesPlayed},
    {label: 'Goals', value: player.goals},
    {label: 'Assists', value: player.assists},
    {label: 'Clean Sheets', value: player.cleanSheets},
    {label: 'Yellow Cards', value: player.yellowCards},
    {label: 'Red Cards', value: player.redCards},
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* PLAYER HEADER */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          {player.profileImageUrl ? (
            <Image
              source={{uri: player.profileImageUrl}}
              style={styles.heroAvatar}
            />
          ) : (
            <View style={styles.heroAvatarFallback}>
              <Text style={styles.heroAvatarText}>
                {user?.name?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{flex: 1}}>
            <Text style={styles.heroName}>{user?.name}</Text>

            <View style={styles.heroRow}>
              <Text style={styles.heroPosition}>{player.position}</Text>
              <View
                style={[
                  styles.heroStatus,
                  {backgroundColor: player.teamId ? '#16A34A' : '#F97316'},
                ]}>
                <Text style={styles.heroStatusText}>
                  {player.teamId ? 'SIGNED' : 'FREE AGENT'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* QUICK STATS GRID */}
      <View style={styles.impactRow}>
        <ImpactStat label="Goals" value={player.goals} color="#16A34A" />
        <ImpactStat label="Assists" value={player.assists} color="#2563EB" />
        <ImpactStat
          label="Matches"
          value={player.matchesPlayed}
          color="#0F172A"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>

        <View style={styles.performanceRow}>
          <PerformanceItem label="Clean Sheets" value={player.cleanSheets} />
          <PerformanceItem
            label="Yellow Cards"
            value={player.yellowCards}
            danger
          />
          <PerformanceItem label="Red Cards" value={player.redCards} danger />
        </View>
      </View>
    </ScrollView>
  );
}

function ImpactStat({label, value, color}) {
  return (
    <View style={styles.impactCard}>
      <Text style={[styles.impactValue, {color}]}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function PerformanceItem({label, value, danger}) {
  return (
    <View style={styles.performanceItem}>
      <Text style={styles.performanceValue}>{value}</Text>
      <Text style={[styles.performanceLabel, danger && {color: '#DC2626'}]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 10,
  },

  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },

  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  meta: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  hero: {
    backgroundColor: '#1D4ED8',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  heroAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },

  heroName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },

  heroPosition: {
    color: '#DBEAFE',
    fontWeight: '700',
  },

  heroStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  heroStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  impactCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 3,
  },

  impactValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  impactLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0F172A',
  },

  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  performanceItem: {
    alignItems: 'center',
    width: '30%',
  },

  performanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  performanceLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

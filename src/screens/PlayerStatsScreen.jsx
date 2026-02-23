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
import {s, vs, ms, rf} from '../utils/responsive';

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

  if (!player) {
    return (
      <MainLayout title="My Stats">
        <View style={styles.center}>
          <Text style={styles.emptyText}>No player data found.</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Stats">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>

        {/* ── HERO CARD ── */}
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
                  {user?.name?.[0]?.toUpperCase() || 'P'}
                </Text>
              </View>
            )}

            <View style={{flex: 1}}>
              <Text style={styles.heroName}>{user?.name}</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroPosition}>{player.position || 'Player'}</Text>
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

          {/* Season summary inside hero */}
          <View style={styles.heroStats}>
            <HeroStat label="Matches" value={player.matchesPlayed ?? 0} />
            <View style={styles.heroDivider} />
            <HeroStat label="Goals" value={player.goals ?? 0} />
            <View style={styles.heroDivider} />
            <HeroStat label="Assists" value={player.assists ?? 0} />
          </View>
        </View>

        {/* ── ATTACKING ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚽</Text>
            <Text style={styles.sectionTitle}>Attacking</Text>
          </View>
          <View style={styles.statGrid}>
            <StatTile label="Goals" value={player.goals ?? 0} color="#16A34A" />
            <StatTile label="Assists" value={player.assists ?? 0} color="#2563EB" />
          </View>
        </View>

        {/* ── DISCIPLINE ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🟨</Text>
            <Text style={styles.sectionTitle}>Discipline</Text>
          </View>
          <View style={styles.statGrid}>
            <StatTile
              label="Yellow Cards"
              value={player.yellowCards ?? 0}
              color="#EAB308"
            />
            <StatTile
              label="Red Cards"
              value={player.redCards ?? 0}
              color="#DC2626"
            />
          </View>
        </View>

        {/* ── GOALKEEPER / DEFENCE ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧤</Text>
            <Text style={styles.sectionTitle}>Defence</Text>
          </View>
          <View style={styles.statGrid}>
            <StatTile
              label="Clean Sheets"
              value={player.cleanSheets ?? 0}
              color="#0EA5E9"
            />
            <StatTile
              label="Matches Played"
              value={player.matchesPlayed ?? 0}
              color="#6366F1"
            />
          </View>
        </View>

      </ScrollView>
    </MainLayout>
  );
}

/* ── Sub Components ── */

function HeroStat({label, value}) {
  return (
    <View style={styles.heroStatItem}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function StatTile({label, value, color}) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statTileValue, {color}]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
      {/* Bottom accent bar */}
      <View style={[styles.statTileBar, {backgroundColor: color}]} />
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  container: {
    paddingBottom: vs(40),
    backgroundColor: '#F1F5F9',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: rf(15),
    color: '#64748B',
  },

  /* ── HERO ── */
  hero: {
    backgroundColor: '#2563EB',
    padding: s(20),
    marginBottom: vs(12),
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    marginBottom: vs(20),
  },

  heroAvatar: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  heroAvatarFallback: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  heroAvatarText: {
    color: '#fff',
    fontSize: ms(28),
    fontWeight: '800',
  },

  heroName: {
    color: '#fff',
    fontSize: ms(22),
    fontWeight: '800',
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(6),
    gap: s(10),
  },

  heroPosition: {
    color: '#BFDBFE',
    fontWeight: '700',
    fontSize: rf(14),
  },

  heroStatus: {
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: ms(20),
  },

  heroStatusText: {
    color: '#fff',
    fontSize: rf(11),
    fontWeight: '800',
  },

  /* Hero bottom stat row */
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: ms(14),
    paddingVertical: vs(14),
  },

  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },

  heroStatValue: {
    color: '#FFFFFF',
    fontSize: ms(24),
    fontWeight: '900',
  },

  heroStatLabel: {
    color: '#BFDBFE',
    fontSize: rf(12),
    fontWeight: '600',
    marginTop: vs(2),
  },

  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: vs(4),
  },

  /* ── SECTION CARD ── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginBottom: vs(12),
    borderRadius: ms(16),
    padding: s(16),
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(14),
  },

  sectionIcon: {
    fontSize: ms(18),
  },

  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ── STAT GRID ── */
  statGrid: {
    flexDirection: 'row',
    gap: s(12),
  },

  statTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    padding: s(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  statTileValue: {
    fontSize: ms(32),
    fontWeight: '900',
  },

  statTileLabel: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#64748B',
    marginTop: vs(4),
    textAlign: 'center',
  },

  statTileBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: vs(3),
    opacity: 0.7,
  },
});
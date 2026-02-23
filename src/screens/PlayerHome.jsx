import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import API from '../api/api';
import MainLayout from '../components/MainLayout';
import useNavigationHelper from '../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../utils/responsive';

export default function PlayerHome() {
  const nav = useNavigationHelper();
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    fetchPlayerDetails();
  }, []);

  const fetchPlayerDetails = async () => {
    try {
      const res = await API.get('/api/player/me');
      setIsProfileCompleted(res.data.isProfileCompleted);
      setUser(res.data.user);
      setPlayer(res.data.player);
    } catch (err) {
      console.log('PLAYER HOME ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Player Profile">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }


  return (
    <MainLayout title="Player Profile">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER CARD ── */}
        <View style={styles.heroCard}>
          {/* Avatar + Name Row */}
          <View style={styles.heroRow}>
            <View style={styles.avatarWrapper}>
              {player?.profileImageUrl ? (
                <Image
                  source={{uri: player.profileImageUrl}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user?.name?.[0]?.toUpperCase() || 'P'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{user?.name || 'Player'}</Text>
                {/* Avg rating badge */}
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>☆</Text>
                  <Text style={styles.ratingText}>
                    {player?.avgRating
                      ? `${player.avgRating} Avg rating`
                      : 'No rating yet'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroMeta}>
                {player?.position || 'Position'} •{' '}
                {player?.teamId ? 'Team Player' : 'Free Agent'} •{' '}
                {player?.preferredFoot
                  ? `${player.preferredFoot}-footed`
                  : 'Not set'}
              </Text>

              {/* Attribute pills */}
              <View style={styles.pillsRow}>
                {player?.pace != null && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Pace {player.pace}</Text>
                  </View>
                )}
                {player?.finishing != null && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      Finishing {player.finishing}
                    </Text>
                  </View>
                )}
                {player?.pressing != null && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      Pressing {player.pressing}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── PROFILE INCOMPLETE WARNING ── */}
        {!isProfileCompleted && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Complete Your Profile</Text>
            <Text style={styles.warningText}>
              Add your details to join teams and tournaments.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => nav.toProfile('PlayerProfileEdit')}>
              <Text style={styles.primaryBtnText}>Complete Profile →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── THIS SEASON CARD ── */}
        <View style={styles.card}>
          <View style={styles.seasonRow}>
            <View style={styles.seasonLeft}>
              <View style={styles.seasonIconWrap}>
                <Text style={styles.seasonIcon}>📈</Text>
              </View>
              <View>
                <Text style={styles.seasonTitle}>This season</Text>
                <Text style={styles.seasonMeta}>
                  {player?.matchesPlayed || 0} matches •{' '}
                  {player?.goals || 0} goals •{' '}
                  {player?.assists || 0} assists
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewStatsBtn}
              onPress={() => nav.toProfile('PlayerStats')}>
              <Text style={styles.viewStatsBtnText}>View full stats</Text>
            </TouchableOpacity>
          </View>
        </View>       

        {/* ── KEY NUMBERS CARD ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Key numbers</Text>
              <Text style={styles.cardSubtitle}>All competitions</Text>
            </View>
            <View style={styles.per90Badge}>
              <Text style={styles.per90Text}>Per 90</Text>
            </View>
          </View>

          {/* 3x2 Stat Grid */}
          <View style={styles.statGrid}>
            <StatCell label="Goals" value={player?.goals ?? 0} />
            <StatCell label="Assists" value={player?.assists ?? 0} />
            <StatCell label="Matches" value={player?.matchesPlayed ?? 0} />
            <StatCell label="Shots on target" value={player?.shotsOnTarget ?? 0} />
            <StatCell label="Clean sheets" value={player?.cleanSheets ?? 0} />
            <StatCell label="Yellow cards" value={player?.yellowCards ?? 0} />
          </View>

          {/* Tag pills */}
          <View style={styles.tagRow}>
            {player?.teamId ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>⚡ Team Player</Text>
              </View>
            ) : (
              <View style={styles.tag}>
                <Text style={styles.tagText}>🆓 Free Agent</Text>
              </View>
            )}
            {player?.position && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  🎯 {player.position} specialist
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <Text style={styles.cardSubtitle}>Jump to a section</Text>
          <View style={styles.actionsRow}>
            <ActionCard
              emoji="⚽"
              label="My Matches"
              onPress={() => nav.toMatch('MyMatches')}
            />
            <ActionCard
              emoji="📊"
              label="My Stats"
              onPress={() => nav.toProfile('PlayerStats')}
            />
            <ActionCard
              emoji="✏️"
              label="Edit Profile"
              onPress={() => nav.toProfile('PlayerProfileEdit')}
            />
            {/* <ActionCard
              emoji="🏆"
              label="Tournaments"
              onPress={() => nav.toTournament('JoinTournament')}
            /> */}
          </View>
        </View>

      </ScrollView>
    </MainLayout>
  );
}

/* ─── Small Components ─── */

function StatCell({label, value}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellValue}>{value}</Text>
      <Text style={styles.statCellLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({emoji, label, onPress}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Styles ─── */

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

  /* ── HERO ── */
  heroCard: {
    backgroundColor: '#2563EB',
    padding: s(20),
    marginBottom: vs(12),
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(14),
  },

  avatarWrapper: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    overflow: 'hidden',
    backgroundColor: '#1D4ED8',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  avatar: {
    width: '100%',
    height: '100%',
  },

  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: ms(28),
    fontWeight: '800',
  },

  heroInfo: {
    flex: 1,
  },

  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: s(6),
  },

  heroName: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(20),
    gap: s(4),
  },

  ratingStar: {
    fontSize: rf(11),
    color: '#FCD34D',
  },

  ratingText: {
    fontSize: rf(11),
    color: '#FFFFFF',
    fontWeight: '700',
  },

  heroMeta: {
    fontSize: rf(13),
    color: '#BFDBFE',
    marginTop: vs(4),
    fontWeight: '500',
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginTop: vs(10),
  },

  pill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },

  pillText: {
    color: '#FFFFFF',
    fontSize: rf(12),
    fontWeight: '700',
  },

  /* ── WARNING ── */
  warningCard: {
    backgroundColor: '#FFF7ED',
    padding: s(16),
    marginHorizontal: s(16),
    borderRadius: ms(14),
    marginBottom: vs(12),
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },

  warningTitle: {
    fontWeight: '700',
    color: '#9A3412',
    fontSize: rf(15),
  },

  warningText: {
    marginTop: vs(4),
    color: '#9A3412',
    fontSize: rf(13),
  },

  primaryBtn: {
    marginTop: vs(10),
    backgroundColor: '#2563EB',
    paddingVertical: vs(10),
    borderRadius: ms(8),
    alignItems: 'center',
  },

  primaryBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: rf(14),
  },

  /* ── CARD ── */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginBottom: vs(12),
    padding: s(16),
    borderRadius: ms(16),
    elevation: 1,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },

  cardTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  cardSubtitle: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: vs(2),
  },

  /* ── THIS SEASON ── */
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  seasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    flex: 1,
  },

  seasonIconWrap: {
    width: s(38),
    height: s(38),
    borderRadius: ms(10),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  seasonIcon: {
    fontSize: ms(18),
  },

  seasonTitle: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },

  seasonMeta: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: vs(2),
  },

  viewStatsBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: ms(8),
  },

  viewStatsBtnText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#2563EB',
  },


  /* ── PER90 BADGE ── */
  per90Badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },

  per90Text: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
  },

  /* ── STAT GRID ── */
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(12),
  },

  statCell: {
    width: '30.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: ms(10),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },

  statCellValue: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#0F172A',
  },

  statCellLabel: {
    fontSize: rf(11),
    color: '#64748B',
    marginTop: vs(2),
    textAlign: 'center',
    fontWeight: '600',
  },

  /* ── TAGS ── */
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },

  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(20),
  },

  tagText: {
    fontSize: rf(12),
    color: '#2563EB',
    fontWeight: '600',
  },

  /* ── QUICK ACTIONS ── */
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
    marginTop: vs(12),
  },

  actionCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    paddingVertical: vs(16),
    borderRadius: ms(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  actionEmoji: {
    fontSize: ms(24),
    marginBottom: vs(6),
  },

  actionText: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: rf(13),
  },
});
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import API from '../../api/api';
import { useRoute } from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';
import Pitch from '../../components/lineup/Pitch';
import {s, vs, ms, rf} from '../../utils/responsive';

const TABS = ['Info', 'Stats', 'Lineups', 'Timeline'];

export default function MatchSummaryScreen() {
  const { params } = useRoute();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Stats');
  const nav = useNavigationHelper(); 
  const [lineups, setLineups] = useState(null);
  const [selectedLineupTeam, setSelectedLineupTeam] = useState(null);
  // 'home' | 'away' | null

  const lineupMap = useMemo(() => {
    if (!lineups) return null;

    const mapSide = side => {
      if (!Array.isArray(lineups?.[side]?.starting)) return {};
      return Object.fromEntries(
        lineups[side].starting
          .filter(s => s && s.slotKey && s.player)
          .map(s => [s.slotKey, s.player]),
      );
    };

    return {
      home: mapSide('home'),
      away: mapSide('away'),
    };
  }, [lineups]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [summaryRes, lineupRes] = await Promise.all([
      API.get(`/api/match/${params.matchId}/summary`),
      API.get(`/api/match/${params.matchId}/lineups`),
    ]);

const normalizeEvent = e => {
  return {
    type: e.type,
    minute: e.minute,
    team: String(e.teamId || e.team),
      teamName: e.teamName || 'Unknown Team', // ✅ ADD THIS


    // 🔑 Convert string → object
    player: e.player
      ? {
          name: e.player,
        }
      : null,

    assistPlayer: e.assist
      ? {
          name: e.assist,
        }
      : null,

    substitutedPlayer: e.substitutedPlayer
      ? {
          name: e.substitutedPlayer,
        }
      : null,
  };
};
 
    const summary = summaryRes.data;

    setMatch({
      _id: summary.match.id,
      status: summary.match.status,
      venue: summary.match.venue,
      startedAt: summary.match.startedAt,
      completedAt: summary.match.completedAt,

      homeTeam: {
        _id: summary.teams.home.id,
        teamName: summary.teams.home.name,
        teamLogoUrl: summary.teams.home.logo,
      },

      awayTeam: {
        _id: summary.teams.away.id,
        teamName: summary.teams.away.name,
        teamLogoUrl: summary.teams.away.logo,
      },

      score: {
        home: summary.teams.home.score,
        away: summary.teams.away.score,
      },

      winner: summary.winner ? { teamName: summary.winner.teamName } : null,

     events: [
  ...summary.summary.goals.map(normalizeEvent),
  ...summary.summary.cards.map(normalizeEvent),
  ...summary.summary.substitutions.map(normalizeEvent),
],

    });

    setLineups(lineupRes.data);
    setLoading(false);
  };

  const stats = useMemo(() => {
    if (!match) return null;

    const base = {
      home: { goals: 0, fouls: 0, yellow: 0, red: 0 },
      away: { goals: 0, fouls: 0, yellow: 0, red: 0 },
    };

    match.events.forEach(e => {
      const side =
        String(e.team) === String(match.homeTeam._id) ? 'home' : 'away';

      if (['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.type))
        base[side].goals++;
      if (e.type === 'YELLOW') base[side].yellow++;
      if (e.type === 'RED') base[side].red++;
      if (e.type === 'FOUL') base[side].fouls++;
    });

    return base;
  }, [match]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const isDraw = match.score.home === match.score.away;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => nav.back()}
          style={styles.backBtn}
        >
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Match Summary</Text>

        {/* Spacer to keep title centered */}
        <View style={styles.headerSpacer} />
      </View>

      {/* HERO SCORE CARD */}
      <View style={styles.heroCard}>
        <Team team={match.homeTeam} />
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            {match.score.home} : {match.score.away}
          </Text>
          <Text style={styles.statusText}>FULL TIME</Text>
        </View>
        <Team team={match.awayTeam} />
      </View>

      <Text style={styles.winner}>
        {isDraw ? 'Match Drawn' : `Winner: ${match.winner?.teamName}`}
      </Text>

      {/* TABS */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB CONTENT */}
      {activeTab === 'Stats' && (
        <View style={styles.statsCard}>
          <BigStat
            label="Goals"
            left={stats.home.goals}
            right={stats.away.goals}
          />
          <BigStat
            label="Yellow Cards"
            left={stats.home.yellow}
            right={stats.away.yellow}
          />
          <BigStat
            label="Red Cards"
            left={stats.home.red}
            right={stats.away.red}
          />
          <BigStat
            label="Fouls"
            left={stats.home.fouls}
            right={stats.away.fouls}
          />
        </View>
      )}

      {/* LINEUPS TAB */}

      {activeTab === 'Lineups' && lineups && (
        <View style={styles.lineupsCard}>
          {/* TEAM SELECTOR */}
          <View style={styles.teamSelector}>
            <TouchableOpacity
              style={[
                styles.teamSelectBtn,
                selectedLineupTeam === 'home' && styles.teamSelectActive,
              ]}
              onPress={() => setSelectedLineupTeam('home')}
            >
              <Text
                style={[
                  styles.teamSelectText,
                  selectedLineupTeam === 'home' && styles.teamSelectTextActive,
                ]}
              >
                {match.homeTeam.teamName}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.teamSelectBtn,
                selectedLineupTeam === 'away' && styles.teamSelectActive,
              ]}
              onPress={() => setSelectedLineupTeam('away')}
            >
              <Text
                style={[
                  styles.teamSelectText,
                  selectedLineupTeam === 'away' && styles.teamSelectTextActive,
                ]}
              >
                {match.awayTeam.teamName}
              </Text>
            </TouchableOpacity>
          </View>

          {/* LINEUP VIEW */}
          {selectedLineupTeam && (
            <>
              {/* PITCH */}
              {lineups[selectedLineupTeam]?.formation && (
                <View style={styles.pitchWrapper}>
                  <Pitch
                    formation={lineups[selectedLineupTeam].formation}
                    lineup={lineupMap[selectedLineupTeam]}
                    readOnly
                  />
                </View>
              )}

              {/* BENCH */}
              <Text style={styles.benchTitle}>Bench</Text>
              <FlatList
                data={lineups[selectedLineupTeam]?.bench || []}
                keyExtractor={p => p._id}
                renderItem={({ item }) => (
                  <View style={styles.benchItem}>
                    <Text style={styles.benchText}>{item.name}</Text>
                  </View>
                )}
              />
            </>
          )}

          {!selectedLineupTeam && (
            <Text style={styles.lineupHint}>
              Tap a team name to view lineup
            </Text>
          )}
        </View>
      )}

      {activeTab === 'Timeline' && (
        <FlatList
          data={[...match.events].sort((a, b) => a.minute - b.minute)}
          keyExtractor={(item, index) =>
            `${item.type}-${item.minute}-${item.player?._id || 'x'}-${index}`
          }
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TimelineCard event={item} homeTeamId={match.homeTeam._id} />
          )}
        />
      )}

      {activeTab === 'Info' && (
        <View style={styles.infoGrid}>
          <InfoCard label="Venue" value={match.venue || 'TBD'} icon="📍" />
          <InfoCard label="Format" value={match.format} icon="⚽" />
          <InfoCard label="Type" value={match.matchType} icon="🏆" />
          <InfoCard
            label="Completed At"
            value={new Date(match.completedAt).toLocaleString()}
            icon="⏱️"
          />
        </View>
      )}
    </View>
  );
}

/* ---------- UI PARTS ---------- */

function Team({ team }) {
  return (
    <View style={styles.team}>
      {team.teamLogoUrl ? (
        <Image source={{ uri: team.teamLogoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoText}>{team.teamName[0]}</Text>
        </View>
      )}
      <Text style={styles.teamName}>{team.teamName}</Text>
    </View>
  );
}

function BigStat({ label, left, right }) {
  return (
    <View style={styles.bigStatRow}>
      <Text style={styles.bigNumber}>{left}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigNumber}>{right}</Text>
    </View>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <View style={styles.infoBigCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoBigLabel}>{label}</Text>
      <Text style={styles.infoBigValue}>{value}</Text>
    </View>
  );
}

function TimelineCard({ event, homeTeamId }) {
  const isHome = String(event.team) === String(homeTeamId);

  const config = getEventConfig(event.type);

  return (
    <View style={[styles.timelineCard, { borderLeftColor: config.color }]}>
      {/* TOP ROW */}
      <View style={styles.timelineHeader}>
        <Text style={[styles.eventIcon, { color: config.color }]}>
          {config.icon}
        </Text>

        <Text style={styles.minuteBig}>{event.minute}'</Text>
      </View>

      {/* MAIN CONTENT */}
      <Text style={styles.playerName}>
        {event.player?.name || 'Unknown Player'}
      </Text>

      {/* ASSIST */}
      {event.assistPlayer && (
        <Text style={styles.assistText}>Assist: {event.assistPlayer.name}</Text>
      )}

      {/* SUB */}
      {event.type === 'SUBSTITUTION' && (
        <Text style={styles.assistText}>
          ↘ OUT: {event.substitutedPlayer?.name}
        </Text>
      )}

      {/* TEAM SIDE */}
<Text style={styles.teamSide}>{event.teamName}</Text>
    </View>
  );
}

function getEventConfig(type) {
  switch (type) {
    case 'GOAL':
    case 'PENALTY_GOAL':
      return { icon: '⚽', color: '#16A34A' };

    case 'OWN_GOAL':
      return { icon: '🥅', color: '#DC2626' };

    case 'YELLOW':
      return { icon: '🟨', color: '#FACC15' };

    case 'RED':
      return { icon: '🟥', color: '#DC2626' };

    case 'SUBSTITUTION':
      return { icon: '🔄', color: '#2563EB' };

    default:
      return { icon: '•', color: '#64748B' };
  }
}

/* ---------- STYLES ---------- */

// const styles = StyleSheet.create({
//   /* ===== SCREEN ===== */

//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//     padding: 16,
//   },

//   /* ===== HEADER ===== */

//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     marginBottom: 12,
//   },

//   backBtn: {
//     width: 50,
//     height: 40,
//     justifyContent: 'center',
//   },

//   back: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   title: {
//     flex: 1,
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#0F172A',
//   },

//   headerSpacer: {
//     width: 50,
//   },

//   /* ===== HERO SCORE CARD ===== */

//   heroCard: {
//     backgroundColor: '#2563EB',
//     borderRadius: 20,
//     paddingVertical: 24, // ⬅ increase this (default ~16)
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },

//   team: {
//     alignItems: 'center',
//     width: 90,
//   },

//   logo: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//   },

//   logoFallback: {
//     width: 60,
//     height: 60,
//     borderRadius: 32,
//     backgroundColor: '#E5E7EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   logoText: {
//     fontWeight: '800',
//     color: '#111827',
//   },

//   teamName: {
//     marginTop: 6,
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#FFFFFF',
//     textAlign: 'center',
//   },

//   scoreBox: {
//     alignItems: 'center',
//   },

//   scoreText: {
//     fontSize: 40,
//     fontWeight: '900',
//     color: '#FFFFFF',
//   },

//   statusText: {
//     marginTop: 4,
//     fontSize: 12,
//     color: '#DBEAFE',
//     fontWeight: '700',
//   },

//   winner: {
//     textAlign: 'center',
//     marginVertical: 10,
//     fontWeight: '700',
//     color: '#1D4ED8',
//   },

//   /* ===== TABS ===== */

//   tabs: {
//     flexDirection: 'row',
//     backgroundColor: '#E5E7EB',
//     borderRadius: 12,
//     marginVertical: 12,
//   },

//   tab: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//   },

//   activeTab: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//   },

//   tabText: {
//     fontWeight: '700',
//     color: '#475569',
//   },

//   activeTabText: {
//     color: '#2563EB',
//   },

//   /* ===== STATS ===== */

//   statsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     paddingVertical: 20,
//     paddingHorizontal: 16,
//   },

//   bigStatRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 14,
//   },

//   bigNumber: {
//     fontSize: 26,
//     fontWeight: '900',
//     color: '#0F172A',
//   },

//   bigLabel: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#64748B',
//   },

//   /* ===== TIMELINE ===== */

//   timelineCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 12,
//     marginBottom: 10,
//     borderLeftWidth: 5,
//     elevation: 2,
//   },

//   timelineHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6, // ⬅ reduced
//   },

//   eventIcon: {
//     fontSize: 20, // ⬅ reduced (was 26)
//     marginRight: 8,
//   },

//   minuteBig: {
//     fontSize: 16, // ⬅ reduced (was 20)
//     fontWeight: '900',
//     color: '#0F172A',
//   },

//   playerName: {
//     fontSize: 15, // ⬅ reduced (was 18)
//     fontWeight: '800',
//     color: '#0F172A',
//   },

//   assistText: {
//     marginTop: 4, // ⬅ tighter
//     fontSize: 12, // ⬅ reduced
//     fontWeight: '600',
//     color: '#475569',
//   },

//   teamSide: {
//     marginTop: 6, // ⬅ reduced
//     fontSize: 11, // ⬅ reduced
//     fontWeight: '700',
//     color: '#64748B',
//   },

//   /* ===== INFO ===== */

//   infoGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },

//   infoBigCard: {
//     width: '48%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 18,
//     marginBottom: 14,
//     elevation: 2,
//   },

//   infoIcon: {
//     fontSize: 26,
//     marginBottom: 10,
//   },

//   infoBigLabel: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#64748B',
//   },

//   infoBigValue: {
//     marginTop: 6,
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#0F172A',
//   },
//   lineupsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 16,
//   },

//   lineupTeamTitle: {
//     marginVertical: 10,
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0F172A',
//     textAlign: 'center',
//   },

//   /* ===== LINEUPS ===== */

//   lineupsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 16,
//   },

//   teamSelector: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     marginBottom: 14,
//   },

//   teamSelectBtn: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 14,
//     backgroundColor: '#F1F5F9',
//     alignItems: 'center',
//   },

//   teamSelectActive: {
//     backgroundColor: '#2563EB',
//   },

//   teamSelectText: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#334155',
//   },

//   teamSelectTextActive: {
//     color: '#FFFFFF',
//   },

//   pitchWrapper: {
//     borderRadius: 18,
//     overflow: 'hidden',
//     backgroundColor: '#0F5132',
//     padding: 6,
//     marginBottom: 14,
//   },

//   benchTitle: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#64748B',
//     marginBottom: 8,
//   },

//   benchItem: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },

//   benchText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   lineupHint: {
//     textAlign: 'center',
//     marginTop: 20,
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#64748B',
//   },
// });

const styles = StyleSheet.create({
  /* ===== SCREEN ===== */

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: s(16),
  },

  /* ===== HEADER ===== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(15),
    marginBottom: vs(12),
  },

  backBtn: {
    width: s(50),
    height: vs(40),
    justifyContent: 'center',
  },

  back: {
    fontSize: ms(22),
    fontWeight: '700',
    color: '#0F172A',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  headerSpacer: {
    width: s(50),
  },

  /* ===== HERO SCORE CARD ===== */

  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: ms(20),
    paddingVertical: vs(24),
    paddingHorizontal: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  team: {
    alignItems: 'center',
    width: s(90),
  },

  logo: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
  },

  logoFallback: {
    width: s(60),
    height: s(60),
    borderRadius: s(32),
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontWeight: '800',
    color: '#111827',
    fontSize: rf(14),
  },

  teamName: {
    marginTop: vs(6),
    fontSize: rf(14),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  scoreBox: {
    alignItems: 'center',
  },

  scoreText: {
    fontSize: ms(40),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  statusText: {
    marginTop: vs(4),
    fontSize: rf(12),
    color: '#DBEAFE',
    fontWeight: '700',
  },

  winner: {
    textAlign: 'center',
    marginVertical: vs(10),
    fontWeight: '700',
    color: '#1D4ED8',
    fontSize: rf(14),
  },

  /* ===== TABS ===== */

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: ms(12),
    marginVertical: vs(12),
  },

  tab: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
  },

  tabText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: rf(13),
  },

  activeTabText: {
    color: '#2563EB',
  },

  /* ===== STATS ===== */

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    paddingVertical: vs(20),
    paddingHorizontal: s(16),
  },

  bigStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(14),
  },

  bigNumber: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#0F172A',
  },

  bigLabel: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#64748B',
  },

  /* ===== TIMELINE ===== */

  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(12),
    marginBottom: vs(10),
    borderLeftWidth: 5,
    elevation: 2,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
  },

  eventIcon: {
    fontSize: ms(20),
    marginRight: s(8),
  },

  minuteBig: {
    fontSize: rf(16),
    fontWeight: '900',
    color: '#0F172A',
  },

  playerName: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
  },

  assistText: {
    marginTop: vs(4),
    fontSize: rf(12),
    fontWeight: '600',
    color: '#475569',
  },

  teamSide: {
    marginTop: vs(6),
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
  },

  /* ===== INFO ===== */

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoBigCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(18),
    marginBottom: vs(14),
    elevation: 2,
  },

  infoIcon: {
    fontSize: ms(26),
    marginBottom: vs(10),
  },

  infoBigLabel: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#64748B',
  },

  infoBigValue: {
    marginTop: vs(6),
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  lineupsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(16),
  },

  lineupTeamTitle: {
    marginVertical: vs(10),
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* ===== LINEUPS ===== */

  teamSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(12),
    marginBottom: vs(14),
  },

  teamSelectBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: ms(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },

  teamSelectActive: {
    backgroundColor: '#2563EB',
  },

  teamSelectText: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#334155',
  },

  teamSelectTextActive: {
    color: '#FFFFFF',
  },

  pitchWrapper: {
    borderRadius: ms(18),
    overflow: 'hidden',
    backgroundColor: '#0F5132',
    padding: s(6),
    marginBottom: vs(14),
  },

  benchTitle: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: vs(8),
  },

  benchItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  benchText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },

  lineupHint: {
    textAlign: 'center',
    marginTop: vs(20),
    fontSize: rf(13),
    fontWeight: '600',
    color: '#64748B',
  },
});


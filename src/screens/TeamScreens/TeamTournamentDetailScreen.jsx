import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import { s, vs, ms, rf } from '../../utils/responsive';

export default function TeamTournamentDetailScreen() {
  const route = useRoute();
const nav = useNavigationHelper();
  const { tournamentId } = route.params || {};

  const [tournament, setTournament] = useState(null);
  const [teamContext, setTeamContext] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId]);

  const load = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        API.get(`/api/tournament/${tournamentId}/teamView`),
        API.get(`/api/match/byTournament/${tournamentId}`),
      ]);

      setTournament(tRes.data.tournament);
      setTeamContext(tRes.data.teamContext);
      setMatches(Array.isArray(mRes.data) ? mRes.data : []);
    } catch (err) {
      console.error(
        'Tournament load failed',
        err.response?.data || err.message,
      );
      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  if (!tournamentId) {
    return (
      <MainLayout title="Tournament" forceBack>
        <Text style={{ padding: 16 }}>Invalid tournament reference</Text>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <MainLayout title="Tournament" forceBack>
        <Text style={{ padding: 16 }}>Tournament not found</Text>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={tournament.name} forceBack>
      {/* ---- TOURNAMENT META ---- */}
      <ScrollView style={styles.metaCard}>
        <Text style={styles.metaText}>
          Status: {tournament.status.replace('_', ' ')}
        </Text>

        {teamContext?.canJoin && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              await API.post(`/api/tournament/${tournamentId}/join`);
              load();
            }}
          >
            <Text style={styles.primaryText}>Join Tournament</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ---- MATCHES ---- */}
      <FlatList
        data={matches}
        keyExtractor={item => item._id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Fixtures not generated yet</Text>
        }
        renderItem={({ item }) => {

          const canEditLineup = item.permissions?.canEditLineup;

          return (
            <View style={styles.matchCard}>
              <Text style={styles.matchTitle}>
                {item.homeTeam.teamName} vs {item.awayTeam.teamName}
              </Text>

              {item.status === 'COMPLETED' && (
                <Text style={styles.score}>
                  {item.score.home} : {item.score.away}
                </Text>
              )}

              {canEditLineup && (
                <TouchableOpacity
                  style={styles.lineupBtn}
                  onPress={() =>    
                    nav.toMatch('MatchLineup', { matchId: item._id },)
                  }
                >
                  <Text style={styles.lineupText}>Add / Edit Lineup</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaCard: {
    padding: s(16),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaText: {
    fontWeight: '600',
    marginBottom: vs(8),
    color: '#0F172A',
  },
  matchCard: {
    backgroundColor: '#fff',
    marginHorizontal: s(16),
    marginVertical: vs(8),
    padding: s(16),
    borderRadius: ms(12),
    elevation: 2,
  },
  matchTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#0F172A',
  },
  score: {
    marginTop: vs(6),
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
  },
  lineupBtn: {
    marginTop: vs(10),
  },
  lineupText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: rf(14),
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(10),
    borderRadius: ms(8),
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: rf(14),
  },

  emptyText: {
    textAlign: 'center',
    marginTop: vs(40),
    color: '#6B7280',
    fontSize: rf(14),
  },
});

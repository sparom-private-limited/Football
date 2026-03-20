// TournamentStandingsScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import API from "../../api/api";
import MainLayout from "../../components/MainLayout";
import {s, vs, ms, rf} from "../../utils/responsive";

export default function TournamentStandingsScreen() {
  const route = useRoute();
  const { tournamentId, tournamentName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [standings, setStandings] = useState([]);
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    loadStandings();
  }, []);

  const loadStandings = async () => {
    try {
      const res = await API.get(`/api/tournament/${tournamentId}/standings`);
      
      setStandings(res.data.standings || []);
      setTournament(res.data.tournament);
    } catch (err) {
      console.error("Load standings error:", err);
      Alert.alert("Error", "Failed to load standings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStandings();
  };

  if (loading) {
    return (
      <MainLayout title="Standings">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={tournamentName || "Standings"}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament?.name}</Text>
          <Text style={styles.subtitle}>League Standings</Text>
        </View>

        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.posCell]}>#</Text>
          <Text style={[styles.headerCell, styles.teamCell]}>Team</Text>
          <Text style={[styles.headerCell, styles.statCell]}>P</Text>
          <Text style={[styles.headerCell, styles.statCell]}>W</Text>
          <Text style={[styles.headerCell, styles.statCell]}>D</Text>
          <Text style={[styles.headerCell, styles.statCell]}>L</Text>
          <Text style={[styles.headerCell, styles.statCell]}>GF</Text>  {/* 👈 added */}
  <Text style={[styles.headerCell, styles.statCell]}>GA</Text>  
          <Text style={[styles.headerCell, styles.statCell]}>GD</Text>
          <Text style={[styles.headerCell, styles.ptsCell]}>Pts</Text>
        </View>

        {/* STANDINGS */}
        {standings.map((entry, index) => (
          <StandingRow
            key={entry.team._id}
            position={index + 1}
            entry={entry}
            isChampion={index === 0}
          />
        ))}

        {standings.length === 0 && (
          <Text style={styles.emptyText}>
            No matches completed yet. Standings will appear once matches are
            played.
          </Text>
        )}

        {/* LEGEND */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <Text style={styles.legendItem}>P = Played</Text>
          <Text style={styles.legendItem}>W = Won</Text>
          <Text style={styles.legendItem}>D = Drawn</Text>
          <Text style={styles.legendItem}>L = Lost</Text>
           <Text style={styles.legendItem}>GF = Goals For</Text>     {/* 👈 added */}
  <Text style={styles.legendItem}>GA = Goals Against</Text> {/* 👈 added */}
          <Text style={styles.legendItem}>GD = Goal Difference</Text>
          <Text style={styles.legendItem}>Pts = Points</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

// ================= COMPONENTS =================

function StandingRow({ position, entry, isChampion }) {
  return (
    <View style={[
      styles.standingRow,
      isChampion && styles.championRow,
      position <= 3 && !isChampion && styles.topThree,
    ]}>
      <View style={styles.posWrapper}>
        <Text style={[styles.posText, isChampion && styles.championText]}>
          {position}
        </Text>
        {isChampion && <Text style={styles.trophy}>🏆</Text>}
      </View>

      <View style={styles.teamInfo}>
        {entry.team.teamLogoUrl ? (
          <Image source={{uri: entry.team.teamLogoUrl}} style={styles.teamLogo} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoText}>{entry.team.teamName?.[0] || "T"}</Text>
          </View>
        )}
        <Text style={styles.teamName} numberOfLines={1}>{entry.team.teamName}</Text>
      </View>

      <Text style={styles.statText}>{entry.played}</Text>
      <Text style={styles.statText}>{entry.won}</Text>
      <Text style={styles.statText}>{entry.drawn}</Text>
      <Text style={styles.statText}>{entry.lost}</Text>
      <Text style={styles.statText}>{entry.goalsFor}</Text>   {/* 👈 added */}
      <Text style={styles.statText}>{entry.goalsAgainst}</Text> {/* 👈 added */}
      <Text style={[
        styles.statText,
        entry.goalDifference > 0 && styles.positiveGD,
        entry.goalDifference < 0 && styles.negativeGD,
      ]}>
        {entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}
      </Text>
      <Text style={styles.ptsText}>{entry.points}</Text>
    </View>
  );
}

// ================= STYLES =================

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   header: {
//     padding: 20,
//     backgroundColor: "#2563EB",
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     marginBottom: 16,
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: "800",
//     color: "#FFFFFF",
//     marginBottom: 4,
//   },

//   subtitle: {
//     fontSize: 14,
//     color: "#DBEAFE",
//     fontWeight: "600",
//   },

//   tableHeader: {
//     flexDirection: "row",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     backgroundColor: "#F1F5F9",
//     borderBottomWidth: 2,
//     borderBottomColor: "#CBD5E1",
//   },

//   headerCell: {
//     fontSize: 11,
//     fontWeight: "800",
//     color: "#475569",
//     textTransform: "uppercase",
//   },

//   posCell: {
//     width: 40,
//   },

//   teamCell: {
//     flex: 1,
//   },

//   statCell: {
//     width: 32,
//     textAlign: "center",
//   },

//   ptsCell: {
//     width: 40,
//     textAlign: "center",
//   },

//   standingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#FFFFFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#F1F5F9",
//   },

//   championRow: {
//     backgroundColor: "#FEF3C7",
//     borderLeftWidth: 4,
//     borderLeftColor: "#F59E0B",
//   },

//   topThree: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#93C5FD",
//   },

//   posWrapper: {
//     width: 40,
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   posText: {
//     fontSize: 16,
//     fontWeight: "800",
//     color: "#0F172A",
//   },

//   championText: {
//     color: "#F59E0B",
//   },

//   trophy: {
//     fontSize: 14,
//     marginLeft: 4,
//   },

//   teamInfo: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },

//   teamLogo: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//   },

//   logoFallback: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#E5E7EB",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   logoText: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#6B7280",
//   },

//   teamName: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#0F172A",
//     flex: 1,
//   },

//   statText: {
//     width: 32,
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#475569",
//     textAlign: "center",
//   },

//   positiveGD: {
//     color: "#16A34A",
//   },

//   negativeGD: {
//     color: "#DC2626",
//   },

//   ptsText: {
//     width: 40,
//     fontSize: 15,
//     fontWeight: "900",
//     color: "#0F172A",
//     textAlign: "center",
//   },

//   emptyText: {
//     textAlign: "center",
//     color: "#94A3B8",
//     fontSize: 15,
//     marginTop: 60,
//     paddingHorizontal: 32,
//     fontStyle: "italic",
//   },

//   legend: {
//     backgroundColor: "#F8FAFC",
//     margin: 16,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },

//   legendTitle: {
//     fontSize: 13,
//     fontWeight: "800",
//     color: "#0F172A",
//     marginBottom: 8,
//   },

//   legendItem: {
//     fontSize: 12,
//     color: "#64748B",
//     marginBottom: 4,
//   },


const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    padding: s(20),
    backgroundColor: "#2563EB",
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
    marginBottom: vs(16),
  },

  title: {
    fontSize: ms(24),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: vs(4),
  },

  subtitle: {
    fontSize: rf(14),
    color: "#DBEAFE",
    fontWeight: "600",
  },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 2,
    borderBottomColor: "#CBD5E1",
  },

  headerCell: {
    fontSize: rf(11),
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },

  posCell: {
    width: s(40),
  },

  teamCell: {
    flex: 1,
  },

  statCell: {
    width: s(32),
    textAlign: "center",
  },

  ptsCell: {
    width: s(40),
    textAlign: "center",
  },

  standingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  championRow: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },

  topThree: {
    borderLeftWidth: 4,
    borderLeftColor: "#93C5FD",
  },

  posWrapper: {
    width: s(40),
    flexDirection: "row",
    alignItems: "center",
  },

  posText: {
    fontSize: rf(16),
    fontWeight: "800",
    color: "#0F172A",
  },

  championText: {
    color: "#F59E0B",
  },

  trophy: {
    fontSize: ms(14),
    marginLeft: s(4),
  },

  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
  },

  teamLogo: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
  },

  logoFallback: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#6B7280",
  },

  teamName: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },

  statText: {
    width: s(32),
    fontSize: rf(13),
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  positiveGD: {
    color: "#16A34A",
  },

  negativeGD: {
    color: "#DC2626",
  },

  ptsText: {
    width: s(40),
    fontSize: rf(15),
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: rf(15),
    marginTop: vs(60),
    paddingHorizontal: s(32),
    fontStyle: "italic",
  },

  legend: {
    backgroundColor: "#F8FAFC",
    margin: s(16),
    padding: s(16),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  legendTitle: {
    fontSize: rf(13),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: vs(8),
  },

  legendItem: {
    fontSize: rf(12),
    color: "#64748B",
    marginBottom: vs(4),
  },
});
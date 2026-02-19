// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import API from '../../api/api';
// import MainLayout from '../../components/MainLayout';
// import AppRefreshView from '../../components/AppRefreshView';

// export default function TeamHome() {
//   const navigation = useNavigation();
//   const [team, setTeam] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [liveMatch, setLiveMatch] = useState(null);
//   const [lastMatch, setLastMatch] = useState(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [joinedTournaments, setJoinedTournaments] = useState([]);

//   useEffect(() => {
//     loadTeam();
//   }, []);

//   const loadTeam = async () => {
//     try {
//       const [teamRes, matchRes] = await Promise.all([
//         API.get('/api/team/my-team'),
//         API.get('/api/match/myMatch'),
//       ]);

//       setTeam(teamRes.data);

//       const matches = matchRes.data || [];

//       const live = matches.find(m => m.status === 'LIVE');
//       setLiveMatch(live || null);

//       const completed = matches
//         .filter(m => m.status === 'COMPLETED')
//         .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

//       setLastMatch(completed[0] || null);

//       // 🔹 Load tournaments separately (safe)
//       try {
//        const tournamentRes = await API.get("/api/team/joinedTournaments");
//         setJoinedTournaments(Array.isArray(tournamentRes.data) ? tournamentRes.data : []);


//       } catch (e) {
//         console.warn('Joined tournaments not available');
//         setJoinedTournaments([]);
//       }
//     } catch (err) {
//       console.error('Failed to load team:', err);
//       setTeam(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <MainLayout title="Team Home">
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color="#1D4ED8" />
//         </View>
//       </MainLayout>
//     );
//   }

//   if (!team) {
//     return (
//       <MainLayout title="Team Home">
//         <View style={styles.center}>
//           <Text>No team created yet</Text>
//           <TouchableOpacity
//             style={styles.primaryBtn}
//             onPress={() => navigation.navigate('CreateTeam')}
//           >
//             <Text style={styles.primaryBtnText}>Create Team</Text>
//           </TouchableOpacity>
//         </View>
//       </MainLayout>
//     );
//   }

//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await loadTeam(); // or whatever API this screen uses
//     } catch (e) {
//       console.log('Refresh error', e);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   return (
//     <AppRefreshView
//       refreshing={refreshing}
//       onRefresh={onRefresh}
//       style={styles.container}
//     >
//       <MainLayout title="Team Home">
//         <View style={styles.container}>
//           <View style={styles.heroWrapper}>
//             {/* COVER IMAGE */}
//             <Image
//               source={{
//                 uri:
//                   team.coverImageUrl ||
//                   'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a',
//               }}
//               style={styles.coverImage}
//             />

//             {/* OVERLAY */}
//             <View style={styles.coverOverlay} />

//             {/* CONTENT */}
//             <View style={styles.heroContent}>
//               <View style={styles.heroLogoWrapper}>
//                 {team.teamLogoUrl ? (
//                   <Image
//                     source={{ uri: team.teamLogoUrl }}
//                     style={styles.heroLogo}
//                   />
//                 ) : (
//                   <View style={styles.heroLogoFallback}>
//                     <Text style={styles.heroLogoText}>
//                       {team.teamName?.[0] || 'T'}
//                     </Text>
//                   </View>
//                 )}
//               </View>

//               <Text style={styles.heroTeamName}>{team.teamName}</Text>
//               <Text style={styles.heroSub}>
//                 {team.players?.length || 0} Players
//               </Text>

//               <TouchableOpacity
//                 style={styles.outlineBtn}
//                 onPress={() => navigation.navigate('TeamProfile')}
//               >
//                 <Text style={styles.outlineBtnText}>View Team Profile</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {liveMatch && (
//             <TouchableOpacity
//               style={styles.liveCard}
//               onPress={() =>
//                 navigation.navigate('MatchNavigator', {
//                   screen: 'MatchConsole',
//                   params: { matchId: liveMatch._id },
//                 })
//               }
//             >
//               <View style={styles.liveTop}>
//                 <Text style={styles.livePulse}>● LIVE</Text>
//                 <Text style={styles.liveCta}>Open Console →</Text>
//               </View>

//               <Text style={styles.liveTeams}>
//                 {liveMatch.homeTeam?.teamName || 'Home'} vs{' '}
//                 {liveMatch.awayTeam?.teamName || 'Away'}
//               </Text>

//               <Text style={styles.liveScore}>
//                 {liveMatch.score.home} : {liveMatch.score.away}
//               </Text>
//             </TouchableOpacity>
//           )}

//           {lastMatch && (
//             <TouchableOpacity
//               style={styles.lastMatchCard}
//               onPress={() =>
//                 navigation.navigate('MatchNavigator', {
//                   screen: 'MatchSummary',
//                   params: { matchId: lastMatch._id },
//                 })
//               }
//             >
//               <Text style={styles.sectionTitle}>Last Match</Text>

//               <View style={styles.matchRow}>
//                 <TeamMini team={lastMatch.homeTeam} />

//                 <Text style={styles.matchScore}>
//                   {lastMatch.score.home} : {lastMatch.score.away}
//                 </Text>

//                 <TeamMini team={lastMatch.awayTeam} />
//               </View>

//               <Text style={styles.matchMeta}>
//                 {new Date(lastMatch.completedAt).toLocaleDateString()}
//               </Text>
//             </TouchableOpacity>
//           )}

//        {Array.isArray(joinedTournaments) && joinedTournaments.length > 0 && (
//   <View style={styles.sectionCard}>
//     <Text style={styles.sectionTitle}>My Tournaments</Text>

//     {joinedTournaments.map(t => (
//       <TouchableOpacity
//         key={t.id}
//         style={styles.tournamentCard}
//         onPress={() =>
//           navigation.navigate("TournamentNavigator", {
//             screen: "TeamTournamentDetail",
//             params: { tournamentId: t.id },
//           })
//         }
//       >
//         <View>
//           <Text style={styles.cardTitle}>{t.name}</Text>

//           <Text style={styles.metaText}>
//             {t.upcomingMatches} upcoming • {t.status.replace(/_/g, " ")}
//           </Text>
//         </View>
//       </TouchableOpacity>
//     ))}
//   </View>
// )}



//           <View style={styles.actionsCard}>
//             <Text style={styles.sectionTitle}>Quick Actions</Text>

//             <View style={styles.actionsRow}>
//               <TouchableOpacity
//                 style={styles.actionTileTertiary}
//                 onPress={() =>
//                   navigation.navigate('TournamentNavigator', {
//                     screen: 'JoinTournament',
//                   })
//                 }
//               >
//                 <Text style={styles.actionIcon}>🏆</Text>
//                 <Text style={styles.actionText}>Join Tournament</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.actionTilePrimary}
//                 onPress={() =>
//                   navigation.navigate('MatchNavigator', {
//                     screen: 'CreateMatch',
//                   })
//                 }
//               >
//                 <Text style={styles.actionIcon}>＋</Text>
//                 <Text style={styles.actionText}>New Match</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.actionTileSecondary}
//                 onPress={() =>
//                   navigation.navigate('MatchNavigator', { screen: 'MyMatches' })
//                 }
//               >
//                 <Text style={styles.actionIcon}>📋</Text>
//                 <Text style={styles.actionTextDark}>My Matches</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.actionTileSecondary}
//                 onPress={() => navigation.navigate('TeamLineup')}
//               >
//                 <Text style={styles.actionIcon}>⚽</Text>
//                 <Text style={styles.actionTextDark}>Lineup</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* <TouchableOpacity
//   style={styles.actionBtn}
//   onPress={() => navigation.navigate("MatchNavigator", {
//   screen: "MyMatches",
// })
// }
// >
//   <Text style={styles.actionText}>My Matches</Text>
// </TouchableOpacity>

// <TouchableOpacity
//   style={styles.primaryBtn}
//   onPress={() =>
//     navigation.navigate("MatchNavigator", {
//       screen: "CreateMatch",
//     })
//   }
// >
//   <Text style={styles.primaryBtnText}>Create Match</Text>
// </TouchableOpacity> */}
//         </View>
//       </MainLayout>
//     </AppRefreshView>
//   );
// }

// function TeamMini({ team }) {
//   return (
//     <View style={{ alignItems: 'center', width: 80 }}>
//       {team.teamLogoUrl ? (
//         <Image source={{ uri: team.teamLogoUrl }} style={styles.miniLogo} />
//       ) : (
//         <View style={styles.miniLogoFallback}>
//           <Text style={{ fontWeight: '800' }}>
//             {team?.teamName?.[0] || 'T'}
//           </Text>
//         </View>
//       )}
//       <Text style={styles.miniName} numberOfLines={1}>
//         {team.teamName}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   /* ===== LAYOUT ===== */

//   container: {
//     padding: 5,
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 8,
//     color: '#0F172A',
//   },

//   /* ===== HERO (COVER + LOGO) ===== */

//   heroWrapper: {
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginBottom: 20,
//   },

//   coverImage: {
//     width: '100%',
//     height: 215,
//   },

//   coverOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.35)',
//   },

//   heroContent: {
//     position: 'absolute',
//     bottom: 16,
//     left: 16,
//     right: 16,
//     alignItems: 'center',
//   },

//   heroLogoWrapper: {
//     backgroundColor: 'black',
//     padding: 4,
//     borderRadius: 48,
//     marginBottom: 8,
//   },

//   heroLogo: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//   },

//   heroLogoFallback: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     backgroundColor: '#E5E7EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   heroLogoText: {
//     fontSize: 28,
//     fontWeight: '900',
//     color: '#1D4ED8',
//   },

//   heroTeamName: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#FFFFFF',
//     textAlign: 'center',
//   },

//   heroSub: {
//     marginTop: 2,
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#E5E7EB',
//   },

//   outlineBtn: {
//     marginTop: 14,
//     borderWidth: 1,
//     borderColor: '#FFFFFF',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//   },

//   outlineBtnText: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//   },

//   /* ===== LIVE MATCH ===== */

//   liveCard: {
//     backgroundColor: '#ECFEFF',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 16,
//   },

//   liveTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   livePulse: {
//     color: '#DC2626',
//     fontWeight: '900',
//   },

//   liveTeams: {
//     fontSize: 16,
//     fontWeight: '700',
//     marginTop: 8,
//     color: '#0F172A',
//   },

//   liveScore: {
//     fontSize: 24,
//     fontWeight: '900',
//     marginTop: 4,
//     color: '#0F172A',
//   },

//   liveCta: {
//     color: '#0284C7',
//     fontWeight: '700',
//   },

//   /* ===== LAST MATCH ===== */

//   lastMatchCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 16,
//   },

//   matchRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginVertical: 10,
//   },

//   matchScore: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: '#0F172A',
//   },

//   matchMeta: {
//     textAlign: 'center',
//     color: '#64748B',
//     fontWeight: '600',
//   },

//   miniLogo: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },

//   miniLogoFallback: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#E5E7EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   miniName: {
//     marginTop: 4,
//     fontSize: 11,
//     fontWeight: '700',
//     textAlign: 'center',
//     color: '#0F172A',
//   },

//   /* ===== QUICK ACTIONS ===== */

//   actionsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 16,
//   },
//   actionsRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     gap: 12,
//   },

//   actionTilePrimary: {
//     width: '48%',
//     backgroundColor: '#1D4ED8',
//     borderRadius: 16,
//     paddingVertical: 18,
//     alignItems: 'center',
//   },
//   actionTileTertiary: {
//     width: '48%',
//     backgroundColor: '#d8741dff',
//     borderRadius: 16,
//     paddingVertical: 18,
//     alignItems: 'center',
//   },

//   actionTileSecondary: {
//     width: '48%',
//     backgroundColor: '#F1F5F9',
//     borderRadius: 16,
//     paddingVertical: 18,
//     alignItems: 'center',
//   },

//   actionIcon: {
//     fontSize: 26,
//     marginBottom: 6,
//     color: '#FFFFFF',
//   },

//   actionText: {
//     color: '#FFFFFF',
//     fontWeight: '800',
//     fontSize: 14,
//   },

//   actionTextDark: {
//     color: '#0F172A',
//     fontWeight: '800',
//     fontSize: 14,
//   },
//   tournamentCard: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 10,
//   },
//   sectionCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 16,
//   },
// });


// TeamHome.jsx - CORRECTED VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // ✅ CORRECT IMPORT
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import AppRefreshView from '../../components/AppRefreshView';
import useNavigationHelper from '../../navigation/Navigationhelper';
import { s, vs, ms, rf, wp } from '../../utils/responsive'; // ✅ ADD THIS IMPORT

export default function TeamHome() {
  const nav = useNavigationHelper();
  const isFocused = useIsFocused(); // ✅ Now this will work
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveMatch, setLiveMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState([]);

  useEffect(() => {
    if (isFocused) {
      loadTeam();
    }
  }, [isFocused]);

  const loadTeam = async () => {
    try {
      // Fetch team data
      const teamRes = await API.get('/api/team/my-team');

      // ✅ Check if team exists in response
      if (!teamRes.data) {
        setTeam(null);
        setLoading(false);
        return;
      }

      setTeam(teamRes.data);

      // Only fetch matches and tournaments if team exists
      await Promise.all([loadMatches(), loadTournaments()]);
    } catch (err) {
      console.log('Team load error:', err.response?.status);

      // ✅ 404 means no team created yet - this is normal!
      if (err.response?.status === 404) {
        setTeam(null);
      } else {
        // Other errors - show them
        console.error('Failed to load team:', err);
        setTeam(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const matchRes = await API.get('/api/match/myMatch');
      const matches = matchRes.data || [];

      const live = matches.find(m => m.status === 'LIVE');
      setLiveMatch(live || null);

      const completed = matches
        .filter(m => m.status === 'COMPLETED')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      setLastMatch(completed[0] || null);
    } catch (err) {
      console.warn('Failed to load matches:', err.response?.status);
      setLiveMatch(null);
      setLastMatch(null);
    }
  };

  const loadTournaments = async () => {
    try {
      const tournamentRes = await API.get('/api/team/joinedTournaments');
      setJoinedTournaments(
        Array.isArray(tournamentRes.data) ? tournamentRes.data : [],
      );
    } catch (err) {
      console.warn('Failed to load tournaments:', err.response?.status);
      setJoinedTournaments([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTeam();
    } catch (e) {
      console.log('Refresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout title="Team Home">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      </MainLayout>
    );
  }

  // No team - show create team prompt
  if (!team) {
    return (
      <MainLayout title="Team Home">
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>⚽</Text>
          </View>

          <Text style={styles.emptyTitle}>Create Your Team</Text>
          <Text style={styles.emptySubtitle}>
            Get started by creating your team profile to join tournaments and
            track matches
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => nav.to('CreateTeam')}
          >
            <Text style={styles.primaryBtnText}>Create Team</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  // Team exists - show dashboard
  return (
    <AppRefreshView
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={styles.container}
    >
      <MainLayout title="Team Home">
        <View style={styles.container}>
          {/* HERO SECTION */}
          <View style={styles.heroWrapper}>
            <Image
              source={{
                uri:
                  team.coverImageUrl ||
                  'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a',
              }}
              style={styles.coverImage}
            />

            <View style={styles.coverOverlay} />

            <View style={styles.heroContent}>
              <View style={styles.heroLogoWrapper}>
                {team.teamLogoUrl ? (
                  <Image
                    source={{ uri: team.teamLogoUrl }}
                    style={styles.heroLogo}
                  />
                ) : (
                  <View style={styles.heroLogoFallback}>
                    <Text style={styles.heroLogoText}>
                      {team.teamName?.[0] || 'T'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.heroTeamName}>{team.teamName}</Text>
              <Text style={styles.heroSub}>
                {team.players?.length || 0} Players
              </Text>

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => nav.to('TeamProfile')}
              >
                <Text style={styles.outlineBtnText}>View Team Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LIVE MATCH */}
          {liveMatch && (
            <TouchableOpacity
              style={styles.liveCard}
              onPress={() =>
                nav.toMatch('MatchConsole', { matchId: liveMatch._id })
              }
            >
              <View style={styles.liveTop}>
                <Text style={styles.livePulse}>● LIVE</Text>
                <Text style={styles.liveCta}>Open Console →</Text>
              </View>

              <Text style={styles.liveTeams}>
                {liveMatch.homeTeam?.teamName || 'Home'} vs{' '}
                {liveMatch.awayTeam?.teamName || 'Away'}
              </Text>

              <Text style={styles.liveScore}>
                {liveMatch.score.home} : {liveMatch.score.away}
              </Text>
            </TouchableOpacity>
          )}

          {/* LAST MATCH */}
          {lastMatch && (
            <TouchableOpacity
              style={styles.lastMatchCard}
              onPress={() =>
                nav.toMatch('MatchSummary', { matchId: lastMatch._id })
              }
            >
              <Text style={styles.sectionTitle}>Last Match</Text>

              <View style={styles.matchRow}>
                <TeamMini team={lastMatch.homeTeam} />

                <Text style={styles.matchScore}>
                  {lastMatch.score.home} : {lastMatch.score.away}
                </Text>

                <TeamMini team={lastMatch.awayTeam} />
              </View>

              <Text style={styles.matchMeta}>
                {new Date(lastMatch.completedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}

          {/* TOURNAMENTS */}
          {Array.isArray(joinedTournaments) && joinedTournaments.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>My Tournaments</Text>

              {joinedTournaments.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.tournamentCard}
                  onPress={() =>
                    nav.toTournament('TeamTournamentDetail', {
                      tournamentId: t.id,
                    })
                  }
                >
                  <View>
                    <Text style={styles.cardTitle}>{t.name}</Text>

                    <Text style={styles.metaText}>
                      {t.upcomingMatches} upcoming •{' '}
                      {t.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* QUICK ACTIONS */}
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionTileTertiary}
                onPress={() => nav.toTournament('JoinTournament')}
              >
                <Text style={styles.actionIcon}>🏆</Text>
                <Text style={styles.actionText}>Join Tournament</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionTilePrimary}
                onPress={() => nav.toMatch('CreateMatch')}
              >
                <Text style={styles.actionIcon}>＋</Text>
                <Text style={styles.actionText}>New Match</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionTileSecondary}
                onPress={() => nav.toMatch('MyMatches')}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionTextDark}>My Matches</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionTileSecondary}
                onPress={() => nav.to('TeamLineup')}
              >
                <Text style={styles.actionIcon}>⚽</Text>
                <Text style={styles.actionTextDark}>Lineup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </MainLayout>
    </AppRefreshView>
  );
}

function TeamMini({ team }) {
  if (!team) return null;
  
  return (
    <View style={{ alignItems: 'center', width: s(80) }}>
      {team.teamLogoUrl ? (
        <Image source={{ uri: team.teamLogoUrl }} style={styles.miniLogo} />
      ) : (
        <View style={styles.miniLogoFallback}>
          <Text style={{ fontWeight: '800' }}>
            {team?.teamName?.[0] || 'T'}
          </Text>
        </View>
      )}
      <Text style={styles.miniName} numberOfLines={1}>
        {team.teamName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ===== LAYOUT ===== */
  container: {
    padding: s(5),                          // ✅ s()
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ===== EMPTY STATE ===== */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(32),                         // ✅ s()
  },
  emptyIcon: {
    width: s(100),                          // ✅ s()
    height: s(100),                         // ✅ s()
    borderRadius: s(50),                    // ✅ s()
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(24),                   // ✅ vs()
  },
  emptyIconText: {
    fontSize: ms(48),                       // ✅ ms()
  },
  emptyTitle: {
    fontSize: ms(24),                       // ✅ ms()
    fontWeight: '700',
    color: '#111827',
    marginBottom: vs(12),                   // ✅ vs()
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: rf(16),                       // ✅ rf()
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: vs(32),                   // ✅ vs()
    lineHeight: vs(24),                     // ✅ vs()
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: vs(16),                // ✅ vs()
    paddingHorizontal: s(32),              // ✅ s()
    borderRadius: ms(12),                   // ✅ ms()
    minWidth: s(200),                       // ✅ s()
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: rf(16),                       // ✅ rf()
    fontWeight: '600',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: rf(16),                       // ✅ rf()
    fontWeight: '700',
    marginBottom: vs(8),                    // ✅ vs()
    color: '#0F172A',
  },

  /* ===== HERO ===== */
  heroWrapper: {
    borderRadius: ms(20),                   // ✅ ms()
    overflow: 'hidden',
    marginBottom: vs(20),                   // ✅ vs()
  },
  coverImage: {
    width: '100%',
    height: vs(215),                        // ✅ vs()
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    position: 'absolute',
    bottom: vs(16),                         // ✅ vs()
    left: s(16),                            // ✅ s()
    right: s(16),                           // ✅ s()
    alignItems: 'center',
  },
  heroLogoWrapper: {
    backgroundColor: 'black',
    padding: s(4),                          // ✅ s()
    borderRadius: ms(48),                   // ✅ ms()
    marginBottom: vs(8),                    // ✅ vs()
  },
  heroLogo: {
    width: s(72),                           // ✅ s()
    height: s(72),                          // ✅ s()
    borderRadius: s(36),                    // ✅ s()
  },
  heroLogoFallback: {
    width: s(72),                           // ✅ s()
    height: s(72),                          // ✅ s()
    borderRadius: s(36),                    // ✅ s()
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: ms(28),                       // ✅ ms()
    fontWeight: '900',
    color: '#1D4ED8',
  },
  heroTeamName: {
    fontSize: ms(20),                       // ✅ ms()
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSub: {
    marginTop: vs(2),                       // ✅ vs()
    fontSize: rf(13),                       // ✅ rf()
    fontWeight: '600',
    color: '#E5E7EB',
  },
  outlineBtn: {
    marginTop: vs(14),                      // ✅ vs()
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: vs(10),                // ✅ vs()
    paddingHorizontal: s(20),              // ✅ s()
    borderRadius: ms(12),                   // ✅ ms()
  },
  outlineBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: rf(14),                       // ✅ rf()
  },

  /* ===== LIVE MATCH ===== */
  liveCard: {
    backgroundColor: '#ECFEFF',
    borderRadius: ms(18),                   // ✅ ms()
    padding: s(16),                         // ✅ s()
    marginBottom: vs(16),                   // ✅ vs()
  },
  liveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePulse: {
    color: '#DC2626',
    fontWeight: '900',
    fontSize: rf(13),                       // ✅ rf()
  },
  liveTeams: {
    fontSize: rf(16),                       // ✅ rf()
    fontWeight: '700',
    marginTop: vs(8),                       // ✅ vs()
    color: '#0F172A',
  },
  liveScore: {
    fontSize: ms(24),                       // ✅ ms()
    fontWeight: '900',
    marginTop: vs(4),                       // ✅ vs()
    color: '#0F172A',
  },
  liveCta: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: rf(13),                       // ✅ rf()
  },

  /* ===== LAST MATCH ===== */
  lastMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),                   // ✅ ms()
    padding: s(16),                         // ✅ s()
    marginBottom: vs(16),                   // ✅ vs()
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: vs(10),                 // ✅ vs()
  },
  matchScore: {
    fontSize: ms(22),                       // ✅ ms()
    fontWeight: '900',
    color: '#0F172A',
  },
  matchMeta: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '600',
    fontSize: rf(13),                       // ✅ rf()
  },
  miniLogo: {
    width: s(40),                           // ✅ s()
    height: s(40),                          // ✅ s()
    borderRadius: s(20),                    // ✅ s()
  },
  miniLogoFallback: {
    width: s(40),                           // ✅ s()
    height: s(40),                          // ✅ s()
    borderRadius: s(20),                    // ✅ s()
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniName: {
    marginTop: vs(4),                       // ✅ vs()
    fontSize: rf(11),                       // ✅ rf()
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
  },

  /* ===== TOURNAMENTS ===== */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),                   // ✅ ms()
    padding: s(16),                         // ✅ s()
    marginBottom: vs(16),                   // ✅ vs()
  },
  tournamentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),                   // ✅ ms()
    padding: s(14),                         // ✅ s()
    marginBottom: vs(10),                   // ✅ vs()
  },
  cardTitle: {
    fontSize: rf(16),                       // ✅ rf()
    fontWeight: '600',
    color: '#111827',
    marginBottom: vs(4),                    // ✅ vs()
  },
  metaText: {
    fontSize: rf(12),                       // ✅ rf()
    color: '#6B7280',
  },

  /* ===== QUICK ACTIONS ===== */
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),                   // ✅ ms()
    padding: s(16),                         // ✅ s()
    marginBottom: vs(16),                   // ✅ vs()
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: s(12),                             // ✅ s()
  },
  actionTilePrimary: {
    width: '48%',
    backgroundColor: '#1D4ED8',
    borderRadius: ms(16),                   // ✅ ms()
    paddingVertical: vs(18),                // ✅ vs()
    alignItems: 'center',
  },
  actionTileTertiary: {
    width: '48%',
    backgroundColor: '#d8741dff',
    borderRadius: ms(16),                   // ✅ ms()
    paddingVertical: vs(18),                // ✅ vs()
    alignItems: 'center',
  },
  actionTileSecondary: {
    width: '48%',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(16),                   // ✅ ms()
    paddingVertical: vs(18),                // ✅ vs()
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: ms(26),                       // ✅ ms()
    marginBottom: vs(6),                    // ✅ vs()
    color: '#FFFFFF',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(14),                       // ✅ rf()
  },
  actionTextDark: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: rf(14),                       // ✅ rf()
  },
});
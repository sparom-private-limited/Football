import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  BackHandler,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import API from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import {addMatchEvent} from '../../api/match.api';
import Pitch from '../../components/lineup/Pitch';
import useNavigationHelper from '../../navigation/Navigationhelper';
import useMatchSocket from '../../hooks/useMatchSocket';
import SocketManager from '../../services/SocketManager';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function MatchConsoleScreen() {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [scorer, setScorer] = useState(null);
  const [assist, setAssist] = useState(null);
  const nav = useNavigationHelper();
  const [lineups, setLineups] = useState(null);
  const [showLineups, setShowLineups] = useState(false);
  const [lineupSide, setLineupSide] = useState('home');
  const [activeTab, setActiveTab] = useState('stats');
  const navigation = useNavigation(); // ✅ REAL navigation
  const insets = useSafeAreaInsets();

  const [pausedAt, setPausedAt] = useState(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const EMPTY_TEAM = {
    _id: '',
    teamName: '',
  };

  const [match, setMatch] = useState({
    events: [],
    score: {home: 0, away: 0},
    homeTeam: EMPTY_TEAM,
    awayTeam: EMPTY_TEAM,
  });

  const [goalModal, setGoalModal] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const isPaused = match?.status === 'PAUSED';
  const [cardModal, setCardModal] = useState(false);
  const [subModal, setSubModal] = useState(false);

  const [cardType, setCardType] = useState(null);
  const [cardPlayer, setCardPlayer] = useState(null);

  const [subOut, setSubOut] = useState(null);
  const [subIn, setSubIn] = useState(null);

  const {user} = useAuth();
  const route = useRoute();
  const matchId = route.params?.matchId;

  const [isResetDisabled, setIsResetDisabled] = useState(false);

  // ==================== SOCKET INTEGRATION ====================
  // ✅ No matchData returned from hook anymore
  const {isConnected: socketConnected, error: socketError} = useMatchSocket(
    matchId,
    {
      onJoined: data => {
        console.log('✅ Joined match room:', data);
      },

      onStart: data => {
        // ✅ Clear paused state on fresh start
        console.log('🟢 onStart fired:', JSON.stringify(data));
        setPausedAt(null);
        setTotalPausedSeconds(0);
        setTimerKey(prev => prev + 1);

        setMatch(prev => ({
          ...prev,
          status: data.status,
          startedAt: data.startedAt,
        }));
      },

      onEnd: data => {
        Alert.alert(
          'Match Ended',
          'This match has been completed.',
          [
            {
              text: 'View Summary',
              onPress: () => nav.replace('MatchSummary', {matchId}),
            },
          ],
          {cancelable: false},
        );
      },

      // ✅ Update BOTH score and events
      onGoal: data => {
        setMatch(prev => {
          const exists = prev.events.some(e => e._id === data.event?._id);
          if (exists) return prev;
          return {
            ...prev,
            score: data.score, // ← score updated
            events: [...prev.events, data.event],
          };
        });
      },

      onCard: data => {
        setMatch(prev => {
          const exists = prev.events.some(e => e._id === data.event?._id);
          if (exists) return prev;
          return {
            ...prev,
            events: [...prev.events, data.event],
          };
        });
      },

      onSubstitution: data => {
        setMatch(prev => {
          const exists = prev.events.some(e => e._id === data.event?._id);
          if (exists) return prev;
          return {
            ...prev,
            events: [...prev.events, data.event],
          };
        });
      },

      onStatusUpdate: data => {
        setMatch(prev => {
          // ✅ Track when match was paused
          if (data.status === 'PAUSED') {
            setPausedAt(Date.now());
          }

          // ✅ On resume — add paused duration to total
          if (data.status === 'LIVE' && pausedAt) {
            const pausedDuration = Math.floor((Date.now() - pausedAt) / 1000);
            setTotalPausedSeconds(prev => prev + pausedDuration);
            setPausedAt(null);
          }

          return {
            ...prev,
            status: data.status,
            startedAt: data.startedAt || prev.startedAt,
          };
        });
      },

      onReset: data => {
        // ✅ Reset all timer tracking state
        setSecondsElapsed(0);
        setPausedAt(null);
        setTotalPausedSeconds(0);
        setTimerKey(prev => prev + 1);

        setMatch(prev => ({
          ...prev,
          events: [],
          score: data.score || {home: 0, away: 0},
          status: data.status,
          startedAt: null,
          completedAt: null,
          winner: null,
        }));

        Alert.alert('Match Reset', 'Match has been reset successfully');
      },

      onError: error => {
        console.error('❌ Socket error:', error);
        Alert.alert('Socket Error', error.message);
      },
    },
  );
  // useEffect(() => {
  //   if (!matchData) return;

  //   setMatch(prev => ({
  //     ...prev,
  //     score: matchData.score || prev.score,
  //     events: matchData.events || [],
  //     status: matchData.status || prev.status,
  //     startedAt: matchData.startedAt || prev.startedAt,
  //     completedAt: matchData.completedAt || prev.completedAt,
  //     winner: matchData.winner || prev.winner,
  //   }));
  // }, [matchData]);

  // ================= STATS CALCULATION =================

  const stats = useMemo(() => {
    if (!match || !Array.isArray(match.events)) {
      return {
        home: {goals: 0, yellow: 0, red: 0, subs: 0},
        away: {goals: 0, yellow: 0, red: 0, subs: 0},
      };
    }

    const data = {
      home: {goals: 0, yellow: 0, red: 0, subs: 0},
      away: {goals: 0, yellow: 0, red: 0, subs: 0},
    };

    match.events.forEach(e => {
      const teamId = typeof e.team === 'object' ? e.team._id : e.team;
      const side = teamId === match.homeTeam._id ? 'home' : 'away';

      if (['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.type)) {
        data[side].goals += 1;
      }
      if (e.type === 'YELLOW') data[side].yellow += 1;
      if (e.type === 'RED') data[side].red += 1;
      if (e.type === 'SUBSTITUTION') data[side].subs += 1;
    });

    return data;
  }, [match]);

  // ================= PERMISSIONS =================
  const isTournamentMatch = !!match?.tournamentId;
  const isCreator =
    match?.createdBy &&
    user?._id &&
    String(
      typeof match.createdBy === 'object'
        ? match.createdBy._id
        : match.createdBy,
    ) === String(user._id);
  const isOrganiser = user?.role === 'organiser';
  const canManageMatch = isTournamentMatch ? isOrganiser : isCreator;

  // ================= GUARD: MATCH ID REQUIRED =================
  useEffect(() => {
    if (!matchId) {
      Alert.alert('Error', 'Match ID missing');
      nav.back();
    }
  }, [matchId]);

  // ================= LOAD MATCH DATA =================
  const loadMatch = async () => {
    try {
      const res = await API.get(`/api/match/${matchId}`);
      setMatch({
        events: res.data.events || [],
        score: res.data.score || {home: 0, away: 0},
        ...res.data,
      });
    } catch (err) {
      console.error('LOAD MATCH ERROR:', err);
      Alert.alert('Error', 'Failed to load match data');
    }
  };

  const loadMatchLineups = async () => {
    try {
      const res = await API.get(`/api/match/${matchId}/lineups`);
      setLineups(res.data);
    } catch (err) {
      Alert.alert(
        'Lineup unavailable',
        err.response?.data?.message || 'Unable to load lineups',
      );
    }
  };

  useEffect(() => {
    if (matchId) {
      loadMatch();
      loadMatchLineups();
    }
  }, [matchId]);

  // ================= TIMER SYNC WITH SERVER =================
  useEffect(() => {
    console.log('⏱️ Timer useEffect ran:', {
      startedAt: match?.startedAt,
      status: match?.status,
      timerKey,
    });
    // ✅ Clear immediately when key changes — kills old interval
    setSecondsElapsed(0);

    if (!match?.startedAt || match.status !== 'LIVE') {
      console.log(
        '⏱️ Timer stopped — reason:',
        !match?.startedAt ? 'no startedAt' : 'not LIVE',
      );
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const started = new Date(match.startedAt).getTime();
      const elapsed = Math.floor((now - started) / 1000) - totalPausedSeconds;

      setSecondsElapsed(elapsed > 0 ? elapsed : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match?.startedAt, match?.status, totalPausedSeconds, timerKey]);
  // ================= HARDWARE BACK BUTTON (ANDROID) =================
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'Leave Match?',
          'The match is still live. Are you sure you want to leave?',
          [
            {text: 'Stay', style: 'cancel'},
            {
              text: 'Leave',
              onPress: () => {
                nav.back();
              },
            },
          ],
        );
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  // ================= CUSTOM HEADER BACK BUTTON =================
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Leave Match?',
              'Match is still live. Progress will not be lost.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Leave',
                  onPress: () => {
                    // ⭐ FIXED: Use goBack instead of reset
                    nav.back();
                  },
                },
              ],
            );
          }}>
          <Text style={{color: '#1D4ED8', fontSize: 16, marginLeft: 16}}>
            ← Leave
          </Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  // ================= HELPER FUNCTIONS =================
  const formatTime = secs => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const loadPlayersForTeam = async team => {
    try {
      setPlayers([]);
      setScorer(null);
      setAssist(null);

      const res = await API.get(`/api/team/${team._id}/players`);
      const list = Array.isArray(res.data) ? res.data : res.data.players || [];

      setPlayers(list);
    } catch (err) {
      console.error('LOAD PLAYERS ERROR:', err.response?.data || err.message);
      setPlayers([]);
      Alert.alert('Error', 'Unable to load players');
    }
  };

  // ================= EVENT SUBMISSIONS =================
  const submitGoal = async () => {
    if (!match?.startedAt) {
      Alert.alert(
        'Match Not Started',
        'Please start the match before adding events.',
      );
      return;
    }
    if (!canManageMatch) {
      Alert.alert(
        'Permission Denied',
        isTournamentMatch
          ? 'Only tournament organiser can add events'
          : 'Only match creator can add events',
      );
      return;
    }

    if (isPaused) {
      Alert.alert('Match Paused', 'Resume match to add events');
      return;
    }

    if (!selectedTeam) {
      Alert.alert('Select Team', 'Please select a team');
      return;
    }

    if (!scorer) {
      Alert.alert('Select Scorer', 'Please select goal scorer');
      return;
    }

    const minute = Math.floor(secondsElapsed / 60);

    SocketManager.addGoal(
      matchId,
      selectedTeam._id,
      scorer._id,
      minute,
      assist?._id || null,
      'GOAL',
    );

    setGoalModal(false);
    setScorer(null);
    setAssist(null);
    setSelectedTeam(null);
  };

  const submitCard = async () => {
    if (!canManageMatch) {
      Alert.alert(
        'Permission Denied',
        isTournamentMatch
          ? 'Only tournament organiser can add events'
          : 'Only match creator can add events',
      );
      return;
    }

    if (isPaused) {
      Alert.alert('Match Paused', 'Resume match to add events');
      return;
    }

    if (!selectedTeam || !cardType || !cardPlayer) {
      Alert.alert('Incomplete', 'Please select team, card type and player');
      return;
    }

    const minute = Math.floor(secondsElapsed / 60);

    SocketManager.addCard(
      matchId,
      selectedTeam._id,
      cardPlayer._id,
      minute,
      cardType,
    );

    // Close modal
    setCardModal(false);
    setCardType(null);
    setCardPlayer(null);
    setSelectedTeam(null);
    setPlayers([]);
  };

  const submitSubstitution = async () => {
    if (!canManageMatch) {
      Alert.alert(
        'Permission Denied',
        isTournamentMatch
          ? 'Only tournament organiser can add events'
          : 'Only match creator can add events',
      );
      return;
    }

    if (isPaused) {
      Alert.alert('Match Paused', 'Resume match to add events');
      return;
    }

    if (!selectedTeam || !subOut || !subIn) {
      Alert.alert('Incomplete', 'Please select OUT and IN players');
      return;
    }

    const minute = Math.floor(secondsElapsed / 60);

    SocketManager.addSubstitution(
      matchId,
      selectedTeam._id,
      subOut._id,
      subIn._id,
      minute,
    );

    // Close modal
    setSubModal(false);
    setSubOut(null);
    setSubIn(null);
    setSelectedTeam(null);
    setPlayers([]);
  };

  // const endMatch = async () => {
  //   Alert.alert('End Match?', 'This action cannot be undone', [
  //     {text: 'Cancel'},
  //     {
  //       text: 'End Match',
  //       style: 'destructive',
  //       onPress: async () => {
  //         try {
  //           await API.post('/api/match/end', {matchId});

  //           // ⭐ FIXED: Use replace instead of reset
  //           nav.replace('MatchSummary', {matchId});
  //         } catch (err) {
  //           Alert.alert(
  //             'Error',
  //             err.response?.data?.message || 'Failed to end match',
  //           );
  //         }
  //       },
  //     },
  //   ]);
  // };

  const endMatch = async () => {
    Alert.alert('End Match?', 'This action cannot be undone', [
      {text: 'Cancel'},
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          if (!socketConnected) {
            Alert.alert(
              'Connection Error',
              'Socket not connected. Please try again.',
            );
            return;
          }

          // Emit via socket
          SocketManager.endMatch(matchId);
        },
      },
    ]);
  };

  const confirmReset = () => {
    if (!canManageMatch) {
      Alert.alert(
        'Permission Denied',
        isTournamentMatch
          ? 'Only tournament organiser can reset match'
          : 'Only match creator can reset match',
      );
      return;
    }

    if (!socketConnected) {
      Alert.alert(
        'Connection Error',
        'Socket not connected. Please try again.',
      );
      return;
    }

    Alert.alert(
      'Reset Match?',
      'This will reset score, events, and timer for everyone watching.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (isResetDisabled) return;

            // Debounce
            setIsResetDisabled(true);

            console.log('🔄 Resetting match via socket');
            SocketManager.resetMatch(matchId);

            // Re-enable after 2 seconds
            setTimeout(() => setIsResetDisabled(false), 2000);
          },
        },
      ],
    );
  };

  // ================= PAUSE/RESUME HANDLER (Update with permission check) =================
  const handlePauseResume = useCallback(() => {
    if (!canManageMatch) {
      Alert.alert(
        'Permission Denied',
        isTournamentMatch
          ? 'Only tournament organiser can pause/resume'
          : 'Only match creator can pause/resume',
      );
      return;
    }

    if (!socketConnected) {
      Alert.alert(
        'Connection Error',
        'Socket not connected. Please try again.',
      );
      return;
    }

    // ✅ Use match.status directly to avoid stale state
    const currentStatus = match?.status;
    const newStatus = currentStatus === 'PAUSED' ? 'LIVE' : 'PAUSED';

    console.log(`🎮 Status transition: ${currentStatus} → ${newStatus}`);

    SocketManager.updateMatchStatus(matchId, newStatus);
  }, [
    match?.status,
    canManageMatch,
    socketConnected,
    isTournamentMatch,
    matchId,
  ]);

  // Add at the top with other state
  const [isPauseResumeDisabled, setIsPauseResumeDisabled] = useState(false);

  const handlePauseResumeDebounced = () => {
    if (isPauseResumeDisabled) return;

    setIsPauseResumeDisabled(true);
    handlePauseResume();

    // Re-enable after 1 second
    setTimeout(() => setIsPauseResumeDisabled(false), 1000);
  };

  // ================= RENDER HELPERS =================
  const renderEvent = ({item, index}) => {
    const isHomeTeam =
      item.team === match.homeTeam._id || item.team?._id === match.homeTeam._id;
    const isLatest = index === match.events.length - 1;

    return (
      <EventItem item={item} isHomeTeam={isHomeTeam} isLatest={isLatest} />
    );
  };

  const renderScorer = ({item}) => (
    <TouchableOpacity
      style={[
        styles.playerItem,
        scorer?._id === item._id && styles.selectedItem,
      ]}
      onPress={() => setScorer(item)}>
      <Text style={styles.playerText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderAssist = ({item}) => (
    <TouchableOpacity
      style={[
        styles.playerItem,
        assist?._id === item._id && styles.selectedItem,
      ]}
      onPress={() => setAssist(item._id ? item : null)}>
      <Text style={styles.playerText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const lineupMap = useMemo(() => {
    if (
      !lineups ||
      !lineups[lineupSide] ||
      !Array.isArray(lineups[lineupSide].starting)
    ) {
      return {};
    }

    return Object.fromEntries(
      lineups[lineupSide].starting
        .filter(s => s && s.slotKey && s.player)
        .map(s => [s.slotKey, s.player]),
    );
  }, [lineups, lineupSide]);

  if (!match) return null;

  // ================= RENDER =================
  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container}>
        {!socketConnected && (
          <View style={styles.socketStatus}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={styles.socketStatusText}>
              {socketError ? 'Socket Error' : 'Connecting to live updates...'}
            </Text>
          </View>
        )}

        {socketConnected && (
          <View style={[styles.socketStatus, {backgroundColor: '#DCFCE7'}]}>
            <View style={styles.liveDot} />
            <Text style={[styles.socketStatusText, {color: '#15803D'}]}>
              Live updates active
            </Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Match Console</Text>
          <Text
            style={[
              styles.live,
              match.status === 'PAUSED' && {backgroundColor: '#FACC15'},
            ]}>
            {match.status}
          </Text>
        </View>

        {/* SCORE CARD */}
        <View style={styles.scoreCard}>
          <Text style={styles.timer}>{formatTime(secondsElapsed)}</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.team}>{match.homeTeam.teamName}</Text>
            <Text style={styles.score}>
              {match.score.home} - {match.score.away}
            </Text>
            <Text style={styles.team}>{match.awayTeam.teamName}</Text>
          </View>
        </View>

        {/* TIMER CONTROLS — pause and reset only */}
        {canManageMatch && match.startedAt && (
          <View style={styles.timerControls}>
            <TouchableOpacity
              style={[
                styles.pauseBtn,
                (!canManageMatch ||
                  !socketConnected ||
                  isPauseResumeDisabled) && {
                  opacity: 0.4,
                },
              ]}
              onPress={handlePauseResumeDebounced}
              disabled={
                !canManageMatch || !socketConnected || isPauseResumeDisabled
              }>
              <Text style={styles.pauseText}>
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resetBtn,
                (!canManageMatch || !socketConnected || isResetDisabled) && {
                  opacity: 0.4,
                },
              ]}
              onPress={confirmReset}
              disabled={!canManageMatch || !socketConnected || isResetDisabled}>
              <Text style={styles.resetText}>
                {isResetDisabled ? 'Resetting...' : 'Reset'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* RESTART BANNER — shown after reset, full width, outside timerControls */}
        {canManageMatch &&
          match.status === 'LIVE' &&
          !match.startedAt &&
          canManageMatch && (
            <TouchableOpacity
              style={[styles.restartBtn, !socketConnected && {opacity: 0.4}]}
              disabled={!socketConnected}
              onPress={() => {
                Alert.alert(
                  'Start Match?',
                  'Kick off the match and start the timer.',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: '▶️ Start',
                      onPress: () => SocketManager.startMatch(matchId),
                    },
                  ],
                );
              }}>
              <View style={styles.restartInner}>
                <Text style={styles.restartIcon}>▶️</Text>
                <View>
                  <Text style={styles.restartTitle}>Match Ready</Text>
                  <Text style={styles.restartSub}>Tap to kick off</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

        {/* QUICK ACTIONS */}
        {canManageMatch && (
          <>
            <Text style={styles.section}>Quick Actions</Text>

            <View style={styles.primaryActions}>
              <PrimaryAction
                label="Goal"
                icon="⚽"
                color="#10B981"
                disabled={!canManageMatch || isPaused || !socketConnected}
                onPress={() => setGoalModal(true)}
              />

              <PrimaryAction
                label="Card"
                icon="🟨"
                color="#FACC15"
                disabled={!canManageMatch || isPaused || !socketConnected}
                onPress={() => setCardModal(true)}
              />

              <PrimaryAction
                label="Sub"
                icon="🔁"
                color="#3B82F6"
                disabled={!canManageMatch || isPaused || !socketConnected}
                onPress={() => setSubModal(true)}
              />
            </View>
          </>
        )}

        {/* VIEW TOGGLES */}
        <View style={styles.viewTabs}>
          <TabButton
            label="Stats"
            active={activeTab === 'stats'}
            onPress={() => setActiveTab('stats')}
          />
          <TabButton
            label="Commentary"
            active={activeTab === 'commentary'}
            onPress={() => setActiveTab('commentary')}
          />
          <TabButton
            label="Lineups"
            active={activeTab === 'lineups'}
            onPress={() => setActiveTab('lineups')}
          />
        </View>

        {activeTab === 'stats' && <StatsCard match={match} stats={stats} />}
        {activeTab === 'commentary' && (
          <FlatList
            data={match?.events || []}
            keyExtractor={(item, index) => item._id || `event-${index}`}
            renderItem={renderEvent}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text
                style={{textAlign: 'center', color: '#64748B', padding: 20}}>
                No events yet
              </Text>
            }
          />
        )}
        {activeTab === 'lineups' && (
          <View style={styles.lineupTeamRow}>
            <TouchableOpacity
              style={styles.lineupTeamBtn}
              onPress={() => {
                setLineupSide('home');
                setShowLineups(true);
              }}>
              <Text style={styles.lineupTeamIcon}>🏠</Text>
              <Text style={styles.lineupTeamName} numberOfLines={1}>
                {match.homeTeam.teamName}
              </Text>
              <Text style={styles.lineupTeamArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lineupTeamBtn}
              onPress={() => {
                setLineupSide('away');
                setShowLineups(true);
              }}>
              <Text style={styles.lineupTeamIcon}>✈️</Text>
              <Text style={styles.lineupTeamName} numberOfLines={1}>
                {match.awayTeam.teamName}
              </Text>
              <Text style={styles.lineupTeamArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GOAL MODAL */}
        <Modal visible={goalModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Goal</Text>

              <Text style={styles.modalSection}>Team *</Text>

              <TouchableOpacity
                style={[
                  styles.playerItem,
                  selectedTeam?._id === match.homeTeam._id &&
                    styles.selectedItem,
                ]}
                onPress={() => {
                  setSelectedTeam(match.homeTeam);
                  loadPlayersForTeam(match.homeTeam);
                }}>
                <Text style={styles.playerText}>{match.homeTeam.teamName}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playerItem,
                  selectedTeam?._id === match.awayTeam._id &&
                    styles.selectedItem,
                ]}
                onPress={() => {
                  setSelectedTeam(match.awayTeam);
                  loadPlayersForTeam(match.awayTeam);
                }}>
                <Text style={styles.playerText}>{match.awayTeam.teamName}</Text>
              </TouchableOpacity>

              {selectedTeam && (
                <>
                  <Text style={styles.modalSection}>Goal Scorer *</Text>

                  <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    style={styles.playerList}
                    renderItem={renderScorer}
                    ListEmptyComponent={
                      <Text style={{color: '#64748B', textAlign: 'center'}}>
                        No players found
                      </Text>
                    }
                  />

                  <Text style={styles.modalSection}>Assist (optional)</Text>

                  <FlatList
                    data={[
                      {_id: null, name: 'No Assist'},
                      ...players.filter(p => p._id !== scorer?._id),
                    ]}
                    keyExtractor={(item, i) => item._id ?? `assist-${i}`}
                    style={styles.playerList}
                    renderItem={renderAssist}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setGoalModal(false)}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, !scorer && {opacity: 0.4}]}
                  disabled={!scorer}
                  onPress={submitGoal}>
                  <Text style={styles.submitText}>Add Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CARD MODAL */}
        <Modal visible={cardModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Card</Text>

              <Text style={styles.modalSection}>Team *</Text>

              {[match.homeTeam, match.awayTeam].map(team => (
                <TouchableOpacity
                  key={team._id}
                  style={[
                    styles.playerItem,
                    selectedTeam?._id === team._id && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setSelectedTeam(team);
                    setCardPlayer(null);
                    loadPlayersForTeam(team);
                  }}>
                  <Text style={styles.playerText}>{team.teamName}</Text>
                </TouchableOpacity>
              ))}

              {selectedTeam && (
                <>
                  <Text style={styles.modalSection}>Card Type *</Text>

                  <View style={styles.cardTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.cardChip,
                        cardType === 'YELLOW' && styles.yellowActive,
                      ]}
                      onPress={() => setCardType('YELLOW')}
                      activeOpacity={0.85}>
                      <Text style={styles.cardChipText}>🟨 Yellow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.cardChip,
                        cardType === 'RED' && styles.redActive,
                      ]}
                      onPress={() => setCardType('RED')}
                      activeOpacity={0.85}>
                      <Text style={styles.cardChipText}>🟥 Red</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {cardType && (
                <>
                  <Text style={styles.modalSection}>Player *</Text>

                  <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    style={styles.playerList}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[
                          styles.playerItem,
                          cardPlayer?._id === item._id && styles.selectedItem,
                        ]}
                        onPress={() => setCardPlayer(item)}>
                        <Text style={styles.playerText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setCardModal(false)}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!cardPlayer || !cardType) && {opacity: 0.4},
                  ]}
                  disabled={!cardPlayer || !cardType}
                  onPress={submitCard}>
                  <Text style={styles.submitText}>Add Card</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SUBSTITUTION MODAL */}
        <Modal visible={subModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Substitution</Text>

              <Text style={styles.modalSection}>Team *</Text>

              {[match.homeTeam, match.awayTeam].map(team => (
                <TouchableOpacity
                  key={team._id}
                  style={[
                    styles.playerItem,
                    selectedTeam?._id === team._id && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setSelectedTeam(team);
                    setSubOut(null);
                    setSubIn(null);
                    loadPlayersForTeam(team);
                  }}>
                  <Text style={styles.playerText}>{team.teamName}</Text>
                </TouchableOpacity>
              ))}

              {selectedTeam && (
                <>
                  <Text style={styles.modalSection}>Player OUT *</Text>
                  <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    style={styles.playerList}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[
                          styles.playerItem,
                          subOut?._id === item._id && styles.selectedItem,
                        ]}
                        onPress={() => setSubOut(item)}>
                        <Text style={styles.playerText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}

              {subOut && (
                <>
                  <Text style={styles.modalSection}>Player IN *</Text>
                  <FlatList
                    data={players.filter(p => p._id !== subOut._id)}
                    keyExtractor={item => item._id}
                    style={styles.playerList}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[
                          styles.playerItem,
                          subIn?._id === item._id && styles.selectedItem,
                        ]}
                        onPress={() => setSubIn(item)}>
                        <Text style={styles.playerText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setSubModal(false)}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!subOut || !subIn) && {opacity: 0.4},
                  ]}
                  disabled={!subOut || !subIn}
                  onPress={submitSubstitution}>
                  <Text style={styles.submitText}>Confirm Sub</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* LINEUPS MODAL */}
        <Modal visible={showLineups} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.lineupModal, {height: '90%'}]}>
              <View style={styles.lineupHeader}>
                <Text style={styles.lineupTitle}>Match Lineups</Text>
              </View>

              <View style={styles.lineupToggle}>
                <TouchableOpacity
                  onPress={() => setLineupSide('home')}
                  style={[
                    styles.lineupTab,
                    lineupSide === 'home' && styles.lineupTabActive,
                  ]}>
                  <Text
                    style={[
                      styles.lineupTabText,
                      lineupSide === 'home' && styles.lineupTabTextActive,
                    ]}>
                    {match.homeTeam.teamName}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLineupSide('away')}
                  style={[
                    styles.lineupTab,
                    lineupSide === 'away' && styles.lineupTabActive,
                  ]}>
                  <Text
                    style={[
                      styles.lineupTabText,
                      lineupSide === 'away' && styles.lineupTabTextActive,
                    ]}>
                    {match.awayTeam.teamName}
                  </Text>
                </TouchableOpacity>
              </View>

              {lineups && lineupMap && (
                <View style={styles.pitchWrapper}>
                  <Pitch
                    formation={lineups[lineupSide]?.formation}
                    lineup={lineupMap}
                    readOnly
                  />
                </View>
              )}

              <Text style={styles.benchTitle}>Bench</Text>

              <FlatList
                data={lineups?.[lineupSide]?.bench || []}
                keyExtractor={p => p._id}
                renderItem={({item}) => (
                  <View style={styles.benchItem}>
                    <Text style={styles.benchText}>{item.name}</Text>
                  </View>
                )}
              />

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowLineups(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {/* STICKY END MATCH BUTTON */}
      {/* STICKY BOTTOM — owner sees end button, viewer sees banner */}
      <View
        style={[styles.stickyBottom, {paddingBottom: insets.bottom + vs(8)}]}>
        {canManageMatch ? (
          <TouchableOpacity
            style={[
              styles.endBtn,
              (!canManageMatch || !socketConnected) && {opacity: 0.4},
            ]}
            onPress={endMatch}
            disabled={!canManageMatch || !socketConnected}>
            <Text style={styles.endText}>🏁 End Match</Text>
          </TouchableOpacity>
        ) : (
          <View style={viewerStyles.banner}>
            <View style={viewerStyles.bannerLeft}>
              <View style={viewerStyles.livePulse}>
                <View style={viewerStyles.liveDotInner} />
              </View>
              <View>
                <Text style={viewerStyles.bannerTitle}>Watching Live</Text>
                <Text style={viewerStyles.bannerSub}>
                  {isTournamentMatch
                    ? 'Managed by tournament organiser'
                    : 'Managed by match creator'}
                </Text>
              </View>
            </View>
            <View style={viewerStyles.eyeIcon}>
              <Text style={viewerStyles.eyeEmoji}>👁</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function EventItem({item, isLatest, isHomeTeam}) {
  return (
    <View
      style={[
        styles.event,
        isHomeTeam ? styles.homeEvent : styles.awayEvent,
        isLatest && styles.latestEvent,
      ]}>
      <Text style={styles.eventMinute}>{item.minute}'</Text>

      <View style={{flex: 1}}>
        <Text style={styles.eventTitle}>
          {item.type === 'GOAL' && '⚽ Goal'}
          {item.type === 'YELLOW' && '🟨 Yellow Card'}
          {item.type === 'RED' && '🟥 Red Card'}
          {item.type === 'SUBSTITUTION' && '🔁 Substitution'}
        </Text>

        {item.player && (
          <Text style={styles.eventPlayer}>{item.player.name}</Text>
        )}

        {item.assistPlayer && (
          <Text style={styles.eventAssist}>
            Assist: {item.assistPlayer.name}
          </Text>
        )}

        {item.substitutedPlayer && (
          <Text style={styles.eventAssist}>
            IN: {item.substitutedPlayer.name}
          </Text>
        )}
      </View>
    </View>
  );
}

function StatsCard({match, stats}) {
  if (!match || !stats) return null;

  const StatRow = ({label, home, away, icon}) => {
    const total = home + away || 1;
    const homeWidth = `${Math.round((home / total) * 100)}%`;
    const awayWidth = `${Math.round((away / total) * 100)}%`;

    return (
      <View style={statStyles.row}>
        <Text style={statStyles.value}>{home}</Text>
        <View style={statStyles.barSection}>
          <Text style={statStyles.label}>
            {icon} {label}
          </Text>
          <View style={statStyles.barTrack}>
            <View style={[statStyles.barHome, {flex: home || 0.01}]} />
            <View style={[statStyles.barAway, {flex: away || 0.01}]} />
          </View>
        </View>
        <Text style={statStyles.value}>{away}</Text>
      </View>
    );
  };

  return (
    <View style={statStyles.card}>
      {/* Header */}
      <View style={statStyles.header}>
        <Text style={statStyles.teamName} numberOfLines={1}>
          {match.homeTeam.teamName}
        </Text>
        <View style={statStyles.badge}>
          <Text style={statStyles.badgeText}>STATS</Text>
        </View>
        <Text style={statStyles.teamName} numberOfLines={1}>
          {match.awayTeam.teamName}
        </Text>
      </View>

      {/* Score highlight */}
      {/* <View style={statStyles.scoreHighlight}>
        <Text style={statStyles.bigScore}>{match.score?.home ?? 0}</Text>
        <Text style={statStyles.scoreSep}>—</Text>
        <Text style={statStyles.bigScore}>{match.score?.away ?? 0}</Text>
      </View> */}

      <View style={statStyles.divider} />

      <StatRow
        label="Goals"
        icon="⚽"
        home={stats.home.goals}
        away={stats.away.goals}
      />
      <StatRow
        label="Yellow Cards"
        icon="🟨"
        home={stats.home.yellow}
        away={stats.away.yellow}
      />
      <StatRow
        label="Red Cards"
        icon="🟥"
        home={stats.home.red}
        away={stats.away.red}
      />
      <StatRow
        label="Substitutions"
        icon="🔁"
        home={stats.home.subs}
        away={stats.away.subs}
      />
    </View>
  );
}

function PrimaryAction({label, icon, color, onPress, disabled}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryBtn,
        {backgroundColor: color},
        disabled && {opacity: 0.4},
      ]}>
      <Text style={styles.primaryIcon}>{icon}</Text>
      <Text style={styles.primaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function TabButton({label, active, onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ================= STYLES =================

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(20),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  teamName: {
    flex: 1,
    fontSize: rf(15), // ↑ was 13
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderRadius: ms(8),
    marginHorizontal: s(8),
  },
  badgeText: {
    fontSize: rf(11), // ↑ was 10
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1.5,
  },
  scoreHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14), // ↑ was 10
    gap: s(16),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    marginBottom: vs(16), // ↑ was 14
  },
  bigScore: {
    fontSize: ms(52), // ↑ was 44
    fontWeight: '900',
    color: '#0F172A',
  },
  scoreSep: {
    fontSize: ms(32), // ↑ was 28
    fontWeight: '300',
    color: '#CBD5E1',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: vs(16), // ↑ was 14
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(16), // ↑ was 14
    gap: s(8),
  },
  value: {
    width: s(28), // ↑ was 24
    fontSize: rf(18), // ↑ was 15
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  barSection: {
    flex: 1,
  },
  label: {
    fontSize: rf(13), // ↑ was 11
    fontWeight: '600',
    color: '#64748B', // slightly darker than #94A3B8 — more readable
    textAlign: 'center',
    marginBottom: vs(6), // ↑ was 4
  },
  barTrack: {
    flexDirection: 'row',
    height: vs(8), // ↑ was 6 — more visible
    borderRadius: ms(4),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  barHome: {
    backgroundColor: '#22C55E',
    borderRadius: ms(4),
  },
  barAway: {
    backgroundColor: '#2563EB',
    borderRadius: ms(4),
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: s(16),
    paddingTop: vs(16),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },

  title: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
  },

  live: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontWeight: '700',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(12),
    fontSize: rf(12),
  },

  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    paddingVertical: vs(20),
    paddingHorizontal: s(16),
    alignItems: 'center',
    marginBottom: vs(20),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  timer: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderRadius: ms(20),
    fontWeight: '700',
    marginBottom: vs(12),
    fontSize: rf(13),
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: s(10),
  },

  team: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#334155',
    width: '30%',
    textAlign: 'center',
  },

  score: {
    fontSize: ms(30),
    fontWeight: '900',
    color: '#0F172A',
    width: '40%',
    textAlign: 'center',
  },

  section: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: vs(10),
    marginTop: vs(4),
  },

  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(12),
    marginBottom: vs(16),
  },

  pauseBtn: {
    backgroundColor: '#FACC15',
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: ms(10),
  },

  pauseText: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: rf(14),
  },

  resetBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: ms(10),
  },

  resetText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(14),
  },

  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(16),
  },

  primaryBtn: {
    flex: 1,
    marginHorizontal: s(6),
    borderRadius: ms(18),
    paddingVertical: vs(14),
    alignItems: 'center',
  },

  primaryIcon: {
    fontSize: ms(22),
    marginBottom: vs(4),
  },

  primaryLabel: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(14),
    padding: s(4),
    marginBottom: vs(16),
  },

  tabBtn: {
    flex: 1,
    paddingVertical: vs(10),
    borderRadius: ms(12),
    alignItems: 'center',
  },

  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },

  tabLabel: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#64748B',
  },

  tabLabelActive: {
    color: '#0F172A',
  },

  event: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: ms(14),
    padding: s(10),
    marginBottom: vs(8),
  },

  eventMinute: {
    width: s(32),
    fontWeight: '800',
    color: '#64748B',
    fontSize: rf(13),
  },

  eventTitle: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  eventPlayer: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#1D4ED8',
    marginTop: vs(2),
  },

  eventAssist: {
    fontSize: rf(12),
    color: '#64748B',
  },

  homeEvent: {
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },

  awayEvent: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },

  latestEvent: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  endBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: vs(12),
    borderRadius: ms(14),
    alignItems: 'center',
    marginTop: vs(12),
  },

  endText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(15),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    padding: s(20),
    maxHeight: '80%',
  },

  modalTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(16),
    textAlign: 'center',
  },

  modalSection: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#334155',
    marginTop: vs(12),
    marginBottom: vs(6),
  },

  playerList: {
    maxHeight: vs(180),
    marginBottom: vs(10),
  },

  playerItem: {
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    borderRadius: ms(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: vs(8),
  },

  selectedItem: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },

  playerText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#0F172A',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(12),
  },

  cancel: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '600',
    fontSize: rf(14),
  },

  submitBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: vs(12),
    paddingHorizontal: s(24),
    borderRadius: ms(12),
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: '800',
  },

  cardTypeRow: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(6),
  },

  cardChip: {
    flex: 1,
    paddingVertical: vs(14),
    borderRadius: ms(16),
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardChipText: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  yellowActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FACC15',
  },

  redActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: s(16),
    marginBottom: vs(20),
  },

  statsTitle: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(12),
    textAlign: 'center',
  },

  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },

  statsHeaderTeam: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#64748B',
    width: '40%',
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  statsLabel: {
    width: '40%',
    fontSize: rf(13),
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  statsValue: {
    width: '30%',
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  lineupModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(20),
  },

  lineupHeader: {
    alignItems: 'center',
    marginBottom: vs(12),
  },

  lineupTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  lineupToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(16),
    padding: s(4),
    marginBottom: vs(14),
  },

  lineupTab: {
    flex: 1,
    paddingVertical: vs(8),
    borderRadius: ms(12),
    alignItems: 'center',
  },

  lineupTabActive: {
    backgroundColor: '#FFFFFF',
  },

  lineupTabText: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#64748B',
  },

  lineupTabTextActive: {
    color: '#0F172A',
  },

  pitchWrapper: {
    borderRadius: ms(18),
    overflow: 'hidden',
    backgroundColor: '#0F5132',
    marginBottom: vs(14),
    padding: s(6),
  },

  benchTitle: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: vs(8),
    marginTop: vs(6),
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

  closeBtn: {
    marginTop: vs(14),
    backgroundColor: '#F1F5F9',
    paddingVertical: vs(12),
    borderRadius: ms(14),
    alignItems: 'center',
  },

  closeText: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    borderRadius: ms(8),
    marginBottom: vs(12),
    gap: s(8),
  },

  socketStatusText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#DC2626',
  },

  liveDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#15803D',
  },
  // ADD these to your existing styles object
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stickyBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(16),
    paddingTop: vs(10),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  endBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: vs(14),
    borderRadius: ms(14),
    alignItems: 'center',
  },
  endText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: rf(15),
    letterSpacing: 0.5,
  },
  noPermissionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: rf(12),
    paddingVertical: vs(10),
  },
  lineupTeamRow: {
    gap: vs(10),
    marginBottom: vs(16),
  },
  lineupTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(14),
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  lineupTeamIcon: {
    fontSize: ms(20),
    marginRight: s(10),
  },
  lineupTeamName: {
    flex: 1,
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  lineupTeamArrow: {
    fontSize: ms(22),
    color: '#94A3B8',
    fontWeight: '300',
  },
  emptyCommentary: {
    alignItems: 'center',
    paddingVertical: vs(30),
  },
  emptyCommentaryIcon: {
    fontSize: ms(32),
    marginBottom: vs(8),
  },
  emptyCommentaryText: {
    color: '#94A3B8',
    fontSize: rf(14),
    fontWeight: '600',
  },
  restartBtn: {
    backgroundColor: '#22C55E',
    borderRadius: ms(14),
    paddingVertical: vs(14),
    paddingHorizontal: s(20),
    marginBottom: vs(16),
    elevation: 4,
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  restartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  restartIcon: {
    fontSize: ms(28),
  },
  restartTitle: {
    fontSize: rf(15),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  restartSub: {
    fontSize: rf(12),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: vs(1),
  },
});

const viewerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  livePulse: {
    width: s(36),
    height: s(36),
    borderRadius: ms(18),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotInner: {
    width: s(12),
    height: s(12),
    borderRadius: ms(6),
    backgroundColor: '#22C55E',
  },
  bannerTitle: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSub: {
    fontSize: rf(11),
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: vs(1),
  },
  eyeIcon: {
    width: s(36),
    height: s(36),
    borderRadius: ms(18),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeEmoji: {
    fontSize: ms(16),
  },
});

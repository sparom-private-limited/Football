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
  const {
    matchData,
    isConnected: socketConnected,
    error: socketError,
  } = useMatchSocket(matchId, {
    onJoined: data => {
      console.log('✅ Joined match room:', data);
    },
    onStart: data => {
      console.log('⚽ Match started via socket:', data);
      // Reload match data to sync
      loadMatch();
    },
    onEnd: data => {
      console.log('🏁 Match ended via socket:', data);
      Alert.alert(
        'Match Ended',
        'This match has been completed.',
        [
          {
            text: 'View Summary',
            onPress: () => {
              nav.replace('MatchSummary', {matchId});
            },
          },
        ],
        {cancelable: false},
      );
    },
    onGoal: data => {
      console.log('⚽ Goal scored via socket:', data);
      // Update match data with new score and event
      setMatch(prev => ({
        ...prev,
        score: data.score,
        events: [...prev.events, data.event],
      }));
    },
    onCard: data => {
      console.log('🟨 Card issued via socket:', data);
      // Update match events
      setMatch(prev => ({
        ...prev,
        events: [...prev.events, data.event],
      }));
    },
    onSubstitution: data => {
      console.log('🔄 Substitution via socket:', data);
      // Update match events
      setMatch(prev => ({
        ...prev,
        events: [...prev.events, data.event],
      }));
    },
    onStatusUpdate: data => {
      setMatch(prev => ({
        ...prev,
        status: data.status,
        startedAt: data.startedAt || prev.startedAt,
      }));
    },
    onError: error => {
      console.error('❌ Socket error:', error);
      Alert.alert('Socket Error', error.message);
    },
    onReset: data => {
      setMatch(prev => ({
        ...prev,
        events: [],
        score: data.score || {home: 0, away: 0},
        status: data.status,
        startedAt: data.startedAt || null,
        completedAt: null,
        winner: null,
      }));

      setSecondsElapsed(0);

      Alert.alert('Match Reset', 'Match has been reset successfully');
    },
  });

  useEffect(() => {
    if (!matchData) return;

    setMatch(prev => ({
      ...prev,
      score: matchData.score || prev.score,
      events: matchData.events || [],
      status: matchData.status || prev.status,
      startedAt: matchData.startedAt || prev.startedAt,
      completedAt: matchData.completedAt || prev.completedAt,
      winner: matchData.winner || prev.winner,
    }));
  }, [matchData]);

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
    if (!match?.startedAt || match.status !== 'LIVE') {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const started = new Date(match.startedAt).getTime();
      const elapsed = Math.floor((now - started) / 1000);
      setSecondsElapsed(elapsed > 0 ? elapsed : 0);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [match?.startedAt, match?.status]);

  // ================= TIMER INCREMENT =================
  useEffect(() => {
    if (!match || match.status !== 'LIVE') return;

    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.status, isPaused]);

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
    <View style={styles.container}>
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

      {/* TIMER CONTROLS */}
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[
            styles.pauseBtn,
            (!canManageMatch || !socketConnected || isPauseResumeDisabled) && {
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

      {/* QUICK ACTIONS */}
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

      {/* VIEW TOGGLES */}
      <View style={styles.viewTabs}>
        <TabButton
          label="Stats"
          active={activeTab === 'stats'}
          onPress={() => setActiveTab('stats')}
        />
        <TabButton
          label="Lineups"
          active={activeTab === 'lineups'}
          onPress={() => setActiveTab('lineups')}
        />
      </View>

      {activeTab === 'stats' && <StatsCard match={match} stats={stats} />}
      {activeTab === 'lineups' && (
        <TouchableOpacity onPress={() => setShowLineups(true)}>
          <Text style={{textAlign: 'center', color: '#2563EB', padding: 12}}>
            View Lineups
          </Text>
        </TouchableOpacity>
      )}

      {/* COMMENTARY */}
      <Text style={styles.section}>Match Commentary</Text>

      <FlatList
        data={match?.events || []}
        keyExtractor={item => item._id}
        renderItem={renderEvent}
        ListEmptyComponent={
          <Text style={{textAlign: 'center', color: '#64748B', padding: 20}}>
            No events yet
          </Text>
        }
      />

      {/* END MATCH */}
      <TouchableOpacity
        style={[
          styles.endBtn,
          {marginBottom: insets.bottom + 12},
          (!canManageMatch || !socketConnected) && {opacity: 0.4},
        ]}
        onPress={endMatch}
        disabled={!canManageMatch || !socketConnected}>
        <Text style={styles.endText}>End Match</Text>
      </TouchableOpacity>

      {!canManageMatch && (
        <Text style={{textAlign: 'center', color: '#64748B', marginTop: 8}}>
          {isTournamentMatch
            ? 'Only tournament organiser can manage this match'
            : 'Only match creator can manage this match'}
        </Text>
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
                selectedTeam?._id === match.homeTeam._id && styles.selectedItem,
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
                selectedTeam?._id === match.awayTeam._id && styles.selectedItem,
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

  const Row = ({label, home, away}) => (
    <View style={styles.statsRow}>
      <Text style={styles.statsValue}>{home}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
      <Text style={styles.statsValue}>{away}</Text>
    </View>
  );

  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Match Stats</Text>

      <View style={styles.statsHeader}>
        <Text style={styles.statsHeaderTeam}>{match.homeTeam.teamName}</Text>
        <Text style={styles.statsHeaderTeam}>{match.awayTeam.teamName}</Text>
      </View>

      <Row label="Goals" home={stats.home.goals} away={stats.away.goals} />
      <Row
        label="Yellow Cards"
        home={stats.home.yellow}
        away={stats.away.yellow}
      />
      <Row label="Red Cards" home={stats.home.red} away={stats.away.red} />
      <Row
        label="Substitutions"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  live: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },

  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  timer: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: '700',
    marginBottom: 12,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },

  team: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    width: '30%',
    textAlign: 'center',
  },

  score: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    width: '40%',
    textAlign: 'center',
  },

  section: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    marginTop: 4,
  },

  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },

  pauseBtn: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },

  pauseText: {
    fontWeight: '800',
    color: '#0F172A',
  },

  resetBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },

  resetText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  primaryBtn: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },

  primaryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },

  primaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },

  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  tabLabelActive: {
    color: '#0F172A',
  },

  event: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },

  eventMinute: {
    width: 32,
    fontWeight: '800',
    color: '#64748B',
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  eventPlayer: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    marginTop: 2,
  },

  eventAssist: {
    fontSize: 12,
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
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  endText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },

  modalSection: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },

  playerList: {
    maxHeight: 180,
    marginBottom: 10,
  },

  playerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },

  selectedItem: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },

  playerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  cancel: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '600',
  },

  submitBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  cardTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },

  cardChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardChipText: {
    fontSize: 14,
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },

  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statsHeaderTeam: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: '40%',
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  statsLabel: {
    width: '40%',
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  statsValue: {
    width: '30%',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  lineupModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  lineupHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },

  lineupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  lineupToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },

  lineupTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },

  lineupTabActive: {
    backgroundColor: '#FFFFFF',
  },

  lineupTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  lineupTabTextActive: {
    color: '#0F172A',
  },

  pitchWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F5132',
    marginBottom: 14,
    padding: 6,
  },

  benchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 6,
  },

  benchItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  benchText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  closeBtn: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },

  closeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },

  socketStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
  },
});

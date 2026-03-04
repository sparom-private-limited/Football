import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import API from '../api/api';
import MainLayout from '../components/MainLayout';
import useNavigationHelper from '../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../utils/responsive';

const RESULT_STYLE = {
  W: {bg:'#DCFCE7', color:'#16A34A'},
  D: {bg:'#FEF9C3', color:'#D97706'},
  L: {bg:'#FEE2E2', color:'#DC2626'},
};
const POSITION_COLORS = {GK:'#8B5CF6', DEF:'#2563EB', MID:'#16A34A', FW:'#EF4444'};

export default function PlayerStatsScreen() {
  const {params} = useRoute();
  const nav = useNavigationHelper();
  const {playerId, tournamentId} = params || {};
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await API.get(`/api/player/${playerId}/stats`, {params: {tournamentId}});
      setStats(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load player stats');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <MainLayout title="Player Stats" forceBack>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB"/><Text style={styles.loadingText}>Loading...</Text></View>
    </MainLayout>
  );

  if (!stats) return (
    <MainLayout title="Player Stats" forceBack>
      <View style={styles.center}><Text style={styles.bigEmoji}>📊</Text><Text style={styles.emptyTitle}>No stats available</Text></View>
    </MainLayout>
  );

  const {player={}, performance={}, rankings={}, matchLog=[]} = stats;
  const g = performance.goals || 0;
  const a = performance.assists || 0;
  const mp = performance.matchesPlayed || 0;
  const posColor = POSITION_COLORS[player.position] || '#2563EB';

  return (
    <MainLayout title={player.name || 'Player'} forceBack>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.hc1}/><View style={styles.hc2}/>

          <View style={styles.heroAvatarWrap}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarTxt}>{player.name?.[0]?.toUpperCase()||'P'}</Text>
            </View>
            {rankings.goalRank===1 && (
              <View style={styles.crownBadge}><Text style={styles.crownTxt}>👑</Text></View>
            )}
          </View>

          <Text style={styles.heroName}>{player.name||'Player'}</Text>
          <Text style={styles.heroTeam}>{player.teamName||'—'}</Text>

          <View style={styles.heroBadgesRow}>
            {player.position && (
              <View style={[styles.posPill,{backgroundColor:posColor+'30',borderColor:posColor+'60'}]}>
                <Text style={[styles.posTxt,{color:posColor}]}>{player.position}</Text>
              </View>
            )}
            {player.jerseyNumber && (
              <View style={styles.jerseyPill}>
                <Text style={styles.jerseyTxt}>#{player.jerseyNumber}</Text>
              </View>
            )}
          </View>

          {/* Key stats strip */}
          <View style={styles.heroRow}>
            <HStat v={g}  l="Goals"   c="#60A5FA"/>
            <View style={styles.hDiv}/>
            <HStat v={a}  l="Assists" c="#A78BFA"/>
            <View style={styles.hDiv}/>
            <HStat v={g+a} l="G + A"  c="#34D399"/>
            <View style={styles.hDiv}/>
            <HStat v={mp} l="Matches" c="#FBBF24"/>
          </View>
        </View>

        {/* TOURNAMENT RANKINGS */}
        {(rankings.goalRank || rankings.assistRank) && (
          <View style={styles.rankingsRow}>
            {rankings.goalRank && (
              <View style={[styles.rankCard, rankings.goalRank<=3 && styles.rankCardTop]}>
                <Text style={styles.rankCardIcon}>⚽</Text>
                <Text style={[styles.rankCardNum,{color:'#2563EB'}]}>#{rankings.goalRank}</Text>
                <Text style={styles.rankCardLbl}>Goal Ranking</Text>
                {rankings.totalPlayers && <Text style={styles.rankCardOf}>of {rankings.totalPlayers}</Text>}
              </View>
            )}
            {rankings.assistRank && (
              <View style={[styles.rankCard, rankings.assistRank<=3 && styles.rankCardTop]}>
                <Text style={styles.rankCardIcon}>🎯</Text>
                <Text style={[styles.rankCardNum,{color:'#8B5CF6'}]}>#{rankings.assistRank}</Text>
                <Text style={styles.rankCardLbl}>Assist Ranking</Text>
                {rankings.totalPlayers && <Text style={styles.rankCardOf}>of {rankings.totalPlayers}</Text>}
              </View>
            )}
          </View>
        )}

        {/* ATTACKING STATS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attacking</Text>
          <View style={styles.statGrid}>
            {[
              {icon:'⚽', v:g,                                         l:'Goals',       c:'#2563EB'},
              {icon:'🎯', v:a,                                         l:'Assists',     c:'#8B5CF6'},
              {icon:'🔥', v:g+a,                                       l:'G + A',       c:'#F59E0B'},
              {icon:'📊', v:mp>0?(g/mp).toFixed(2):'0.00',            l:'Goals/Match', c:'#0EA5E9'},
              {icon:'🕐', v:performance.minutesPlayed||0,              l:'Minutes',     c:'#64748B'},
              {icon:'📅', v:mp,                                        l:'Matches',     c:'#475569'},
            ].map(({icon,v,l,c})=>(
              <View key={l} style={styles.statBox}>
                <Text style={styles.statIcon}>{icon}</Text>
                <Text style={[styles.statVal,{color:c}]}>{v}</Text>
                <Text style={styles.statLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DISCIPLINE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discipline</Text>
          <View style={styles.disciplineRow}>
            <DisciplineBox emoji="🟨" value={performance.yellowCards||0} label="Yellow Cards" color="#F59E0B"/>
            <DisciplineBox emoji="🟥" value={performance.redCards||0}    label="Red Cards"    color="#EF4444"/>
            <DisciplineBox emoji="📅" value={mp}                         label="Matches"      color="#2563EB"/>
          </View>
        </View>

        {/* MATCH LOG */}
        {matchLog.length>0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Match Log</Text>
              <Text style={styles.cardSub}>{matchLog.length} matches</Text>
            </View>

            {/* Column headers */}
            <View style={styles.logHead}>
              <Text style={[styles.logH,{width:s(32)}]}>Res</Text>
              <Text style={[styles.logH,{flex:1}]}>Match</Text>
              <Text style={styles.logH}>G</Text>
              <Text style={styles.logH}>A</Text>
              <Text style={styles.logH}>Crd</Text>
              <Text style={styles.logH}>Min</Text>
            </View>

            {matchLog.map((m,i)=>{
              const rs = RESULT_STYLE[m.result]||{bg:'#F1F5F9',color:'#94A3B8'};
              return (
                <TouchableOpacity key={m.matchId||i} style={styles.logRow}
                  onPress={()=>nav.toMatch('MatchSummary',{matchId:m.matchId})} activeOpacity={0.75}>

                  {/* Result pill */}
                  <View style={[styles.resPill,{backgroundColor:rs.bg,width:s(32)}]}>
                    <Text style={[styles.resPillTxt,{color:rs.color}]}>{m.result||'—'}</Text>
                  </View>

                  {/* Match info */}
                  <View style={styles.logInfo}>
                    <Text style={styles.logOpp} numberOfLines={1}>vs {m.opponentName||'Opponent'}</Text>
                    <Text style={styles.logDate}>
                      {m.date?new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''}
                      {m.round?` · ${m.round}`:''}
                    </Text>
                  </View>

                  {/* Goals */}
                  <View style={styles.logCell}>
                    {m.goals>0
                      ? <View style={styles.logBadge}><Text style={styles.logBadgeTxt}>{m.goals}</Text></View>
                      : <Text style={styles.logDash}>—</Text>
                    }
                  </View>

                  {/* Assists */}
                  <View style={styles.logCell}>
                    {m.assists>0
                      ? <View style={[styles.logBadge,{backgroundColor:'#EDE9FE'}]}><Text style={[styles.logBadgeTxt,{color:'#6D28D9'}]}>{m.assists}</Text></View>
                      : <Text style={styles.logDash}>—</Text>
                    }
                  </View>

                  {/* Cards */}
                  <View style={styles.logCell}>
                    {m.redCard
                      ? <Text style={{fontSize:ms(13)}}>🟥</Text>
                      : m.yellowCard
                        ? <Text style={{fontSize:ms(13)}}>🟨</Text>
                        : <Text style={styles.logDash}>—</Text>
                    }
                  </View>

                  {/* Minutes */}
                  <Text style={styles.logMin}>{m.minutesPlayed??90}'</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {matchLog.length===0 && (
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchIcon}>📋</Text>
            <Text style={styles.emptyMatchTitle}>No match history</Text>
            <Text style={styles.emptyMatchSub}>This player hasn't featured in any completed matches yet</Text>
          </View>
        )}

      </ScrollView>
    </MainLayout>
  );
}

/* ─── Sub-components ─── */
function HStat({v,l,c}) {
  return (
    <View style={styles.hStat}>
      <Text style={[styles.hStatV,{color:c}]}>{v}</Text>
      <Text style={styles.hStatL}>{l}</Text>
    </View>
  );
}

function DisciplineBox({emoji,value,label,color}) {
  return (
    <View style={[styles.discBox,value>0&&{borderColor:color+'50',borderWidth:1.5}]}>
      <Text style={styles.discEmoji}>{emoji}</Text>
      <Text style={[styles.discVal,{color:value>0?color:'#94A3B8'}]}>{value}</Text>
      <Text style={styles.discLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:{paddingBottom:vs(48),backgroundColor:'#F8FAFC'},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:vs(10),backgroundColor:'#F8FAFC'},
  loadingText:{color:'#94A3B8',fontSize:rf(14)},
  bigEmoji:{fontSize:ms(44)},
  emptyTitle:{fontSize:rf(18),fontWeight:'800',color:'#0F172A'},

  /* HERO — blue */
  hero:{margin:s(16),marginBottom:vs(12),backgroundColor:'#1D4ED8',borderRadius:ms(24),padding:s(24),overflow:'hidden',position:'relative',alignItems:'center'},
  hc1:{position:'absolute',width:s(200),height:s(200),borderRadius:s(100),backgroundColor:'#2563EB30',right:-s(60),top:-s(60)},
  hc2:{position:'absolute',width:s(150),height:s(150),borderRadius:s(75),backgroundColor:'#3B82F620',left:-s(40),bottom:-s(40)},

  heroAvatarWrap:{position:'relative',marginBottom:vs(12)},
  heroAvatar:{width:s(80),height:s(80),borderRadius:s(40),backgroundColor:'#2563EB',alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'#60A5FA'},
  heroAvatarTxt:{fontSize:ms(32),fontWeight:'900',color:'#FFFFFF'},
  crownBadge:{position:'absolute',top:-s(8),right:-s(8),width:s(28),height:s(28),borderRadius:s(14),backgroundColor:'#FEF9C3',alignItems:'center',justifyContent:'center'},
  crownTxt:{fontSize:ms(14)},

  heroName:{fontSize:ms(22),fontWeight:'900',color:'#FFFFFF'},
  heroTeam:{fontSize:rf(13),color:'#BFDBFE',fontWeight:'500',marginTop:vs(2),marginBottom:vs(10)},

  heroBadgesRow:{flexDirection:'row',gap:s(8),marginBottom:vs(18)},
  posPill:{paddingHorizontal:s(12),paddingVertical:vs(4),borderRadius:ms(20),borderWidth:1},
  posTxt:{fontSize:rf(12),fontWeight:'800'},
  jerseyPill:{backgroundColor:'#1E40AF',paddingHorizontal:s(12),paddingVertical:vs(4),borderRadius:ms(20)},
  jerseyTxt:{color:'#BFDBFE',fontSize:rf(12),fontWeight:'700'},

  heroRow:{flexDirection:'row',backgroundColor:'#1E40AF',borderRadius:ms(16),paddingVertical:vs(12),width:'100%'},
  hStat:{flex:1,alignItems:'center'},
  hStatV:{fontSize:ms(20),fontWeight:'900'},
  hStatL:{fontSize:rf(9),color:'#93C5FD',fontWeight:'600',textTransform:'uppercase',marginTop:vs(2)},
  hDiv:{width:1,backgroundColor:'#2563EB',marginVertical:vs(4)},

  /* RANKINGS */
  rankingsRow:{flexDirection:'row',marginHorizontal:s(16),marginBottom:vs(12),gap:s(10)},
  rankCard:{flex:1,backgroundColor:'#FFFFFF',borderRadius:ms(18),padding:s(16),alignItems:'center',gap:vs(3),
    shadowColor:'#000',shadowOpacity:0.05,shadowRadius:8,elevation:2,borderWidth:1,borderColor:'#EFF6FF'},
  rankCardTop:{borderColor:'#BFDBFE',borderWidth:1.5},
  rankCardIcon:{fontSize:ms(24)},
  rankCardNum:{fontSize:ms(28),fontWeight:'900'},
  rankCardLbl:{fontSize:rf(11),color:'#64748B',fontWeight:'600',textAlign:'center'},
  rankCardOf:{fontSize:rf(10),color:'#94A3B8'},

  /* CARD */
  card:{backgroundColor:'#FFFFFF',marginHorizontal:s(16),marginBottom:vs(12),padding:s(18),borderRadius:ms(20),
    borderWidth:1,borderColor:'#EFF6FF',shadowColor:'#1E3A8A',shadowOpacity:0.06,shadowOffset:{width:0,height:vs(3)},shadowRadius:10,elevation:3},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:vs(14)},
  cardTitle:{fontSize:rf(16),fontWeight:'800',color:'#0F172A',marginBottom:vs(14)},
  cardSub:{fontSize:rf(12),color:'#94A3B8'},

  /* STATS GRID */
  statGrid:{flexDirection:'row',flexWrap:'wrap',gap:s(10)},
  statBox:{width:'30%',flexGrow:1,backgroundColor:'#F8FAFC',borderRadius:ms(14),padding:s(12),alignItems:'center',borderWidth:1,borderColor:'#EFF6FF'},
  statIcon:{fontSize:ms(20),marginBottom:vs(4)},
  statVal:{fontSize:ms(22),fontWeight:'900'},
  statLbl:{fontSize:rf(9),color:'#94A3B8',fontWeight:'600',textTransform:'uppercase',textAlign:'center',marginTop:vs(2)},

  /* DISCIPLINE */
  disciplineRow:{flexDirection:'row',gap:s(10)},
  discBox:{flex:1,backgroundColor:'#F8FAFC',borderRadius:ms(14),padding:s(14),alignItems:'center',gap:vs(4),borderWidth:1,borderColor:'#EFF6FF'},
  discEmoji:{fontSize:ms(24)},
  discVal:{fontSize:ms(24),fontWeight:'900'},
  discLbl:{fontSize:rf(9),color:'#94A3B8',fontWeight:'600',textTransform:'uppercase',textAlign:'center'},

  /* MATCH LOG */
  logHead:{flexDirection:'row',alignItems:'center',paddingVertical:vs(8),paddingHorizontal:s(2),backgroundColor:'#F8FAFC',borderRadius:ms(10),marginBottom:vs(4)},
  logH:{width:s(32),textAlign:'center',fontSize:rf(10),fontWeight:'700',color:'#94A3B8',textTransform:'uppercase'},
  logRow:{flexDirection:'row',alignItems:'center',paddingVertical:vs(11),borderBottomWidth:1,borderBottomColor:'#F1F5F9',gap:s(6)},
  resPill:{height:s(28),borderRadius:s(14),alignItems:'center',justifyContent:'center'},
  resPillTxt:{fontSize:rf(12),fontWeight:'900'},
  logInfo:{flex:1},
  logOpp:{fontSize:rf(13),fontWeight:'700',color:'#0F172A'},
  logDate:{fontSize:rf(10),color:'#94A3B8',fontWeight:'500',marginTop:vs(1)},
  logCell:{width:s(32),alignItems:'center'},
  logBadge:{backgroundColor:'#EFF6FF',paddingHorizontal:s(6),paddingVertical:vs(2),borderRadius:ms(8)},
  logBadgeTxt:{fontSize:rf(11),fontWeight:'700',color:'#2563EB'},
  logDash:{color:'#CBD5E1',fontSize:rf(13),fontWeight:'600'},
  logMin:{width:s(32),textAlign:'right',fontSize:rf(11),color:'#94A3B8',fontWeight:'600'},

  /* EMPTY */
  emptyMatches:{alignItems:'center',paddingTop:vs(32),paddingHorizontal:s(32)},
  emptyMatchIcon:{fontSize:ms(44),marginBottom:vs(10)},
  emptyMatchTitle:{fontSize:rf(17),fontWeight:'800',color:'#0F172A',marginBottom:vs(4)},
  emptyMatchSub:{fontSize:rf(13),color:'#94A3B8',textAlign:'center',lineHeight:vs(20)},
});
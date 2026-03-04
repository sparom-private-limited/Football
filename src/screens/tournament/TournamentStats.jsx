import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';
 
const TABS = ['Standings', 'Top Scorers', 'Overview'];
const RANK_COLORS = ['#F59E0B', '#94A3B8', '#B45309'];

export default function TournamentStatsScreen() {
  const {params} = useRoute();
  const nav = useNavigationHelper();
  const {tournamentId, tournamentName} = params || {};
  const [activeTab, setActiveTab] = useState('Standings');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await API.get(`/api/tournament/${tournamentId}/stats`);
      setStats(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load stats');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <MainLayout title="Stats" forceBack>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Crunching the numbers...</Text>
      </View>
    </MainLayout>
  );

  if (!stats) return (
    <MainLayout title="Stats" forceBack>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No stats yet</Text>
        <Text style={styles.emptySub}>Stats appear after matches are completed</Text>
      </View>
    </MainLayout>
  );

  const {standings=[], topScorers=[], topAssists=[], mostYellowCards=[], overview={}, recentResults=[]} = stats;

  return (
    <MainLayout title={tournamentName || 'Stats'} forceBack>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.hc1}/><View style={styles.hc2}/>
          <Text style={styles.heroLabel}>TOURNAMENT STATISTICS</Text>
          <Text style={styles.heroTitle}>{tournamentName || 'Tournament'}</Text>
          <View style={styles.heroRow}>
            <HStat v={overview.totalMatches??0} l="Matches"/>
            <View style={styles.hDiv}/>
            <HStat v={overview.totalGoals??0} l="Goals"/>
            <View style={styles.hDiv}/>
            <HStat v={overview.teamsCount??0} l="Teams"/>
            <View style={styles.hDiv}/>
            <HStat v={overview.avgGoalsPerMatch ? Number(overview.avgGoalsPerMatch).toFixed(1):'0'} l="Avg Goals"/>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabWrap}>
          <View style={styles.tabBar}>
            {TABS.map(t => (
              <TouchableOpacity key={t} style={[styles.tab, activeTab===t&&styles.tabActive]} onPress={()=>setActiveTab(t)} activeOpacity={0.8}>
                <Text style={[styles.tabTxt, activeTab===t&&styles.tabTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STANDINGS */}
        {activeTab==='Standings' && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Team Standings</Text>
              <Text style={styles.cardSub}>{standings.length} teams</Text>
            </View>
            {standings.length===0 ? <Empty text="No completed matches yet"/> : <>
              <View style={styles.tHead}>
                <Text style={[styles.th,{width:s(32)}]}>#</Text>
                <Text style={[styles.th,{flex:1}]}>Team</Text>
                {['P','W','D','L','GD','Pts'].map(h=>(
                  <Text key={h} style={[styles.thC, h==='Pts'&&{color:'#2563EB',fontWeight:'800'}]}>{h}</Text>
                ))}
              </View>
              {standings.map((row,i)=>(
                <TouchableOpacity key={row.teamId} style={[styles.tRow,i===0&&styles.tRowTop]}
                  onPress={()=>nav.to('TeamStats',{teamId:row.teamId,tournamentId})} activeOpacity={0.75}>
                  <View style={[styles.rPill,i<3&&{backgroundColor:RANK_COLORS[i]}]}>
                    <Text style={[styles.rPillTxt,i<3&&{color:'#fff'}]}>{i+1}</Text>
                  </View>
                  <View style={styles.tTeamCell}>
                    <TAvatar name={row.teamName} logo={row.teamLogoUrl} size={26}/>
                    <Text style={styles.tTeamName} numberOfLines={1}>{row.teamName}</Text>
                  </View>
                  <Text style={styles.td}>{row.played}</Text>
                  <Text style={[styles.td,{color:'#16A34A',fontWeight:'700'}]}>{row.wins}</Text>
                  <Text style={styles.td}>{row.draws}</Text>
                  <Text style={[styles.td,{color:'#DC2626'}]}>{row.losses}</Text>
                  <Text style={styles.td}>{row.goalDifference>0?`+${row.goalDifference}`:row.goalDifference}</Text>
                  <Text style={[styles.td,styles.pts]}>{row.points}</Text>
                </TouchableOpacity>
              ))}
            </>}
          </View>
        )}

        {/* TOP SCORERS */}
        {activeTab==='Top Scorers' && <>
          {topScorers.length>0 && (
            <View style={styles.goldenCard}>
              <View style={styles.goldenLeft}>
                <Text style={styles.goldenIcon}>🥇</Text>
                <View>
                  <Text style={styles.goldenLabel}>GOLDEN BOOT</Text>
                  <Text style={styles.goldenName}>{topScorers[0].playerName}</Text>
                  <Text style={styles.goldenTeam}>{topScorers[0].teamName}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.goldenNum}>{topScorers[0].goals}</Text>
                <Text style={styles.goldenGoalLbl}>goals</Text>
              </View>
            </View>
          )}
          <LeaderCard title="Top Scorers" sub="⚽ Goals" data={topScorers} valueKey="goals" unit="goals"
            emptyText="No goals scored yet" nav={nav} tournamentId={tournamentId}/>
          {topAssists.length>0 && <LeaderCard title="Top Assists" sub="🎯 Assists" data={topAssists} valueKey="assists" unit="assists"
            nav={nav} tournamentId={tournamentId}/>}
          {mostYellowCards.length>0 && <LeaderCard title="Discipline" sub="🟨 Cards" data={mostYellowCards} valueKey="yellowCards"
            unit="yellow" valueColor="#F59E0B" nav={nav} tournamentId={tournamentId}/>}
        </>}

        {/* OVERVIEW */}
        {activeTab==='Overview' && <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Match Statistics</Text>
            <View style={styles.oGrid}>
              {[
                {icon:'⚽',v:overview.totalGoals??0,l:'Total Goals'},
                {icon:'🏆',v:overview.totalMatches??0,l:'Matches'},
                {icon:'📊',v:overview.avgGoalsPerMatch?Number(overview.avgGoalsPerMatch).toFixed(1):'0',l:'Goals/Match'},
                {icon:'🧤',v:overview.cleanSheets??0,l:'Clean Sheets'},
                {icon:'🟨',v:overview.totalYellowCards??0,l:'Yellows'},
                {icon:'🟥',v:overview.totalRedCards??0,l:'Reds'},
              ].map(({icon,v,l})=>(
                <View key={l} style={styles.oBox}>
                  <Text style={styles.oIcon}>{icon}</Text>
                  <Text style={styles.oVal}>{v}</Text>
                  <Text style={styles.oLbl}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          {standings.length>0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Team Highlights</Text>
              {[
                {icon:'🏆',label:'Most Wins',key:'wins',unit:'wins'},
                {icon:'⚽',label:'Top Scoring',key:'goalsFor',unit:'goals'},
                {icon:'🧤',label:'Best Defense',key:'goalsAgainst',unit:'conceded'},
              ].map(({icon,label,key,unit})=>{
                const team = key==='goalsAgainst'
                  ? standings.reduce((a,b)=>b.goalsAgainst<a.goalsAgainst?b:a,standings[0])
                  : standings.reduce((a,b)=>b[key]>a[key]?b:a,standings[0]);
                return (
                  <TouchableOpacity key={label} style={styles.hlRow}
                    onPress={()=>nav.to('TeamStats',{teamId:team.teamId,tournamentId})} activeOpacity={0.75}>
                    <Text style={styles.hlIcon}>{icon}</Text>
                    <View style={styles.hlInfo}>
                      <Text style={styles.hlLabel}>{label}</Text>
                      <Text style={styles.hlTeam}>{team.teamName}</Text>
                    </View>
                    <View>
                      <Text style={styles.hlVal}>{team[key]??0}</Text>
                      <Text style={styles.hlUnit}>{unit}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {recentResults.length>0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Results</Text>
              {recentResults.map((m,i)=>(
                <View key={m._id||i} style={styles.recentRow}>
                  <Text style={styles.recentTeam} numberOfLines={1}>{m.homeTeam?.teamName}</Text>
                  <Text style={styles.recentScore}>{m.score?.home??0} – {m.score?.away??0}</Text>
                  <Text style={[styles.recentTeam,{textAlign:'right'}]} numberOfLines={1}>{m.awayTeam?.teamName}</Text>
                </View>
              ))}
            </View>
          )}
        </>}
      </ScrollView>
    </MainLayout>
  );
}

function HStat({v,l}) {
  return <View style={styles.hStat}><Text style={styles.hStatV}>{v}</Text><Text style={styles.hStatL}>{l}</Text></View>;
}
function TAvatar({name,logo,size=32}) {
  return logo
    ? <Image source={{uri:logo}} style={{width:s(size),height:s(size),borderRadius:s(size/2)}}/>
    : <View style={[styles.av,{width:s(size),height:s(size),borderRadius:s(size/2)}]}>
        <Text style={[styles.avTxt,{fontSize:ms(size*0.45)}]}>{name?.[0]?.toUpperCase()||'T'}</Text>
      </View>;
}
function LeaderCard({title,sub,data,valueKey,unit,valueColor,emptyText,nav,tournamentId}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSub}>{sub}</Text></View>
      {(!data||data.length===0) ? <Empty text={emptyText||'No data yet'}/> :
        data.map((p,i)=>(
          <TouchableOpacity key={p.playerId||i} style={styles.rankRow}
            onPress={()=>nav.to('PlayerStats',{playerId:p.playerId,tournamentId})} activeOpacity={0.75}>
            <View style={[styles.rankBadge,i<3&&{backgroundColor:RANK_COLORS[i]}]}>
              <Text style={[styles.rankBadgeTxt,i<3&&{color:'#fff'}]}>{i+1}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName} numberOfLines={1}>{p.playerName}</Text>
              <Text style={styles.rankTeam}>{p.teamName}</Text>
            </View>
            <View style={styles.rankRight}>
              <Text style={[styles.rankVal,valueColor&&{color:valueColor}]}>{p[valueKey]}</Text>
              <Text style={styles.rankUnit}>{unit}</Text>
            </View>
          </TouchableOpacity>
        ))
      }
    </View>
  );
}
function Empty({text}) {
  return <View style={styles.emptyBox}><Text style={styles.emptyTxt}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  scroll:{paddingBottom:vs(48),backgroundColor:'#F8FAFC'},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:vs(10),backgroundColor:'#F8FAFC'},
  loadingText:{color:'#94A3B8',fontSize:rf(14)},
  bigEmoji:{fontSize:ms(44)},
  emptyTitle:{fontSize:rf(18),fontWeight:'800',color:'#0F172A'},
  emptySub:{fontSize:rf(13),color:'#94A3B8'},

  hero:{margin:s(16),marginBottom:vs(10),backgroundColor:'#2563EB',borderRadius:ms(24),padding:s(22),overflow:'hidden',position:'relative'},
  hc1:{position:'absolute',width:s(200),height:s(200),borderRadius:s(100),backgroundColor:'#ffffff10',right:-s(50),top:-s(60)},
  hc2:{position:'absolute',width:s(120),height:s(120),borderRadius:s(60),backgroundColor:'#ffffff08',left:-s(20),bottom:-s(30)},
  heroLabel:{fontSize:rf(10),color:'#93C5FD',fontWeight:'700',letterSpacing:1.2,marginBottom:vs(4)},
  heroTitle:{fontSize:ms(20),fontWeight:'900',color:'#FFFFFF',marginBottom:vs(16)},
  heroRow:{flexDirection:'row',backgroundColor:'#1D4ED8',borderRadius:ms(16),paddingVertical:vs(12)},
  hStat:{flex:1,alignItems:'center'},
  hStatV:{fontSize:ms(18),fontWeight:'900',color:'#FFFFFF'},
  hStatL:{fontSize:rf(9),color:'#93C5FD',fontWeight:'600',textTransform:'uppercase',marginTop:vs(2)},
  hDiv:{width:1,backgroundColor:'#3B82F6',marginVertical:vs(4)},

  tabWrap:{paddingHorizontal:s(16),paddingVertical:vs(10)},
  tabBar:{flexDirection:'row',backgroundColor:'#E2E8F0',borderRadius:ms(14),padding:vs(3)},
  tab:{flex:1,paddingVertical:vs(10),alignItems:'center',borderRadius:ms(11)},
  tabActive:{backgroundColor:'#FFFFFF',shadowColor:'#000',shadowOpacity:0.08,shadowRadius:4,elevation:2},
  tabTxt:{fontSize:rf(12),fontWeight:'600',color:'#64748B'},
  tabTxtActive:{color:'#2563EB',fontWeight:'800'},

  card:{backgroundColor:'#FFFFFF',marginHorizontal:s(16),marginBottom:vs(12),padding:s(18),borderRadius:ms(20),
    borderWidth:1,borderColor:'#EEF2FF',shadowColor:'#1E3A8A',shadowOpacity:0.06,shadowOffset:{width:0,height:vs(3)},shadowRadius:10,elevation:3},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:vs(14)},
  cardTitle:{fontSize:rf(16),fontWeight:'800',color:'#0F172A'},
  cardSub:{fontSize:rf(12),color:'#94A3B8'},

  tHead:{flexDirection:'row',alignItems:'center',paddingVertical:vs(8),paddingHorizontal:s(2),backgroundColor:'#F8FAFC',borderRadius:ms(10),marginBottom:vs(4)},
  th:{fontSize:rf(10),fontWeight:'700',color:'#94A3B8',textTransform:'uppercase'},
  thC:{width:s(28),textAlign:'center',fontSize:rf(10),fontWeight:'700',color:'#94A3B8'},
  tRow:{flexDirection:'row',alignItems:'center',paddingVertical:vs(9),paddingHorizontal:s(2),borderRadius:ms(10)},
  tRowTop:{backgroundColor:'#FFFBEB'},
  rPill:{width:s(24),height:s(24),borderRadius:s(12),backgroundColor:'#F1F5F9',alignItems:'center',justifyContent:'center',marginRight:s(6)},
  rPillTxt:{fontSize:rf(10),fontWeight:'800',color:'#64748B'},
  tTeamCell:{flex:1,flexDirection:'row',alignItems:'center',gap:s(7)},
  tTeamName:{flex:1,fontSize:rf(13),fontWeight:'700',color:'#0F172A'},
  td:{width:s(28),textAlign:'center',fontSize:rf(12),color:'#475569',fontWeight:'600'},
  pts:{color:'#2563EB',fontWeight:'900',fontSize:rf(13)},
  av:{backgroundColor:'#EEF2FF',alignItems:'center',justifyContent:'center'},
  avTxt:{fontWeight:'900',color:'#2563EB'},

  goldenCard:{marginHorizontal:s(16),marginBottom:vs(12),backgroundColor:'#FFFBEB',borderRadius:ms(20),padding:s(18),
    flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1.5,borderColor:'#FDE68A',
    shadowColor:'#F59E0B',shadowOpacity:0.15,shadowRadius:8,elevation:3},
  goldenLeft:{flexDirection:'row',alignItems:'center',gap:s(12)},
  goldenIcon:{fontSize:ms(36)},
  goldenLabel:{fontSize:rf(10),color:'#D97706',fontWeight:'700',letterSpacing:0.8},
  goldenName:{fontSize:rf(18),fontWeight:'900',color:'#0F172A'},
  goldenTeam:{fontSize:rf(12),color:'#64748B'},
  goldenNum:{fontSize:ms(38),fontWeight:'900',color:'#F59E0B',textAlign:'right'},
  goldenGoalLbl:{fontSize:rf(11),color:'#D97706',fontWeight:'600',textAlign:'right'},

  rankRow:{flexDirection:'row',alignItems:'center',paddingVertical:vs(10),borderBottomWidth:1,borderBottomColor:'#F1F5F9',gap:s(10)},
  rankBadge:{width:s(28),height:s(28),borderRadius:s(14),backgroundColor:'#F1F5F9',alignItems:'center',justifyContent:'center'},
  rankBadgeTxt:{fontSize:rf(11),fontWeight:'800',color:'#64748B'},
  rankInfo:{flex:1},
  rankName:{fontSize:rf(14),fontWeight:'700',color:'#0F172A'},
  rankTeam:{fontSize:rf(11),color:'#94A3B8',marginTop:vs(1)},
  rankRight:{alignItems:'center'},
  rankVal:{fontSize:ms(20),fontWeight:'900',color:'#2563EB'},
  rankUnit:{fontSize:rf(9),color:'#94A3B8',fontWeight:'600',textTransform:'uppercase'},

  oGrid:{flexDirection:'row',flexWrap:'wrap',gap:s(10),marginTop:vs(12)},
  oBox:{width:'30%',flexGrow:1,backgroundColor:'#F8FAFC',borderRadius:ms(14),padding:s(12),alignItems:'center',borderWidth:1,borderColor:'#EEF2FF'},
  oIcon:{fontSize:ms(22),marginBottom:vs(4)},
  oVal:{fontSize:ms(22),fontWeight:'900',color:'#0F172A'},
  oLbl:{fontSize:rf(9),color:'#94A3B8',fontWeight:'600',textTransform:'uppercase',textAlign:'center',marginTop:vs(2)},

  hlRow:{flexDirection:'row',alignItems:'center',paddingVertical:vs(12),borderBottomWidth:1,borderBottomColor:'#F1F5F9',gap:s(12)},
  hlIcon:{fontSize:ms(22)},
  hlInfo:{flex:1},
  hlLabel:{fontSize:rf(10),color:'#94A3B8',fontWeight:'600',textTransform:'uppercase',letterSpacing:0.5},
  hlTeam:{fontSize:rf(15),fontWeight:'800',color:'#0F172A',marginTop:vs(2)},
  hlVal:{fontSize:ms(22),fontWeight:'900',color:'#2563EB',textAlign:'right'},
  hlUnit:{fontSize:rf(9),color:'#94A3B8',fontWeight:'600',textAlign:'right'},

  recentRow:{flexDirection:'row',alignItems:'center',paddingVertical:vs(10),borderBottomWidth:1,borderBottomColor:'#F1F5F9'},
  recentTeam:{flex:1,fontSize:rf(13),fontWeight:'700',color:'#0F172A'},
  recentScore:{paddingHorizontal:s(12),fontSize:rf(15),fontWeight:'900',color:'#0F172A'},

  emptyBox:{alignItems:'center',paddingVertical:vs(24)},
  emptyTxt:{color:'#94A3B8',fontSize:rf(13)},
});
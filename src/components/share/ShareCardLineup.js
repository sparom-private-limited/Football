import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Pitch from '../lineup/Pitch';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function ShareCardLineup({
  formation,
  lineup,
  bench,
  teamName,
  teamLogoUrl,
}) {
  const startingXI = Object.values(lineup).filter(Boolean);
  const initial = teamName ? teamName.substring(0, 2).toUpperCase() : '??';

  return (
    <View style={styles.outerWrap}>
      {/* Card with bottom fade */}
      <View style={styles.card}>

        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Purple gradient team badge */}
            <View style={styles.badgeOuter}>
              {teamLogoUrl ? (
                <Image
                  source={{uri: teamLogoUrl}}
                  style={styles.badgeImg}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#A855F7', '#7C3AED']}
                  style={styles.badgeGradient}>
                  <Text style={styles.badgeInitial}>{initial}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.teamNameText}>{teamName || 'My Team'}</Text>
              <Text style={styles.lineupText}>Lineup</Text>
            </View>
          </View>

          {/* Orange-yellow gradient formation pill */}
          <LinearGradient
            colors={['#F472B6', '#A855F7']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.formationPill}>
            <Text style={styles.formationNum}>{formation}</Text>
          </LinearGradient>
        </View>

        {/* ─── SUBTITLE ROW ─── */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>Matchday starting XI</Text>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.posterBadge}>
            <Text style={styles.posterBadgeText}>
              {startingXI.length}/11 Players
            </Text>
          </LinearGradient>
        </View>

        {/* ─── PITCH ─── */}
        <View style={styles.pitchWrap}>
          <Pitch formation={formation} lineup={lineup} readOnly />

          {/* Bottom fade overlay: green → white */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', '#FFFFFF']}
            style={styles.pitchFade}
            pointerEvents="none"
          />
        </View>

        {/* ─── FOOTER ─── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTeamName}>
              {teamName ? `${teamName} XI` : 'Starting XI'}
            </Text>
            <Text style={styles.footerDesc}>
              {formation} · {startingXI.length} players
            </Text>
          </View>
          <LinearGradient
            colors={['#A855F7', '#EC4899']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.brandPill}>
            <Text style={styles.brandText}>FTBL-XI</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Outer background — light purple tint */
  outerWrap: {
    width: 380,
    padding: 8,
    backgroundColor: '#FAF5FF',
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },

  /* ═══════ HEADER ═══════ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Team badge — purple gradient circle */
  badgeOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#E9D5FF',
    marginRight: 12,
  },
  badgeImg: {
    width: '100%',
    height: '100%',
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Header text */
  headerTextWrap: {},
  teamNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 1,
  },
  lineupText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 36,
  },

  /* Formation pill — pink to purple gradient */
  formationPill: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  formationNum: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* ═══════ SUBTITLE ═══════ */
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  posterBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  posterBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ═══════ PITCH ═══════ */
  pitchWrap: {
    marginHorizontal: 6,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  /* Fade from pitch green → white at the bottom */
  pitchFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  /* ═══════ FOOTER ═══════ */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  footerLeft: {},
  footerTeamName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  footerDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },

  /* FTBL-XI gradient pill */
  brandPill: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
import {useRef, useCallback} from 'react';
import {Platform, Alert} from 'react-native';
import Share from 'react-native-share';

/**
 * useShareCard
 *
 * Returns refs and share functions for multiple share card types.
 * Attach each ref to a <ViewShot> wrapping the corresponding share card component.
 *
 * Usage:
 * ──────────────────────────────────────────────
 *   const { scoreRef, statsRef, summaryRef, shareScore, shareStats, shareSummary } = useShareCard();
 *
 *   // Hidden off-screen (rendered but not visible)
 *   <View style={{ position: 'absolute', left: -9999 }}>
 *     <ViewShot ref={scoreRef} options={{ format: 'png', quality: 1 }}>
 *       <ShareCardScoreCard match={match} />
 *     </ViewShot>
 *     <ViewShot ref={statsRef} options={{ format: 'png', quality: 1 }}>
 *       <ShareCardStats match={match} stats={stats} />
 *     </ViewShot>
 *     <ViewShot ref={summaryRef} options={{ format: 'png', quality: 1 }}>
 *       <ShareCardSummary match={match} stats={stats} />
 *     </ViewShot>
 *   </View>
 *
 *   // Trigger from buttons
 *   <Button onPress={shareScore} title="Share Score" />
 *   <Button onPress={shareStats} title="Share Stats" />
 *   <Button onPress={shareSummary} title="Share Summary" />
 * ──────────────────────────────────────────────
 */
export default function useShareCard() {
  const scoreRef = useRef(null);
  const statsRef = useRef(null);
  const summaryRef = useRef(null);

  /**
   * Internal: capture a ViewShot ref and open share sheet
   */
  const captureAndShare = useCallback(async (ref, title) => {
    try {
      if (!ref.current?.capture) {
        Alert.alert('Error', 'Share card is not ready. Please try again.');
        return;
      }

      // Capture ViewShot → local PNG temp file
      const uri = await ref.current.capture({
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Ensure proper file:// prefix on Android
      const fileUri =
        Platform.OS === 'android'
          ? uri.startsWith('file://') ? uri : `file://${uri}`
          : uri;

      // Open native share sheet
      await Share.open({
        title,
        message: title,
        url: fileUri,
        type: 'image/png',
        failOnCancel: false,
      });
    } catch (err) {
      // User tapped cancel — not an error
      if (
        err?.message?.includes?.('cancel') ||
        err?.message?.includes?.('dismiss')
      ) {
        return;
      }

      console.error('❌ Share failed:', err);
      Alert.alert('Share Failed', 'Could not share the image. Please try again.');
    }
  }, []);

  const shareScore = useCallback(
    () => captureAndShare(scoreRef, '⚽ Match Result — FTBL-XI'),
    [captureAndShare],
  );

  const shareStats = useCallback(
    () => captureAndShare(statsRef, '📊 Match Stats — FTBL-XI'),
    [captureAndShare],
  );

  const shareSummary = useCallback(
    () => captureAndShare(summaryRef, '📋 Match Summary — FTBL-XI'),
    [captureAndShare],
  );

  return {
    scoreRef,
    statsRef,
    summaryRef,
    shareScore,
    shareStats,
    shareSummary,
  };
}
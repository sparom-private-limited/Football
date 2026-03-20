import React, {useRef} from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import Video from 'react-native-video';

export default function SplashScreen({user, authLoading, onDone}) {
  const hasCalledDone = useRef(false);

  const handleDone = () => {
    if (hasCalledDone.current) return;
    // ✅ Wait for auth check to finish before dismissing
    if (authLoading) return;
    hasCalledDone.current = true;
    onDone();
  };

  // ✅ Watch auth loading — if video already ended but auth was still loading
  React.useEffect(() => {
    if (!authLoading && hasCalledDone.current === false) {
      // Auth finished — if video has already ended, handleDone was blocked
      // We need to check if video ended — use a separate ref for that
    }
  }, [authLoading]);

  const videoEndedRef = useRef(false);

  const handleVideoEnd = () => {
    videoEndedRef.current = true;
    if (!authLoading) {
      handleDone();
    }
    // If auth still loading, the useEffect below will handle it
  };

  // ✅ If auth finishes AFTER video ends
  React.useEffect(() => {
    if (!authLoading && videoEndedRef.current) {
      handleDone();
    }
  }, [authLoading]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        source={require('../assets/video.mov')}
        style={styles.video}
        resizeMode="cover"
        onEnd={handleVideoEnd}
        repeat={false}
        muted={false}
        controls={false}
        onError={e => {
          console.error('Splash video error:', e);
          onDone(); // ✅ If video fails, skip splash
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
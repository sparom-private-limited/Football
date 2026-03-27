import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';



const KEYS = {
  player:    'onboarding_player_done',
  team:      'onboarding_team_done',
  organiser: 'onboarding_organiser_done',
};

export function useOnboarding(flow) {
  const [showGuide, setShowGuide] = useState(false);
  const [checked,   setChecked]   = useState(false);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(KEYS[flow]);
      if (!done) setShowGuide(true);
      setChecked(true);
    })();
  }, [flow]);

  const finishGuide = async () => {
    await AsyncStorage.setItem(KEYS[flow], 'true');
    setShowGuide(false);
  };

  // ✅ Reset guide (call this from settings to replay)
  const resetGuide = async () => {
    await AsyncStorage.removeItem(KEYS[flow]);
    setShowGuide(true);
  };

  return {showGuide: checked && showGuide, finishGuide, resetGuide};
}
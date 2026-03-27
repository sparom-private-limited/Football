import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  player:    'copilot_player_done',
  team:      'copilot_team_done',
  organiser: 'copilot_organiser_done',
};

export function useFirstLaunch(flow) {
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [checked,       setChecked]       = useState(false);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(KEYS[flow]);
      if (!done) setIsFirstLaunch(true);
      setChecked(true);
    })();
  }, [flow]);

  const markDone = async () => {
    await AsyncStorage.setItem(KEYS[flow], 'true');
    setIsFirstLaunch(false);
  };

  // Call this to reset and show guide again
  const reset = async () => {
    await AsyncStorage.removeItem(KEYS[flow]);
    setIsFirstLaunch(true);
  };

  return {isFirstLaunch: checked && isFirstLaunch, markDone, reset};
}
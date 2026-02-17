import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useNavigationHelper from '../navigation/Navigationhelper';

const BackButtonHandler = () => {
const nav = useNavigationHelper();
  useEffect(() => {
    const backAction = () => {
      if (nav.raw.canGoBack()) {
        nav.back();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (exit app) when no history
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [nav]);

  return null;
};

export default BackButtonHandler;
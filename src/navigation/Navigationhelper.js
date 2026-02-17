import { useNavigation } from '@react-navigation/native';

export function useNavigationHelper() {
  const navigation = useNavigation();

  return {
    to: (screen, params) => {
      navigation.navigate(screen, params);
    },

    toMatch: (screen, params) => {
      navigation.navigate('MatchNavigator', {
        screen: screen,
        params: params,
      });
    },

    toTournament: (screen, params) => {
      navigation.navigate('TournamentNavigator', {
        screen: screen,
        params: params,
      });
    },

    // ✅ NEW - for profile navigation
    toProfile: (screen, params) => {
      navigation.navigate('ProfileNavigator', {
        screen: screen,
        params: params,
      });
    },

    back: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },

    replace: (screen, params) => {
      navigation.replace(screen, params);
    },

    reset: (screen, params) => {
      navigation.reset({
        index: 0,
        routes: [{ name: screen, params }],
      });
    },

    popToTop: () => {
      navigation.popToTop();
    },

    canGoBack: () => navigation.canGoBack(),

    raw: navigation,
  };
}

export default useNavigationHelper;
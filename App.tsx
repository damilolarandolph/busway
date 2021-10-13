import React from 'react';
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_300Light,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';

import AppLoading from 'expo-app-loading';
import Index from './src/index';

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_300Light,
    OpenSans_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return <Index />;
};

export default App;

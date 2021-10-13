import React from 'react';
import { ThemeProvider } from 'styled-components';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  downloadAsync,
} from 'expo-file-system';

import Realm from 'realm';
import { Asset } from 'expo-asset';
import context, { AppContext } from './context/app';
import theme from './theme';
import CurrentLocation from './screens/CurrentLocation';
import SelectDestination from './screens/SelectDestination';

const Stack = createStackNavigator();

(async () => {
  if (!(await getInfoAsync(documentDirectory! + 'realm')).exists) {
    // if folder does not exist, create it
    await makeDirectoryAsync(documentDirectory! + 'realm');
  }

  console.log(documentDirectory + 'realm/db.realm');
  await downloadAsync(
    // grab database from asset folder
    Asset.fromModule(require('../assets/db.realm')).uri,
    // move to new folder for application to work with it
    documentDirectory + 'realm/db.realm',
  );
  console.log(documentDirectory + 'realm/db.realm');
  const realm = new Realm(documentDirectory! + 'realm/db.realm');
})();

const Index: React.FC = () => {
  const [state, setState] = React.useState<AppContext>({
    currentTrip: { trip: { source: null, stops: [] } },
  });

  const value = {
    state,
    setState(slice: AppContext) {
      console.log(slice);
      setState(slice);
    },
  };
  return (
    <ThemeProvider theme={theme}>
      <context.Provider value={value}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CurrentLocation" component={CurrentLocation} />
            <Stack.Screen
              name="SelectDestination"
              component={SelectDestination}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </context.Provider>
    </ThemeProvider>
  );
};

export default Index;

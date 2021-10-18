import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import context, { AppContext } from './context/app';
import theme from './theme';
import CurrentLocation from './screens/CurrentLocation';
import SelectDestination from './screens/SelectDestination';
import { NativeBaseProvider } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const Index: React.FC = () => {
  const [state, setState] = React.useState<AppContext>({
    currentTrip: null,
    onTrip: false,
  });

  const value = {
    state,
    async setState(slice: AppContext) {
      setState(slice);
      await AsyncStorage.setItem('hydrated', JSON.stringify(slice));
    },
  };

  const hydrate = async () => {
    const val = await AsyncStorage.getItem('hydated');
    if (val) {
      const parsed = JSON.parse(val);
      setState(parsed);
    }
  };
  useEffect(() => {
    hydrate();
  }, []);
  return (
    <NativeBaseProvider>
      <ThemeProvider theme={theme}>
        <context.Provider value={value}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="CurrentLocation"
                component={CurrentLocation}
              />
              <Stack.Screen
                name="SelectDestination"
                component={SelectDestination}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </context.Provider>
      </ThemeProvider>
    </NativeBaseProvider>
  );
};

export default Index;

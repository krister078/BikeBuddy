import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RideScreen from '../screens/RideScreen';
import RideOverviewScreen from '../screens/RideOverviewScreen';

export type RootStackParamList = {
  Home: undefined;
  Ride: undefined;
  RideOverview: { distance: number; time: string; calories: number }; // Example params
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Bike Buddy Home' }} />
      <Stack.Screen name="Ride" component={RideScreen} options={{ title: 'Your Ride' }} />
      <Stack.Screen name="RideOverview" component={RideOverviewScreen} options={{ title: 'Ride Overview' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { useAuth } from '../contexts/AuthContext';
import RideScreen from '../screens/RideScreen';
import RideOverviewScreen from '../screens/RideOverviewScreen';
import AuthScreen from '../screens/AuthScreen';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Ride: undefined;
  RideOverview: { 
    distance: number; 
    time: string; 
    calories: number;
    routeCoordinates: Array<{latitude: number, longitude: number}>;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Bike Buddy Home' }} />
            <Stack.Screen name="Ride" component={RideScreen} options={{ title: 'Your Ride' }} />
            <Stack.Screen name="RideOverview" component={RideOverviewScreen} options={{ title: 'Ride Overview' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 
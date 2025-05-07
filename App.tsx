import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator, { RootStackParamList } from './navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <NavigationContainer<RootStackParamList>>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App; 
import React from 'react';
import AppNavigator, { RootStackParamList } from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App; 
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '1029884018461-pg0ca851lt08e97q8lh5nmllv1i7el28.apps.googleusercontent.com',
    iosClientId: '1029884018461-rh9m9lc5c6qh3cnkrpots2hrm19o8drs.apps.googleusercontent.com',
    webClientId: '1029884018461-rh9m9lc5c6qh3cnkrpots2hrm19o8drs.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    responseType: 'id_token',
    usePKCE: false
  });

  React.useEffect(() => {
    console.log('Auth Response:', response);
    if (response?.type === 'success') {
      console.log('Success response params:', response.params);
      const { id_token } = response.params;
      if (id_token) {
        console.log('ID token received, length:', id_token.length);
        handleGoogleSignIn(id_token);
      } else {
        console.log('No ID token in response');
        Alert.alert('Error', 'Failed to get ID token from Google');
      }
    } else if (response?.type === 'error') {
      console.log('Error response:', response.error);
      Alert.alert('Error', `Google Sign-In failed: ${response.error?.message || 'Unknown error'}`);
    } else if (response?.type === 'cancel') {
      console.log('User cancelled the sign in');
    }
  }, [response]);

  const handleGoogleSignIn = async (token: string) => {
    if (!token) {
      console.log('No token provided to handleGoogleSignIn');
      return;
    }
    try {
      console.log('Sending ID token to backend...');
      setLoading(true);
      await signInWithGoogle(token);
      console.log('Successfully signed in with Google');
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      console.log('Starting Google sign in...');
      if (!request) {
        console.log('No request available');
        return;
      }
      
      const result = await promptAsync();
      console.log('Prompt result:', result);
      
      if (result?.type === 'success') {
        console.log('Success response:', result);
        const { id_token } = result.params;
        if (id_token) {
          console.log('ID token received, length:', id_token.length);
          handleGoogleSignIn(id_token);
        } else {
          console.log('No ID token in response');
          Alert.alert('Error', 'Failed to get ID token from Google');
        }
      } else if (result?.type === 'error') {
        console.log('Error response:', result.error);
        Alert.alert('Error', `Google Sign-In failed: ${result.error?.message || 'Unknown error'}`);
      } else if (result?.type === 'cancel') {
        console.log('User cancelled the sign in');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to start Google sign in. Please try again.');
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bike Buddy</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGooglePress}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#2c3e50',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3498db',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#3498db',
    fontSize: 14,
  },
});

export default AuthScreen; 
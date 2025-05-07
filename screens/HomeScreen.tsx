import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path as needed

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleStartRidePress = () => {
    navigation.navigate('Ride');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bike Buddy</Text>
      <Text style={styles.subtitle}>Ready for your next adventure?</Text>
      <View style={styles.buttonContainer}>
        <Button title="Start Ride" onPress={handleStartRidePress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff', // Light Alice Blue background
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50', // Darker blue for title
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#34495e', // Slightly lighter blue for subtitle
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    borderRadius: 25, // Rounded button container
    overflow: 'hidden', // Ensures Button respects borderRadius
  },
});

export default HomeScreen; 
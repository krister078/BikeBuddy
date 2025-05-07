import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RideOverviewScreenProps = NativeStackScreenProps<RootStackParamList, 'RideOverview'>;

const RideOverviewScreen: React.FC<RideOverviewScreenProps> = ({ route, navigation }) => {
  const { distance, time, calories } = route.params;

  const handleGoToHome = () => {
    navigation.navigate('Ride'); // Or pop to root
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Overview</Text>
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Distance: {distance.toFixed(2)} km</Text>
        <Text style={styles.statText}>Time: {time}</Text>
        <Text style={styles.statText}>Calories Burned: {calories}</Text>
      </View>
      <Button title="Done" onPress={handleGoToHome} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statsContainer: {
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  statText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default RideOverviewScreen; 
import React from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MapView, { PROVIDER_GOOGLE, Polyline, Region } from 'react-native-maps';

type RideOverviewScreenProps = NativeStackScreenProps<RootStackParamList, 'RideOverview'>;

const RideOverviewScreen: React.FC<RideOverviewScreenProps> = ({ route, navigation }) => {
  const { distance, time, calories, routeCoordinates } = route.params;

  const handleGoToHome = () => {
    navigation.navigate('Ride');
  };

  // Calculate the region to show the entire route
  const getRouteRegion = (): Region => {
    if (routeCoordinates.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const latitudes = routeCoordinates.map(coord => coord.latitude);
    const longitudes = routeCoordinates.map(coord => coord.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01), // Ensure minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Overview</Text>
      
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={getRouteRegion()}
        >
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#0000FF"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mapContainer: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
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
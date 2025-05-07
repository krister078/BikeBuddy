import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/AppNavigator';

type RideScreenProps = NativeStackScreenProps<RootStackParamList, 'Ride'>;

const RideScreen: React.FC<RideScreenProps> = ({ navigation }) => {
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isRideActive, setIsRideActive] = useState(false);
  const [isFetchingInitialLocation, setIsFetchingInitialLocation] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const requestPermissionsAndGetLocation = async () => {
      setLocationPermissionStatus(null);
      setIsFetchingInitialLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Bike Buddy needs location access to track your ride. Please enable it in settings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setIsFetchingInitialLocation(false);
        return;
      }
      
      console.log('Location permission granted. Fetching initial location...');
      try {
        const location = await Location.getCurrentPositionAsync({});
        console.log('Initial location fetched:', JSON.stringify(location, null, 2));
        setCurrentLocation(location);
        centerMapOnLocation(location);
      } catch (error) {
        console.error('Error fetching initial location:', error);
        Alert.alert('Location Error', 'Could not fetch initial location.');
      }
      setIsFetchingInitialLocation(false);
    };

    requestPermissionsAndGetLocation();

    return () => {
      locationSubscription.current?.remove();
    };
  }, [navigation]);

  useEffect(() => {
    if (isRideActive && locationPermissionStatus === 'granted') {
      const startLocationUpdates = async () => {
        console.log('Starting location updates for active ride...');
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (location) => {
            console.log('Watched location update:', JSON.stringify(location, null, 2));
            setCurrentLocation(location);
            centerMapOnLocation(location); 
          }
        );
      };
      startLocationUpdates();
    } else {
      locationSubscription.current?.remove();
      if (isRideActive) console.log('Stopped location updates (ride active but no permission or other issue).');
    }
    return () => {
      console.log('Cleaning up location subscription.');
      locationSubscription.current?.remove();
    };
  }, [isRideActive, locationPermissionStatus]);

  const centerMapOnLocation = (location: Location.LocationObject | null) => {
    if (location && mapRef.current) {
      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, 
        longitudeDelta: 0.005,
      };
      console.log('Animating map to region:', JSON.stringify(region, null, 2));
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleStartRide = () => {
    if (locationPermissionStatus !== 'granted') {
      Alert.alert('Location Permission', 'Please grant location permission to start a ride.');
      return;
    }
    console.log('Ride started button pressed.');
    setIsRideActive(true);
  };

  const handleStopRide = () => {
    console.log('Ride stopped button pressed.');
    setIsRideActive(false);
    navigation.navigate('RideOverview', {
      distance: 0,
      time: '00:00:00',
      calories: 0,
    });
  };

  if (locationPermissionStatus === null) {
    return <View style={styles.container}><Text>Requesting location permission...</Text></View>;
  }
  if (isFetchingInitialLocation && locationPermissionStatus === 'granted') {
    return <View style={styles.container}><Text>Fetching your location...</Text></View>;
  }
  if (locationPermissionStatus !== 'granted') {
    return <View style={styles.container}><Text>Location permission denied. Please enable in settings.</Text></View>;
  }

  const initialMapRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={!currentLocation ? initialMapRegion : undefined}
        showsUserLocation={isRideActive}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="You are here"
            pinColor="blue"
          />
        )}
      </MapView>
      
      <View style={styles.statsContainer}>
        <Text>Distance: 0 km</Text>
        <Text>Time: 00:00:00</Text>
        <Text>Calories: 0</Text>
      </View>

      {!isRideActive ? (
        <Button title="Start Ride" onPress={handleStartRide} />
      ) : (
        <Button title="Stop Ride" onPress={handleStopRide} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  statsContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: '100%',
  },
});

export default RideScreen; 
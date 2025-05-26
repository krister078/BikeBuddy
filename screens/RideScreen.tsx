import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { PROVIDER_GOOGLE, Marker, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/AppNavigator';

type RideScreenProps = NativeStackScreenProps<RootStackParamList, 'Ride'>;

const RideScreen: React.FC<RideScreenProps> = ({ navigation }) => {
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isRideActive, setIsRideActive] = useState(false);
  const [isFetchingInitialLocation, setIsFetchingInitialLocation] = useState(false);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter out unrealistic speed changes
  const isValidLocationUpdate = (newLocation: Location.LocationObject, lastLocation: Location.LocationObject | null): boolean => {
    if (!lastLocation) return true;

    const timeDiff = (newLocation.timestamp - lastLocation.timestamp) / 1000; // in seconds
    const distance = calculateDistance(
      lastLocation.coords.latitude,
      lastLocation.coords.longitude,
      newLocation.coords.latitude,
      newLocation.coords.longitude
    );
    
    // Calculate speed in km/h
    const speed = (distance / timeDiff) * 3600;
    
    // Filter out updates that would require speeds over 30 km/h
    // Note: We don't need to check minimum distance here since we're already
    // filtering that with distanceInterval in watchPositionAsync
    return speed <= 30;
  };

  // Calculate calories burned based on distance and time
  const calculateCalories = (distance: number, timeInHours: number): number => {
    if (timeInHours === 0) return 0;
    
    // Calculate average speed in km/h
    const speed = distance / timeInHours;
    
    // Base MET (Metabolic Equivalent of Task) values for cycling:
    // - Light effort (10-12 km/h): 4.0 MET
    // - Moderate effort (12-16 km/h): 6.0 MET
    // - Vigorous effort (16-20 km/h): 8.0 MET
    // - Very vigorous effort (>20 km/h): 10.0 MET
    
    let metValue = 4.0; // Default to light effort
    if (speed > 20) metValue = 10.0;
    else if (speed > 16) metValue = 8.0;
    else if (speed > 12) metValue = 6.0;
    
    // Formula: Calories = MET * time
    // This gives us a relative calorie burn rate based on intensity
    const calories = metValue * timeInHours * 60; // Multiply by 60 to get per-minute rate
    
    return Math.round(calories);
  };

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toISOString().substr(11, 8);
  };

  useEffect(() => {
    if (isRideActive && startTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = new Date(now.getTime() - startTime.getTime());
        setElapsedTime(formatTime(elapsed));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRideActive, startTime]);

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
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Increased from 3000 to 5000
            distanceInterval: 10, // Increased from 5 to 10 meters
          },
          (location) => {
            console.log('Watched location update:', JSON.stringify(location, null, 2));
            
            // Only process location if it's valid
            if (isValidLocationUpdate(location, lastLocation)) {
              setCurrentLocation(location);
              centerMapOnLocation(location);

              // Add new coordinate to route
              setRouteCoordinates(prevCoordinates => [
                ...prevCoordinates,
                {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                }
              ]);

              // Calculate distance if we have a previous location
              if (lastLocation) {
                const newDistance = calculateDistance(
                  lastLocation.coords.latitude,
                  lastLocation.coords.longitude,
                  location.coords.latitude,
                  location.coords.longitude
                );
                setDistance(prevDistance => prevDistance + newDistance);
              }
              setLastLocation(location);
            }
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
    setStartTime(new Date());
    setDistance(0);
    setRouteCoordinates([]); // Clear previous route
    setLastLocation(currentLocation);
  };

  const handleStopRide = () => {
    console.log('Ride stopped button pressed.');
    setIsRideActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Calculate final calories
    const timeInHours = startTime ? (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60) : 0;
    const calories = calculateCalories(distance, timeInHours);

    navigation.navigate('RideOverview', {
      distance,
      time: elapsedTime,
      calories,
      routeCoordinates, // Pass route coordinates to overview screen
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
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={3}
          />
        )}
      </MapView>
      
      <View style={styles.statsContainer}>
        <Text>Distance: {distance.toFixed(2)} km</Text>
        <Text>Time: {elapsedTime}</Text>
        <Text>Calories: {calculateCalories(distance, startTime ? (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60) : 0)}</Text>
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
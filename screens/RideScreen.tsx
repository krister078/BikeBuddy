import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const RideScreen: React.FC = () => {
  const { user } = useAuth();
  const { startRide, stopRide, currentRide, isRiding } = useRide();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startLocationUpdates = async () => {
      if (locationPermissionStatus === 'granted') {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
            if (isRiding) {
              setRouteCoordinates(prev => [...prev, {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
              }]);
            }
          }
        );
      }
    };

    startLocationUpdates();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [locationPermissionStatus, isRiding]);

  const handleStartRide = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    try {
      await startRide();
      setRouteCoordinates([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to start ride');
    }
  };

  const handleStopRide = async () => {
    try {
      await stopRide();
      setRouteCoordinates([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop ride');
    }
  };

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#000"
              strokeWidth={6}
            />
          )}
        </MapView>
      )}
      <View style={styles.buttonContainer}>
        {!isRiding ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartRide}
          >
            <Text style={styles.buttonText}>Start Ride</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopRide}
          >
            <Text style={styles.buttonText}>Stop Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
}); 
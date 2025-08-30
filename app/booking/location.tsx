import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MapView, Marker } from 'expo-maps';
import { MapPin, Navigation, ArrowRight, CreditCard as Edit3 } from 'lucide-react-native';
import { Location as LocationType } from '@/types';
import { apiGet } from '@/services/apiClient';

export default function LocationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const isMounted = useRef(true);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [startLocationQuery, setStartLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationType[]>([]);
  const [startLocationSuggestions, setStartLocationSuggestions] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingStartLocation, setEditingStartLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (destinationQuery.length > 2) {
      searchLocations(destinationQuery, 'destination');
    } else {
      setLocationSuggestions([]);
    }
  }, [destinationQuery]);

  useEffect(() => {
    if (startLocationQuery.length > 2 && editingStartLocation) {
      searchLocations(startLocationQuery, 'start');
    } else {
      setStartLocationSuggestions([]);
    }
  }, [startLocationQuery, editingStartLocation]);

  useEffect(() => {
    // Update map region when locations change
    if (currentLocation && destination) {
      const minLat = Math.min(currentLocation.latitude, destination.latitude);
      const maxLat = Math.max(currentLocation.latitude, destination.latitude);
      const minLng = Math.min(currentLocation.longitude, destination.longitude);
      const maxLng = Math.max(currentLocation.longitude, destination.longitude);

      const newRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.abs(maxLat - minLat) * 1.5 || 0.01,
        longitudeDelta: Math.abs(maxLng - minLng) * 1.5 || 0.01,
      };

      setMapRegion(newRegion);
      
      if (mapRef.current && Platform.OS !== 'web') {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } else if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
    }
  }, [currentLocation, destination]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        // Use default Bangalore location
        const defaultLocation: LocationType = {
          id: 'default',
          name: 'Bangalore',
          address: 'Bangalore, Karnataka, India',
          latitude: 12.9716,
          longitude: 77.5946,
        };
        setCurrentLocation(defaultLocation);
        setStartLocationQuery(defaultLocation.name);
        setLoading(false);
        return;
      }

      if (!isMounted.current) {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const currentLoc: LocationType = {
        id: 'current',
        name: 'Current Location',
        address: 'Your current location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      if (isMounted.current) {
        setCurrentLocation(currentLoc);
        setStartLocationQuery('Current Location');
      }
      
      // Try to get address from coordinates
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
          const locationName = address.name || address.street || 'Current Location';
          
          currentLoc.address = fullAddress;
          currentLoc.name = locationName;
          
          if (isMounted.current) {
            setCurrentLocation({ ...currentLoc });
            setStartLocationQuery(locationName);
          }
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Using default location.');
      // Use default Bangalore location
      const defaultLocation: LocationType = {
        id: 'default',
        name: 'Bangalore',
        address: 'Bangalore, Karnataka, India',
        latitude: 12.9716,
        longitude: 77.5946,
      };
      setCurrentLocation(defaultLocation);
      setStartLocationQuery(defaultLocation.name);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const searchLocations = async (query: string, type: 'start' | 'destination') => {
    setSearchLoading(true);
    try {
      // Use the specified API endpoint for location search
      try {
        const response = await apiGet(`/api/locations/search?query=${encodeURIComponent(query)}`);
        if (isMounted.current) {
          if (type === 'destination') {
            setLocationSuggestions(response.data);
          } else {
            setStartLocationSuggestions(response.data);
          }
        }
      } catch (error) {
        console.log('Location search API failed, using mock data for demo');
        // Enhanced mock location suggestions for demo
        const mockLocations: LocationType[] = [
          {
            id: '1',
            name: 'Bangalore Airport',
            address: 'Kempegowda International Airport, Bangalore',
            latitude: 13.1986,
            longitude: 77.7066,
          },
          {
            id: '2',
            name: 'MG Road',
            address: 'Mahatma Gandhi Road, Bangalore',
            latitude: 12.9716,
            longitude: 77.5946,
          },
          {
            id: '3',
            name: 'Koramangala',
            address: 'Koramangala, Bangalore',
            latitude: 12.9279,
            longitude: 77.6271,
          },
          {
            id: '4',
            name: 'Electronic City',
            address: 'Electronic City, Bangalore',
            latitude: 12.8456,
            longitude: 77.6603,
          },
          {
            id: '5',
            name: 'Whitefield',
            address: 'Whitefield, Bangalore',
            latitude: 12.9698,
            longitude: 77.7500,
          },
          {
            id: '6',
            name: 'Indiranagar',
            address: 'Indiranagar, Bangalore',
            latitude: 12.9719,
            longitude: 77.6412,
          },
          {
            id: '7',
            name: 'Jayanagar',
            address: 'Jayanagar, Bangalore',
            latitude: 12.9237,
            longitude: 77.5838,
          },
          {
            id: '8',
            name: 'HSR Layout',
            address: 'HSR Layout, Bangalore',
            latitude: 12.9082,
            longitude: 77.6476,
          },
          {
            id: '9',
            name: 'Chennai Central',
            address: 'Chennai Central Railway Station, Chennai',
            latitude: 13.0827,
            longitude: 80.2707,
          },
          {
            id: '10',
            name: 'Chennai Airport',
            address: 'Chennai International Airport, Chennai',
            latitude: 12.9941,
            longitude: 80.1709,
          },
          {
            id: '11',
            name: 'Chennai Marina Beach',
            address: 'Marina Beach, Chennai',
            latitude: 13.0475,
            longitude: 80.2824,
          },
          {
            id: '12',
            name: 'Chennai Express Avenue',
            address: 'Express Avenue Mall, Chennai',
            latitude: 13.0569,
            longitude: 80.2091,
          },
        ].filter(loc => 
          loc.name.toLowerCase().includes(query.toLowerCase()) ||
          loc.address.toLowerCase().includes(query.toLowerCase())
        );
        
        if (isMounted.current) {
          if (type === 'destination') {
            setLocationSuggestions(mockLocations);
          } else {
            setStartLocationSuggestions(mockLocations);
          }
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      if (isMounted.current) {
        setSearchLoading(false);
      }
    }
  };

  const selectDestination = (location: LocationType) => {
    setDestination(location);
    setDestinationQuery(location.name);
    setLocationSuggestions([]);
  };

  const selectStartLocation = (location: LocationType) => {
    setCurrentLocation(location);
    setStartLocationQuery(location.name);
    setStartLocationSuggestions([]);
    setEditingStartLocation(false);
  };

  const handleContinue = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    router.push({
      pathname: '/booking/vehicle-selection',
      params: {
        startLocation: JSON.stringify(currentLocation),
        endLocation: JSON.stringify(destination),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Book a Journey</Text>
          <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
        </View>
      </View>

      <View style={styles.locationInputs}>
        <View style={styles.inputContainer}>
          <MapPin size={20} color="#10B981" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={startLocationQuery}
            onChangeText={(text) => {
              setStartLocationQuery(text);
              setEditingStartLocation(true);
            }}
            placeholder="Pickup location"
            onFocus={() => setEditingStartLocation(true)}
          />
          <TouchableOpacity onPress={getCurrentLocation}>
            <Navigation size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setEditingStartLocation(!editingStartLocation)}
            style={styles.editButton}
          >
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <MapPin size={20} color="#EF4444" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={destinationQuery}
            onChangeText={setDestinationQuery}
            placeholder="Where to? (e.g., Chennai, Airport)"
          />
          {searchLoading && <ActivityIndicator size="small" color="#6B7280" />}
        </View>
      </View>

      {(locationSuggestions.length > 0 || startLocationSuggestions.length > 0) && (
        <ScrollView style={styles.suggestionsContainer}>
          {editingStartLocation && startLocationSuggestions.length > 0 && (
            <>
              <Text style={styles.suggestionHeader}>Pickup Locations</Text>
              {startLocationSuggestions.map((location) => (
                <TouchableOpacity
                  key={`start-${location.id}`}
                  style={styles.suggestionItem}
                  onPress={() => selectStartLocation(location)}
                >
                  <MapPin size={16} color="#10B981" />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionName}>{location.name}</Text>
                    <Text style={styles.suggestionAddress}>{location.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
          
          {!editingStartLocation && locationSuggestions.length > 0 && (
            <>
              <Text style={styles.suggestionHeader}>Destinations</Text>
              {locationSuggestions.map((location) => (
                <TouchableOpacity
                  key={`dest-${location.id}`}
                  style={styles.suggestionItem}
                  onPress={() => selectDestination(location)}
                >
                  <MapPin size={16} color="#EF4444" />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionName}>{location.name}</Text>
                    <Text style={styles.suggestionAddress}>{location.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.mapPlaceholder}>
            <MapPin size={48} color="#6B7280" />
            <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
            {currentLocation && destination && (
              <View style={styles.locationPreview}>
                <Text style={styles.previewText}>📍 From: {currentLocation.name}</Text>
                <Text style={styles.previewText}>🎯 To: {destination.name}</Text>
                <Text style={styles.previewDistance}>
                  Distance: ~{calculateDistance().toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onRegionChangeComplete={setMapRegion}
          >
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Pickup Location"
                description={currentLocation.address}
              />
            )}
            
            {destination && (
              <Marker
                coordinate={{
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                }}
                title="Destination"
                description={destination.address}
              />
            )}
          </MapView>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !destination && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!destination}
        >
          <Text style={styles.continueButtonText}>Select Vehicle</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  function calculateDistance(): number {
    if (!currentLocation || !destination) return 0;
    
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  locationInputs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    maxHeight: 250,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  locationPreview: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    marginVertical: 2,
  },
  previewDistance: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
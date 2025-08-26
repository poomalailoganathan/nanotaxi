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
import { MapPin, Navigation, ArrowRight } from 'lucide-react-native';
import { Location as LocationType } from '@/types';
import { apiGet } from '@/services/apiClient';

export default function LocationScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const isMounted = useRef(true);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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
      searchLocations(destinationQuery);
    } else {
      setLocationSuggestions([]);
    }
  }, [destinationQuery]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      if (!isMounted.current) {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLoc: LocationType = {
        id: 'current',
        name: 'Current Location',
        address: 'Your current location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      if (isMounted.current) {
        setCurrentLocation(currentLoc);
      }
      
      // Try to get address from coordinates
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          currentLoc.address = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
          currentLoc.name = address.name || 'Current Location';
          if (isMounted.current) {
            setCurrentLocation({ ...currentLoc });
          }
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const searchLocations = async (query: string) => {
    setSearchLoading(true);
    try {
      // Try API first, fallback to mock data
      try {
        const response = await apiGet(`/api/locations/search?query=${encodeURIComponent(query)}`);
        if (isMounted.current) {
          setLocationSuggestions(response.data);
        }
      } catch (error) {
        // Mock location suggestions for demo
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
        ].filter(loc => 
          loc.name.toLowerCase().includes(query.toLowerCase()) ||
          loc.address.toLowerCase().includes(query.toLowerCase())
        );
        if (isMounted.current) {
          setLocationSuggestions(mockLocations);
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

    // Animate map to show both locations
    if (currentLocation && mapRef.current && Platform.OS !== 'web') {
      const minLat = Math.min(currentLocation.latitude, location.latitude);
      const maxLat = Math.max(currentLocation.latitude, location.latitude);
      const minLng = Math.min(currentLocation.longitude, location.longitude);
      const maxLng = Math.max(currentLocation.longitude, location.longitude);

      mapRef.current.animateToRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.abs(maxLat - minLat) * 1.5 || 0.01,
        longitudeDelta: Math.abs(maxLng - minLng) * 1.5 || 0.01,
      });
    }
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
        <Text style={styles.headerTitle}>Book a Journey</Text>
        <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
      </View>

      <View style={styles.locationInputs}>
        <View style={styles.inputContainer}>
          <MapPin size={20} color="#10B981" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={currentLocation?.name || 'Loading...'}
            editable={false}
            placeholder="Current location"
          />
          <TouchableOpacity onPress={getCurrentLocation}>
            <Navigation size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <MapPin size={20} color="#EF4444" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={destinationQuery}
            onChangeText={setDestinationQuery}
            placeholder="Where to?"
          />
          {searchLoading && <ActivityIndicator size="small" color="#6B7280" />}
        </View>
      </View>

      {locationSuggestions.length > 0 && (
        <ScrollView style={styles.suggestionsContainer}>
          {locationSuggestions.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.suggestionItem}
              onPress={() => selectDestination(location)}
            >
              <MapPin size={16} color="#6B7280" />
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionName}>{location.name}</Text>
                <Text style={styles.suggestionAddress}>{location.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={48} color="#6B7280" />
          <Text style={styles.mapPlaceholderText}>Map Preview</Text>
          {currentLocation && destination && (
            <View style={styles.locationPreview}>
              <Text style={styles.previewText}>From: {currentLocation.name}</Text>
              <Text style={styles.previewText}>To: {destination.name}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !destination && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!destination}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  locationInputs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
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
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  locationPreview: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    marginVertical: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, MessageSquare, X, Star, User } from 'lucide-react-native';
import { useBooking } from '@/contexts/BookingContext';
import { apiGet, apiPost } from '@/services/apiClient';

// Conditionally import expo-maps only on native platforms
let MapView: any = View;
let Marker: any = View;

if (Platform.OS !== 'web') {
  try {
    const ExpoMaps = require('expo-maps');
    MapView = ExpoMaps.MapView;
    Marker = ExpoMaps.Marker;
  } catch (error) {
    console.log('expo-maps not available:', error);
  }
}

export default function TrackingScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentBooking, setCurrentBooking, rateBooking } = useBooking();
  const isMounted = useRef(true);
  const [driverLocation, setDriverLocation] = useState(currentBooking?.driver ? {
    latitude: currentBooking.driver.latitude,
    longitude: currentBooking.driver.longitude,
  } : null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    isMounted.current = true;
    
    if (!currentBooking) {
      router.replace('/(tabs)');
      return;
    }

    // Simulate driver movement
    const interval = setInterval(() => {
      if (currentBooking?.driver && driverLocation && isMounted.current) {
        // Move driver slightly towards pickup location
        const targetLat = currentBooking.startLocation.latitude;
        const targetLng = currentBooking.startLocation.longitude;
        
        setDriverLocation(prev => {
          if (!prev || !isMounted.current) return prev;
          
          const deltaLat = (targetLat - prev.latitude) * 0.1;
          const deltaLng = (targetLng - prev.longitude) * 0.1;
          
          return {
            latitude: prev.latitude + deltaLat,
            longitude: prev.longitude + deltaLng,
          };
        });
      }
    }, 3000);

    // Simulate ride completion after 30 seconds
    const completionTimer = setTimeout(() => {
      if (isMounted.current) {
        setShowRating(true);
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  }, [currentBooking, router]);

  const handleCall = () => {
    if (currentBooking?.driver) {
      Alert.alert(
        'Call Driver',
        `Call ${currentBooking.driver.name} at ${currentBooking.driver.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log('Calling driver...') },
        ]
      );
    }
  };

  const handleMessage = () => {
    Alert.alert('Message Driver', 'SMS feature will be available soon!');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', onPress: cancelRide, style: 'destructive' },
      ]
    );
  };

  const cancelRide = () => {
    if (isMounted.current) {
    setCurrentBooking(null);
    }
    router.replace('/(tabs)');
  };

  const submitRating = async () => {
    if (currentBooking) {
      try {
        await rateBooking(currentBooking.id, rating, feedback);
        Alert.alert(
          'Thank you!',
          'Your feedback has been submitted.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to submit feedback');
      }
    }
    if (isMounted.current) {
      setCurrentBooking(null);
    }
  };

  if (!currentBooking) {
    return null;
  }

  if (showRating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Rate your ride</Text>
          <Text style={styles.ratingSubtitle}>How was your experience with {currentBooking.driver?.name}?</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Star
                  size={40}
                  color={star <= rating ? '#FFD700' : '#E5E7EB'}
                  fill={star <= rating ? '#FFD700' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.feedbackLabel}>Add feedback (optional)</Text>
          <Text
            style={styles.feedbackInput}
            onPress={() => {
              Alert.prompt(
                'Feedback',
                'How was your ride?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Save',
                    onPress: (text) => {
                      if (text) setFeedback(text);
                    },
                  },
                ],
                'plain-text',
                feedback
              );
            }}
          >
            {feedback || 'Tap to add feedback...'}
          </Text>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitRating}
          >
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setCurrentBooking(null);
              router.replace('/(tabs)');
            }}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Ride</Text>
        <TouchableOpacity onPress={handleCancelRide}>
          <X size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.mapPlaceholder}>
            <User size={48} color="#6B7280" />
            <Text style={styles.mapPlaceholderText}>Live Tracking Map</Text>
            <View style={styles.trackingInfo}>
              <Text style={styles.trackingText}>📍 Pickup: {currentBooking.startLocation.name}</Text>
              <Text style={styles.trackingText}>🎯 Destination: {currentBooking.endLocation.name}</Text>
              {driverLocation && (
                <Text style={styles.driverLocationText}>
                  🚗 Driver Location: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentBooking.startLocation.latitude,
              longitude: currentBooking.startLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{
                latitude: currentBooking.startLocation.latitude,
                longitude: currentBooking.startLocation.longitude,
              }}
              title="Pickup Location"
            />
            
            <Marker
              coordinate={{
                latitude: currentBooking.endLocation.latitude,
                longitude: currentBooking.endLocation.longitude,
              }}
              title="Destination"
            />

            {driverLocation && (
              <Marker
                coordinate={driverLocation}
                title={`${currentBooking.driver?.name}'s Location`}
              >
                <View style={styles.driverMarker}>
                  <User size={16} color="#ffffff" />
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.statusText}>Driver is on the way</Text>
        <Text style={styles.estimateText}>Estimated arrival: 3-5 minutes</Text>

        {currentBooking.driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{currentBooking.driver.name}</Text>
              <Text style={styles.driverDetails}>
                {currentBooking.driver.carNumber} • ⭐ {currentBooking.driver.rating}
              </Text>
            </View>
            
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCall}
              >
                <Phone size={20} color="#10B981" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMessage}
              >
                <MessageSquare size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.tripDetails}>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>From</Text>
            <Text style={styles.tripValue}>{currentBooking.startLocation.name}</Text>
          </View>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>To</Text>
            <Text style={styles.tripValue}>{currentBooking.endLocation.name}</Text>
          </View>
          <View style={styles.tripItem}>
            <Text style={styles.tripLabel}>Fare</Text>
            <Text style={styles.tripValue}>₹{currentBooking.fare}</Text>
          </View>
        </View>

        {currentBooking.pickupInstructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Pickup Instructions</Text>
            <Text style={styles.instructionsText}>{currentBooking.pickupInstructions}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    margin: 16,
    borderRadius: 12,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  trackingInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 2,
  },
  driverLocationText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 8,
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  estimateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  driverDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripDetails: {
    gap: 12,
  },
  tripItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tripValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  instructions: {
    marginTop: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1D4ED8',
  },
  ratingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  feedbackInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 60,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
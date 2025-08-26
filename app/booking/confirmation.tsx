import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Car, Clock, IndianRupee, MessageSquare } from 'lucide-react-native';
import { Location, Vehicle } from '@/types';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const startLocation: Location = JSON.parse(params.startLocation as string);
  const endLocation: Location = JSON.parse(params.endLocation as string);
  const vehicle: Vehicle = JSON.parse(params.vehicle as string);
  const fare = parseInt(params.fare as string);

  const handleConfirmBooking = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Authentication Required',
        'You need to login to book a ride, or continue as guest',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') },
          { text: 'Guest Booking', onPress: () => handleGuestBooking() },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const success = await createBooking(
        startLocation,
        endLocation,
        vehicle,
        pickupInstructions || undefined
      );

      if (success) {
        Alert.alert(
          'Booking Confirmed!',
          'Your ride has been booked successfully. Driver details will be updated soon.',
          [
            { text: 'OK', onPress: () => router.push('/tracking') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to book ride. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBooking = () => {
    router.push({
      pathname: '/booking/guest',
      params: {
        startLocation: JSON.stringify(startLocation),
        endLocation: JSON.stringify(endLocation),
        vehicle: JSON.stringify(vehicle),
        fare: fare.toString(),
        pickupInstructions,
      },
    });
  };

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
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <Text style={styles.headerSubtitle}>Review your trip details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routeItem}>
              <MapPin size={20} color="#10B981" />
              <View style={styles.routeText}>
                <Text style={styles.locationName}>{startLocation.name}</Text>
                <Text style={styles.locationAddress}>{startLocation.address}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routeItem}>
              <MapPin size={20} color="#EF4444" />
              <View style={styles.routeText}>
                <Text style={styles.locationName}>{endLocation.name}</Text>
                <Text style={styles.locationAddress}>{endLocation.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.vehicleContainer}>
            <Car size={20} color="#6B7280" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleType}>{vehicle.type} • {vehicle.capacity} seats</Text>
            </View>
            <Text style={styles.vehiclePrice}>₹{vehicle.pricePerKm}/km</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <View style={styles.fareContainer}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>₹50</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance Charges</Text>
              <Text style={styles.fareValue}>₹{Math.round((fare - 50 - 20 - 40) || 0)}</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Driver Fee</Text>
              <Text style={styles.fareValue}>₹20</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Toll (est.)</Text>
              <Text style={styles.fareValue}>₹40</Text>
            </View>
            <View style={[styles.fareItem, styles.totalFare]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{fare}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Instructions</Text>
          <View style={styles.instructionsContainer}>
            <MessageSquare size={20} color="#6B7280" style={styles.instructionsIcon} />
            <TextInput
              style={styles.instructionsInput}
              placeholder="Add pickup instructions (optional)"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
              maxLength={200}
            />
          </View>
          <Text style={styles.instructionsHint}>
            e.g., "Near the main gate", "Blue building", etc.
          </Text>
        </View>

        <View style={styles.estimatedTime}>
          <Clock size={20} color="#10B981" />
          <Text style={styles.estimatedTimeText}>Estimated pickup: 2-5 minutes</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          <IndianRupee size={20} color="#ffffff" />
          <Text style={styles.confirmButtonText}>
            {loading ? 'Booking...' : `Confirm Ride - ₹${fare}`}
          </Text>
        </TouchableOpacity>
        
        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestBooking}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  routeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginLeft: 10,
    marginVertical: 8,
  },
  routeText: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  fareContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalFare: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  instructionsIcon: {
    marginTop: 2,
  },
  instructionsInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  instructionsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  estimatedTimeText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  guestButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
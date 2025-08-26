import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Car, IndianRupee, CreditCard as Edit3, Star } from 'lucide-react-native';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/types';

export default function BookingsScreen() {
  const router = useRouter();
  const { confirmedBookings, fetchConfirmedBookings, updatePickupInstructions, currentBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchConfirmedBookings();
    }
  }, [isLoggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConfirmedBookings();
    setRefreshing(false);
  };

  const handleEditInstructions = (booking: Booking) => {
    Alert.prompt(
      'Edit Pickup Instructions',
      'Update your pickup instructions:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (instructions) => {
            if (instructions !== undefined) {
              updatePickupInstructions(booking.id, instructions);
            }
          },
        },
      ],
      'plain-text',
      booking.pickupInstructions || ''
    );
  };

  const allBookings = useMemo(() => {
    const bookings = [...confirmedBookings];
    if (currentBooking) {
      bookings.unshift(currentBooking);
    }
    return bookings;
  }, [confirmedBookings, currentBooking]);

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(booking.status) }
          ]} />
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.bookingDate}>
          {new Date(booking.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <MapPin size={16} color="#10B981" />
          <Text style={styles.routeText}>{booking.startLocation.name}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <MapPin size={16} color="#EF4444" />
          <Text style={styles.routeText}>{booking.endLocation.name}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <Car size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.vehicle.name}</Text>
        </View>
        <View style={styles.detailItem}>
          <IndianRupee size={16} color="#6B7280" />
          <Text style={styles.detailText}>₹{booking.fare}</Text>
        </View>
        {booking.pickupTime && (
          <View style={styles.detailItem}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailText}>{booking.pickupTime}</Text>
          </View>
        )}
      </View>

      {booking.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{booking.driver.name}</Text>
          <Text style={styles.driverDetails}>
            {booking.driver.carNumber} • ⭐ {booking.driver.rating}
          </Text>
          <Text style={styles.driverPhone}>{booking.driver.phone}</Text>
        </View>
      )}

      {booking.pickupInstructions && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Pickup Instructions:</Text>
          <Text style={styles.instructionsText}>{booking.pickupInstructions}</Text>
        </View>
      )}

      <View style={styles.paymentInfo}>
        <View style={styles.paymentItem}>
          <Text style={styles.paymentLabel}>Amount Paid:</Text>
          <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
            ₹{booking.amountPaid}
          </Text>
        </View>
        {booking.amountPending > 0 && (
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Amount Pending:</Text>
            <Text style={[styles.paymentAmount, { color: '#EF4444' }]}>
              ₹{booking.amountPending}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditInstructions(booking)}
        >
          <Edit3 size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Edit Instructions</Text>
        </TouchableOpacity>
        
        {booking.status === 'ongoing' && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push('/tracking')}
          >
            <Text style={styles.trackButtonText}>Track Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#10B981';
      case 'ongoing': return '#3B82F6';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Login Required</Text>
          <Text style={styles.emptyStateText}>
            Please login to view your bookings
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <Text style={styles.headerSubtitle}>Track your current and upcoming rides</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {allBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Active Rides</Text>
            <Text style={styles.emptyStateText}>
              You don't have any confirmed rides yet
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/booking/location')}
            >
              <Text style={styles.bookButtonText}>Book a Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          allBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginLeft: 8,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  driverInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentItem: {
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  trackButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
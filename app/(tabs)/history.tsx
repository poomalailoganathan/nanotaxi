import React, { useState, useEffect } from 'react';
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
import { MapPin, IndianRupee, Star, Calendar, Car } from 'lucide-react-native';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { bookingHistory, fetchBookingHistory, rateBooking } = useBooking();
  const { isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookingHistory();
    }
  }, [isLoggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingHistory();
    setRefreshing(false);
  };

  const handleRateRide = (booking: Booking) => {
    Alert.alert(
      'Rate this ride',
      `How was your experience with ${booking.driver?.name || 'your driver'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '⭐⭐⭐⭐⭐ (5 Stars)', onPress: () => submitRating(booking.id, 5) },
        { text: '⭐⭐⭐⭐ (4 Stars)', onPress: () => submitRating(booking.id, 4) },
        { text: '⭐⭐⭐ (3 Stars)', onPress: () => submitRating(booking.id, 3) },
        { text: '⭐⭐ (2 Stars)', onPress: () => submitRating(booking.id, 2) },
        { text: '⭐ (1 Star)', onPress: () => submitRating(booking.id, 1) },
      ]
    );
  };

  const submitRating = async (bookingId: string, rating: number) => {
    try {
      await rateBooking(bookingId, rating, `${rating} star rating`);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const renderHistoryCard = (booking: Booking) => (
    <View key={booking.id} style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {new Date(booking.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) }
        ]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <MapPin size={16} color="#10B981" />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.startLocation.name}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <MapPin size={16} color="#EF4444" />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.endLocation.name}
          </Text>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <Car size={16} color="#6B7280" />
          <Text style={styles.detailText}>{booking.vehicle.name}</Text>
        </View>
        <View style={styles.detailItem}>
          <IndianRupee size={16} color="#6B7280" />
          <Text style={styles.detailText}>₹{booking.fare}</Text>
        </View>
      </View>

      {booking.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>Driver: {booking.driver.name}</Text>
          <Text style={styles.driverDetails}>
            {booking.driver.carNumber} • ⭐ {booking.driver.rating}
          </Text>
        </View>
      )}

      {booking.rating ? (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Your Rating:</Text>
          <View style={styles.starsDisplay}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                color={star <= booking.rating! ? '#FFD700' : '#E5E7EB'}
                fill={star <= booking.rating! ? '#FFD700' : 'transparent'}
              />
            ))}
          </View>
        </View>
      ) : (
        booking.status === 'completed' && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateRide(booking)}
          >
            <Star size={16} color="#F59E0B" />
            <Text style={styles.rateButtonText}>Rate this ride</Text>
          </TouchableOpacity>
        )
      )}

      {booking.feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Your Feedback:</Text>
          <Text style={styles.feedbackText}>"{booking.feedback}"</Text>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Mock booking history for demo
  const mockHistory: Booking[] = [
    {
      id: 'hist1',
      userId: '1',
      startLocation: {
        id: '1',
        name: 'Electronic City',
        address: 'Electronic City, Bangalore',
        latitude: 12.8456,
        longitude: 77.6603,
      },
      endLocation: {
        id: '2',
        name: 'MG Road',
        address: 'Mahatma Gandhi Road, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      vehicle: {
        id: '1',
        type: 'Sedan',
        name: 'Namma Sedan',
        pricePerKm: 16,
        image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
        capacity: 4,
      },
      fare: 245,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      amountPending: 0,
      amountPaid: 245,
      rating: 5,
      feedback: 'Great ride, very comfortable!',
      driver: {
        id: '1',
        name: 'Rajesh Kumar',
        phone: '+91 9876543210',
        carNumber: 'KA-01-AB-1234',
        rating: 4.8,
        latitude: 12.8456,
        longitude: 77.6603,
      },
    },
    {
      id: 'hist2',
      userId: '1',
      startLocation: {
        id: '3',
        name: 'Koramangala',
        address: 'Koramangala, Bangalore',
        latitude: 12.9279,
        longitude: 77.6271,
      },
      endLocation: {
        id: '4',
        name: 'Bangalore Airport',
        address: 'Kempegowda International Airport, Bangalore',
        latitude: 13.1986,
        longitude: 77.7066,
      },
      vehicle: {
        id: '1',
        type: 'Mini',
        name: 'Namma Mini',
        pricePerKm: 12,
        image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
        capacity: 4,
      },
      fare: 420,
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      amountPending: 0,
      amountPaid: 420,
      driver: {
        id: '2',
        name: 'Suresh Babu',
        phone: '+91 9876543211',
        carNumber: 'KA-02-CD-5678',
        rating: 4.6,
        latitude: 12.9279,
        longitude: 77.6271,
      },
    },
  ];

  const displayHistory = bookingHistory.length > 0 ? bookingHistory : (isLoggedIn ? mockHistory : []);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Login Required</Text>
          <Text style={styles.emptyStateText}>
            Please login to view your ride history
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
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>Your past trips and experiences</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Ride History</Text>
            <Text style={styles.emptyStateText}>
              You haven't taken any rides yet
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/booking/location')}
            >
              <Text style={styles.bookButtonText}>Book Your First Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayHistory.map(renderHistoryCard)
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
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
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
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  driverInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  driverDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#92400E',
    marginRight: 8,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 2,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  rateButtonText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 6,
  },
  feedbackContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontStyle: 'italic',
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
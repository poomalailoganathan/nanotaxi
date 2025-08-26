import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Clock, ArrowRight } from 'lucide-react-native';
import { Location, Vehicle } from '@/types';
import { apiGet } from '@/services/apiClient';

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [fare, setFare] = useState<number | null>(null);

  const startLocation: Location = JSON.parse(params.startLocation as string);
  const endLocation: Location = JSON.parse(params.endLocation as string);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      calculateFare(selectedVehicle);
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const response = await apiGet('/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Vehicle fetch error:', error);
      // Mock vehicles for demo
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          type: 'Mini',
          name: 'Namma Mini',
          pricePerKm: 12,
          image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
          capacity: 4,
        },
        {
          id: '2',
          type: 'Sedan',
          name: 'Namma Sedan',
          pricePerKm: 16,
          image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
          capacity: 4,
        },
        {
          id: '3',
          type: 'SUV',
          name: 'Namma SUV',
          pricePerKm: 22,
          image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg',
          capacity: 6,
        },
        {
          id: '4',
          type: 'Premium',
          name: 'Namma Premium',
          pricePerKm: 28,
          image: 'https://images.pexels.com/photos/1719648/pexels-photo-1719648.jpeg',
          capacity: 4,
        },
      ];
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (): number => {
    const lat1 = startLocation.latitude;
    const lon1 = startLocation.longitude;
    const lat2 = endLocation.latitude;
    const lon2 = endLocation.longitude;

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
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const calculateFare = async (vehicle: Vehicle) => {
    try {
      const distance = calculateDistance();
      
      try {
        const response = await apiGet(`/api/fare?distance=${distance}&vehicleType=${vehicle.type}`);
        setFare(response.data.fare);
      } catch (error) {
        // Calculate fare locally
        const baseFare = 50;
        const driverFee = 20;
        const tollAmount = distance > 10 ? 40 : 0;
        const totalFare = (distance * vehicle.pricePerKm) + baseFare + driverFee + tollAmount;
        setFare(Math.round(totalFare));
      }
    } catch (error) {
      console.error('Fare calculation error:', error);
    }
  };

  const handleContinue = () => {
    if (!selectedVehicle || !fare) return;

    router.push({
      pathname: '/booking/confirmation',
      params: {
        startLocation: JSON.stringify(startLocation),
        endLocation: JSON.stringify(endLocation),
        vehicle: JSON.stringify(selectedVehicle),
        fare: fare.toString(),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
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
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          <Text style={styles.headerSubtitle}>Choose your ride</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routeItem}>
          <View style={[styles.routeIndicator, { backgroundColor: '#10B981' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{startLocation.name}</Text>
        </View>
        <View style={styles.routeItem}>
          <View style={[styles.routeIndicator, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{endLocation.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle?.id === vehicle.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <View style={styles.vehicleDetails}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.vehicleCapacity}>{vehicle.capacity} seats</Text>
                <Clock size={16} color="#6B7280" style={{ marginLeft: 12 }} />
                <Text style={styles.vehicleTime}>2-5 min</Text>
              </View>
            </View>
            <View style={styles.vehiclePrice}>
              <Text style={styles.priceText}>₹{vehicle.pricePerKm}/km</Text>
              {selectedVehicle?.id === vehicle.id && fare && (
                <Text style={styles.totalFare}>Total: ₹{fare}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedVehicle && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedVehicle}
        >
          <Text style={styles.continueButtonText}>
            {fare ? `Continue - ₹${fare}` : 'Continue'}
          </Text>
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
  routeInfo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  routeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  vehicleImage: {
    width: 60,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleCapacity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  vehicleTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  vehiclePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalFare: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 2,
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
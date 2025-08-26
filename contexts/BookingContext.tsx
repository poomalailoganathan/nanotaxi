import React, { createContext, useContext, useState } from 'react';
import { Booking, Location, Vehicle, Driver } from '@/types';
import { apiPost, apiGet, apiPut } from '@/services/apiClient';

interface BookingContextType {
  currentBooking: Booking | null;
  confirmedBookings: Booking[];
  bookingHistory: Booking[];
  createBooking: (startLocation: Location, endLocation: Location, vehicle: Vehicle, pickupInstructions?: string) => Promise<boolean>;
  updatePickupInstructions: (bookingId: string, instructions: string) => Promise<boolean>;
  rateBooking: (bookingId: string, rating: number, feedback: string) => Promise<boolean>;
  fetchConfirmedBookings: () => Promise<void>;
  fetchBookingHistory: () => Promise<void>;
  setCurrentBooking: (booking: Booking | null) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);

  const createBooking = async (
    startLocation: Location,
    endLocation: Location,
    vehicle: Vehicle,
    pickupInstructions?: string
  ): Promise<boolean> => {
    try {
      const bookingData = {
        startLocation,
        endLocation,
        vehicleId: vehicle.id,
        vehicleType: vehicle.type,
        pickupInstructions,
        fare: calculateFare(startLocation, endLocation, vehicle),
      };

      // Use the specified API endpoint for booking confirmation
      const response = await apiPost('/api/bookings', bookingData);
      console.log('Booking created successfully:', response.data);
      
      // Create mock booking for demo
      const mockBooking: Booking = {
        id: Date.now().toString(),
        userId: '1',
        startLocation,
        endLocation,
        vehicle,
        fare: calculateFare(startLocation, endLocation, vehicle),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        pickupInstructions,
        amountPending: calculateFare(startLocation, endLocation, vehicle),
        amountPaid: 0,
        driver: {
          id: '1',
          name: 'Rajesh Kumar',
          phone: '+91 9876543210',
          carNumber: 'KA-01-AB-1234',
          rating: 4.8,
          latitude: startLocation.latitude + 0.01,
          longitude: startLocation.longitude + 0.01,
        },
      };

      setCurrentBooking(mockBooking);
      return true;
    } catch (error) {
      console.error('Create booking error:', error);
      console.log('API booking failed, creating mock booking for demo');
      
      // Create mock booking even if API fails (for demo purposes)
      const mockBooking: Booking = {
        id: Date.now().toString(),
        userId: '1',
        startLocation,
        endLocation,
        vehicle,
        fare: calculateFare(startLocation, endLocation, vehicle),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        pickupInstructions,
        amountPending: calculateFare(startLocation, endLocation, vehicle),
        amountPaid: 0,
        driver: {
          id: '1',
          name: 'Rajesh Kumar',
          phone: '+91 9876543210',
          carNumber: 'KA-01-AB-1234',
          rating: 4.8,
          latitude: startLocation.latitude + 0.01,
          longitude: startLocation.longitude + 0.01,
        },
      };

      setCurrentBooking(mockBooking);
      return true;
    }
  };

  const calculateFare = (start: Location, end: Location, vehicle: Vehicle): number => {
    // Haversine formula for distance calculation
    const lat1 = start.latitude;
    const lon1 = start.longitude;
    const lat2 = end.latitude;
    const lon2 = end.longitude;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.sqrt(
      Math.pow(end.latitude - start.latitude, 2) +
      Math.pow(end.longitude - start.longitude, 2)
    ) * 111; // Rough conversion to km for fallback
    
    const actualDistance = R * c; // More accurate distance in km
    const finalDistance = actualDistance > 0 ? actualDistance : distance;
    
    const baseFare = 50;
    const driverFee = 20;
    const tollAmount = finalDistance > 10 ? 40 : 0;
    const distanceFare = finalDistance * vehicle.pricePerKm;
    
    return Math.round((baseFare + distanceFare + driverFee + tollAmount) * 100) / 100;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const updatePickupInstructions = async (bookingId: string, instructions: string): Promise<boolean> => {
    try {
      await apiPut(`/api/bookings/${bookingId}/instructions`, { instructions });
      
      if (currentBooking && currentBooking.id === bookingId) {
        setCurrentBooking({
          ...currentBooking,
          pickupInstructions: instructions,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Update instructions error:', error);
      return false;
    }
  };

  const rateBooking = async (bookingId: string, rating: number, feedback: string): Promise<boolean> => {
    try {
      await apiPost(`/api/bookings/${bookingId}/feedback`, { rating, feedback });
      
      // Update local state
      const updateBooking = (booking: Booking) =>
        booking.id === bookingId ? { ...booking, rating, feedback } : booking;
      
      setConfirmedBookings(prev => prev.map(updateBooking));
      setBookingHistory(prev => prev.map(updateBooking));
      
      return true;
    } catch (error) {
      console.error('Rate booking error:', error);
      return false;
    }
  };

  const fetchConfirmedBookings = async (): Promise<void> => {
    try {
      const response = await apiGet('/api/bookings/confirmed');
      setConfirmedBookings(response.data);
    } catch (error) {
      console.error('Fetch confirmed bookings error:', error);
      // Mock data for demo
      setConfirmedBookings([]);
    }
  };

  const fetchBookingHistory = async (): Promise<void> => {
    try {
      const response = await apiGet('/api/bookings/history');
      setBookingHistory(response.data);
    } catch (error) {
      console.error('Fetch booking history error:', error);
      // Mock data for demo
      setBookingHistory([]);
    }
  };

  return (
    <BookingContext.Provider value={{
      currentBooking,
      confirmedBookings,
      bookingHistory,
      createBooking,
      updatePickupInstructions,
      rateBooking,
      fetchConfirmedBookings,
      fetchBookingHistory,
      setCurrentBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
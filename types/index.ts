export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Vehicle {
  id: string;
  type: string;
  name: string;
  pricePerKm: number;
  image: string;
  capacity: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  carNumber: string;
  rating: number;
  latitude: number;
  longitude: number;
}

export interface Booking {
  id: string;
  userId: string;
  startLocation: Location;
  endLocation: Location;
  vehicle: Vehicle;
  driver?: Driver;
  fare: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  pickupTime?: string;
  pickupInstructions?: string;
  amountPending: number;
  amountPaid: number;
  rating?: number;
  feedback?: string;
}

export interface GuestBooking {
  email: string;
  phone: string;
  address: string;
  startLocation: Location;
  endLocation: Location;
  vehicle: Vehicle;
}
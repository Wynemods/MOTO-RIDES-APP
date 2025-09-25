import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/api.service';
import WebSocketService from '../services/websocket.service';
import { useAuth } from './AuthContext';

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  fare: number;
  status: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
  paymentMethod: 'mpesa' | 'stripe' | 'wallet';
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    vehicleInfo: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  eta?: number;
}

interface RidesContextType {
  currentRide: Ride | null;
  rideHistory: Ride[];
  isLoading: boolean;
  requestRide: (rideData: {
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    fare: number;
    paymentMethod: 'mpesa' | 'stripe' | 'wallet';
  }) => Promise<boolean>;
  cancelRide: (rideId: string) => Promise<boolean>;
  updateRideStatus: (rideId: string, status: string) => Promise<boolean>;
  getRideHistory: () => Promise<void>;
  acceptRide: (rideId: string) => Promise<boolean>;
  completeRide: (rideId: string) => Promise<boolean>;
  sendMessage: (message: string) => Promise<void>;
  sendEmergencyAlert: (type: string, message: string) => Promise<void>;
}

const RidesContext = createContext<RidesContextType | undefined>(undefined);

interface RidesProviderProps {
  children: ReactNode;
}

export const RidesProvider: React.FC<RidesProviderProps> = ({ children }) => {
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getRideHistory();
      setupWebSocketListeners();
    }
  }, [user]);

  const setupWebSocketListeners = () => {
    // Ride status updates
    WebSocketService.on('ride:status:update', (data) => {
      if (currentRide && data.rideId === currentRide.id) {
        setCurrentRide(prev => prev ? {
          ...prev,
          status: data.status as any,
          currentLocation: data.location,
          eta: data.eta,
        } : null);
      }
    });

    // Ride accepted
    WebSocketService.on('ride:accepted', (data) => {
      if (currentRide && data.rideId === currentRide.id) {
        setCurrentRide(prev => prev ? {
          ...prev,
          status: 'accepted',
          driverId: data.driverId,
          driver: {
            id: data.driverId,
            name: data.driverName,
            phone: data.driverPhone,
            rating: 4.5, // Default rating
            vehicleInfo: 'Motorcycle',
          },
          eta: data.estimatedArrival,
        } : null);
      }
    });

    // Driver location updates
    WebSocketService.on('driver:location:update', (data) => {
      if (currentRide && currentRide.driverId === data.driverId) {
        setCurrentRide(prev => prev ? {
          ...prev,
          currentLocation: {
            lat: data.lat,
            lng: data.lng,
          },
        } : null);
      }
    });

    // New ride requests (for drivers)
    WebSocketService.on('ride:request:new', (data) => {
      Alert.alert(
        'New Ride Request',
        `Fare: ${data.fare} KES\nFrom: ${data.pickup.address}\nTo: ${data.destination.address}`,
        [
          { text: 'Decline', style: 'cancel' },
          { text: 'Accept', onPress: () => acceptRide(data.rideId) },
        ]
      );
    });
  };

  const requestRide = async (rideData: {
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    fare: number;
    paymentMethod: 'mpesa' | 'stripe' | 'wallet';
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const ride = await ApiService.requestRide(rideData);
      setCurrentRide(ride);
      
      // Send ride request via WebSocket
      WebSocketService.requestRide(
        rideData.pickup,
        rideData.destination,
        rideData.fare,
        ride.id
      );
      
      return true;
    } catch (error: any) {
      console.error('Ride request error:', error);
      Alert.alert('Ride Request Failed', error.response?.data?.message || 'Failed to request ride');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRide = async (rideId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await ApiService.cancelRide(rideId);
      setCurrentRide(null);
      
      // Update ride status via WebSocket
      WebSocketService.updateRideStatus(rideId, 'cancelled');
      
      return true;
    } catch (error: any) {
      console.error('Cancel ride error:', error);
      Alert.alert('Cancel Failed', error.response?.data?.message || 'Failed to cancel ride');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRideStatus = async (rideId: string, status: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await ApiService.updateRideStatus(rideId, status);
      
      // Update local state
      setCurrentRide(prev => prev && prev.id === rideId ? { ...prev, status: status as any } : prev);
      
      // Send status update via WebSocket
      WebSocketService.updateRideStatus(rideId, status);
      
      return true;
    } catch (error: any) {
      console.error('Update ride status error:', error);
      Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update ride status');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getRideHistory = async () => {
    try {
      setIsLoading(true);
      const rides = await ApiService.getRides();
      setRideHistory(rides);
    } catch (error) {
      console.error('Get ride history error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptRide = async (rideId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Accept ride via WebSocket
      WebSocketService.acceptRide(rideId, 'rider-id'); // You'll need to get the actual rider ID
      
      return true;
    } catch (error: any) {
      console.error('Accept ride error:', error);
      Alert.alert('Accept Failed', error.response?.data?.message || 'Failed to accept ride');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRide = async (rideId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await updateRideStatus(rideId, 'completed');
      setCurrentRide(null);
      return true;
    } catch (error: any) {
      console.error('Complete ride error:', error);
      Alert.alert('Complete Failed', error.response?.data?.message || 'Failed to complete ride');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!currentRide) return;
    
    try {
      const recipientId = user?.role === 'Driver' ? currentRide.riderId : currentRide.driverId;
      if (recipientId) {
        WebSocketService.sendMessage(currentRide.id, message, recipientId);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const sendEmergencyAlert = async (type: string, message: string) => {
    if (!currentRide) return;
    
    try {
      const location = currentRide.currentLocation || currentRide.pickup;
      WebSocketService.sendEmergencyAlert(currentRide.id, type, message, location);
      Alert.alert('Emergency Alert', 'Emergency alert has been sent');
    } catch (error) {
      console.error('Send emergency alert error:', error);
    }
  };

  const value: RidesContextType = {
    currentRide,
    rideHistory,
    isLoading,
    requestRide,
    cancelRide,
    updateRideStatus,
    getRideHistory,
    acceptRide,
    completeRide,
    sendMessage,
    sendEmergencyAlert,
  };

  return (
    <RidesContext.Provider value={value}>
      {children}
    </RidesContext.Provider>
  );
};

export const useRides = () => {
  const context = useContext(RidesContext);
  if (context === undefined) {
    throw new Error('useRides must be used within a RidesProvider');
  }
  return context;
};

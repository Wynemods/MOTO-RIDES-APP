import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import OpenStreetMapService from '../services/openstreetmap.service';

interface LocationType {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationContextType {
  currentLocation: LocationType | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  searchPlaces: (query: string) => Promise<any[]>;
  geocodeAddress: (address: string) => Promise<LocationType>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
    } catch (err) {
      setError('Location permission is required to use this app');
      throw err;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await requestLocationPermission();

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const address = await OpenStreetMapService.reverseGeocode(latitude, longitude);

      setCurrentLocation({
        latitude,
        longitude,
        address: address.address,
      });
    } catch (err) {
      console.error('Error getting current location:', err);
      setError(err instanceof Error ? err.message : 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    try {
      if (!currentLocation) {
        throw new Error('Current location not available');
      }

      return await OpenStreetMapService.searchPlaces(query, currentLocation.latitude, currentLocation.longitude);
    } catch (err) {
      console.error('Error searching places:', err);
      setError(err instanceof Error ? err.message : 'Failed to search places');
      return [];
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      return await OpenStreetMapService.geocodeAddress(address);
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError(err instanceof Error ? err.message : 'Failed to geocode address');
      throw err;
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const value: LocationContextType = {
    currentLocation,
    isLoading,
    error,
    getCurrentLocation,
    searchPlaces,
    geocodeAddress,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

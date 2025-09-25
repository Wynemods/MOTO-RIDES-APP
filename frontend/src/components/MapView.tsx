import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Driver {
  latitude: number;
  longitude: number;
  distance: number;
}

interface Route {
  polyline: string;
  distance: number;
  duration: number;
}

interface MapViewComponentProps {
  fromLocation?: Location | null;
  toLocation?: Location | null;
  route?: Route | null;
  drivers?: Driver[];
  style?: any;
}

export default function MapViewComponent({
  fromLocation,
  toLocation,
  route,
  drivers = [],
  style,
}: MapViewComponentProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: -0.0236, // Chuka University coordinates
    longitude: 37.9062,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Update region when locations change
  useEffect(() => {
    if (fromLocation && toLocation) {
      const coordinates = [fromLocation, toLocation];
      const latitudes = coordinates.map(coord => coord.latitude);
      const longitudes = coordinates.map(coord => coord.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const newRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.2,
        longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.2,
      };
      
      setRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } else if (fromLocation) {
      setRegion({
        latitude: fromLocation.latitude,
        longitude: fromLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [fromLocation, toLocation]);

  // Decode polyline (simplified version)
  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const getRouteCoordinates = () => {
    if (!route?.polyline) return [];
    return decodePolyline(route.polyline);
  };

  const renderDriverMarkers = () => {
    return drivers.map((driver, index) => (
      <Marker
        key={`driver-${index}`}
        coordinate={{
          latitude: driver.latitude,
          longitude: driver.longitude,
        }}
        title="Available Driver"
        description={`${Math.round(driver.distance)}m away`}
      >
        <View style={styles.driverMarker}>
          <MaterialIcons name="motorcycle" size={20} color="#fff" />
        </View>
      </Marker>
    ));
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        onPress={() => {
          // Handle map press if needed
        }}
      >
        {/* From Location Marker */}
        {fromLocation && (
          <Marker
            coordinate={{
              latitude: fromLocation.latitude,
              longitude: fromLocation.longitude,
            }}
            title="Pickup Location"
            description={fromLocation.address}
          >
            <View style={styles.pickupMarker}>
              <MaterialIcons name="location-on" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* To Location Marker */}
        {toLocation && (
          <Marker
            coordinate={{
              latitude: toLocation.latitude,
              longitude: toLocation.longitude,
            }}
            title="Destination"
            description={toLocation.address}
          >
            <View style={styles.destinationMarker}>
              <MaterialIcons name="place" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {route && getRouteCoordinates().length > 0 && (
          <Polyline
            coordinates={getRouteCoordinates()}
            strokeColor="#000"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Driver Markers */}
        {renderDriverMarkers()}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});
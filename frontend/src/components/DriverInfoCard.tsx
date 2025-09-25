import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';

interface DriverInfo {
  id: string;
  name: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  rating: number;
  vehicle: {
    type: 'motorcycle' | 'car' | 'lorry';
    brand: string;
    model: string;
    color: string;
    numberPlate: string;
  };
}

interface DriverInfoCardProps {
  driver: DriverInfo;
  onCall?: () => void;
}

export const DriverInfoCard: React.FC<DriverInfoCardProps> = ({
  driver,
  onCall
}) => {
  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'lorry':
        return '🚛';
      default:
        return '🚗';
    }
  };

  const getVehicleTypeName = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return 'Motorcycle';
      case 'car':
        return 'Car';
      case 'lorry':
        return 'Lorry';
      default:
        return 'Vehicle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Driver</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {driver.rating}/5</Text>
        </View>
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverPhoto}>
          {driver.profilePictureUrl ? (
            <Image
              source={{ uri: driver.profilePictureUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {driver.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverPhone}>{driver.phoneNumber}</Text>
          
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleIcon}>
              {getVehicleTypeIcon(driver.vehicle.type)}
            </Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleType}>
                {getVehicleTypeName(driver.vehicle.type)}
              </Text>
              <Text style={styles.vehicleDescription}>
                {driver.vehicle.brand} {driver.vehicle.model}
              </Text>
              <Text style={styles.vehiclePlate}>
                {driver.vehicle.color} • {driver.vehicle.numberPlate}
              </Text>
            </View>
          </View>
        </View>

        {onCall && (
          <TouchableOpacity style={styles.callButton} onPress={onCall}>
            <Text style={styles.callButtonText}>📞</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhoto: {
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#28a745',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  callButtonText: {
    fontSize: 20,
  },
});

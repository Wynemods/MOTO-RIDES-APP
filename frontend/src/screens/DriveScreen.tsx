import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function DriveScreen() {
  const [isOnline, setIsOnline] = useState(false);

  const scheduledRides = [
    {
      id: 1,
      time: '2:30 PM Today',
      from: '123 Main St',
      to: '456 Market St',
      price: '$15.75',
    },
    {
      id: 2,
      time: '4:15 PM Today',
      from: '789 Park Ave',
      to: '101 Business Ctr',
      price: '$22.50',
    },
  ];

  const motorcycles = [
    {
      id: 1,
      name: 'Honda CBR 250',
      details: 'Red • ABC123',
      isActive: true,
    },
    {
      id: 2,
      name: 'Yamaha MT-07',
      details: 'Black • XYZ789',
      isActive: false,
    },
  ];

  const handleRideDetails = (ride: any) => {
    // TODO: Navigate to ride details
    console.log('Ride details:', ride);
  };

  const handleMotorcyclePress = (motorcycle: any) => {
    // TODO: Handle motorcycle selection
    console.log('Motorcycle selected:', motorcycle);
  };

  const handleAddMotorcycle = () => {
    // TODO: Navigate to add motorcycle screen
    console.log('Add motorcycle');
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.title}>Driver Dashboard</Text>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Online/Offline Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>
                {isOnline ? 'You are online' : 'You are offline'}
              </Text>
              <Text style={styles.statusSubtext}>
                {isOnline 
                  ? 'You are receiving ride requests' 
                  : 'Go online to start receiving rides'
                }
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#ccc', true: '#00FF00' }}
              thumbColor={isOnline ? '#000' : '#fff'}
            />
          </Card.Content>
        </Card>

        {/* Scheduled Rides Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Rides</Text>
          {scheduledRides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              onPress={() => handleRideDetails(ride)}
              style={styles.rideCardContainer}
            >
              <Card style={styles.rideCard}>
                <Card.Content style={styles.rideContent}>
                  <View style={styles.rideLeft}>
                    <MaterialIcons name="schedule" size={20} color="#666" />
                    <View style={styles.rideInfo}>
                      <Text style={styles.rideTime}>{ride.time}</Text>
                      <Text style={styles.rideFrom}>From: {ride.from}</Text>
                      <Text style={styles.rideTo}>To: {ride.to}</Text>
                    </View>
                  </View>
                  <View style={styles.rideRight}>
                    <Text style={styles.ridePrice}>{ride.price}</Text>
                    <Text style={styles.detailsLink}>Details</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Motorcycles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Motorcycles</Text>
          {motorcycles.map((motorcycle) => (
            <TouchableOpacity
              key={motorcycle.id}
              onPress={() => handleMotorcyclePress(motorcycle)}
              style={styles.motorcycleCardContainer}
            >
              <Card style={styles.motorcycleCard}>
                <Card.Content style={styles.motorcycleContent}>
                  <View style={styles.motorcycleInfo}>
                    <Text style={styles.motorcycleName}>{motorcycle.name}</Text>
                    <Text style={styles.motorcycleDetails}>{motorcycle.details}</Text>
                  </View>
                  <View style={styles.statusIndicator}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: motorcycle.isActive ? '#00FF00' : '#ccc' }
                      ]}
                    />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
          
          {/* Add Motorcycle Button */}
          <TouchableOpacity
            onPress={handleAddMotorcycle}
            style={styles.addMotorcycleButton}
          >
            <Card style={styles.addMotorcycleCard}>
              <Card.Content style={styles.addMotorcycleContent}>
                <MaterialIcons name="add" size={24} color="#333" />
                <Text style={styles.addMotorcycleText}>Add Motorcycle</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 30,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  rideCardContainer: {
    marginBottom: 15,
  },
  rideCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  rideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rideLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  rideInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rideTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rideFrom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  rideTo: {
    fontSize: 14,
    color: '#666',
  },
  rideRight: {
    alignItems: 'flex-end',
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailsLink: {
    fontSize: 12,
    color: '#666',
  },
  motorcycleCardContainer: {
    marginBottom: 15,
  },
  motorcycleCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  motorcycleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  motorcycleInfo: {
    flex: 1,
  },
  motorcycleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  motorcycleDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    marginLeft: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addMotorcycleButton: {
    marginTop: 10,
  },
  addMotorcycleCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  addMotorcycleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addMotorcycleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Card, Button, Switch, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api.service';

export default function DriverScreen() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [penaltyStatus, setPenaltyStatus] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      // Load driver earnings
      const earningsData = await ApiService.getDriverEarnings();
      setEarnings(earningsData);

      // Load penalty status
      const penaltyData = await ApiService.getDriverPenaltyStatus();
      setPenaltyStatus(penaltyData);

      // Load ride requests
      const requests = await ApiService.getDriverRideRequests();
      setRideRequests(requests);
    } catch (error) {
      console.error('Failed to load driver data:', error);
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    try {
      await ApiService.setDriverAvailability(value);
      setIsAvailable(value);
      Alert.alert(
        'Availability Updated',
        `You are now ${value ? 'available' : 'unavailable'} for rides`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update availability');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      const result = await ApiService.acceptRide(rideId);
      setCurrentRide(result);
      Alert.alert('Ride Accepted', 'You have accepted the ride request');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept ride');
    }
  };

  const handleDeclineRide = async (rideId: string) => {
    Alert.alert(
      'Decline Ride',
      'Are you sure you want to decline this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.declineRide(rideId);
              Alert.alert('Ride Declined', 'You have declined the ride request');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline ride');
            }
          },
        },
      ]
    );
  };

  const handleStartRide = async (rideId: string) => {
    try {
      await ApiService.startRide(rideId);
      Alert.alert('Ride Started', 'You have started the ride');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    try {
      await ApiService.completeRide(rideId);
      setCurrentRide(null);
      Alert.alert('Ride Completed', 'You have completed the ride');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete ride');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
            </View>
            <MaterialIcons name="local-taxi" size={40} color="#2196F3" />
          </View>
        </Card.Content>
      </Card>

      {/* Availability Toggle */}
      <Card style={styles.availabilityCard}>
        <Card.Content>
          <View style={styles.availabilityHeader}>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityTitle}>Driver Status</Text>
              <Text style={styles.availabilitySubtitle}>
                {isAvailable ? 'You are available for rides' : 'You are offline'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              color="#2196F3"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Penalty Status */}
      {penaltyStatus && (
        <Card style={styles.penaltyCard}>
          <Card.Content>
            <View style={styles.penaltyHeader}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
              <Text style={styles.penaltyTitle}>Account Status</Text>
            </View>
            <Text style={styles.penaltyText}>
              Status: {penaltyStatus.status}
            </Text>
            <Text style={styles.penaltyText}>
              Rating: {penaltyStatus.rating}/5
            </Text>
            <Text style={styles.penaltyText}>
              Total Rides: {penaltyStatus.totalRides}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Earnings Summary */}
      {earnings && (
        <Card style={styles.earningsCard}>
          <Card.Content>
            <Text style={styles.earningsTitle}>Today's Earnings</Text>
            <Text style={styles.earningsAmount}>
              {earnings.currency} {earnings.totalEarnings.toFixed(2)}
            </Text>
            <View style={styles.earningsStats}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>{earnings.totalRides}</Text>
                <Text style={styles.earningsStatLabel}>Rides</Text>
              </View>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>
                  {earnings.averageEarningsPerRide.toFixed(2)}
                </Text>
                <Text style={styles.earningsStatLabel}>Avg/Ride</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Current Ride */}
      {currentRide && (
        <Card style={styles.currentRideCard}>
          <Card.Content>
            <Text style={styles.currentRideTitle}>Current Ride</Text>
            <Text style={styles.rideInfo}>
              From: {currentRide.pickupAddress}
            </Text>
            <Text style={styles.rideInfo}>
              To: {currentRide.destinationAddress}
            </Text>
            <Text style={styles.rideInfo}>
              Fare: {currentRide.fare} KSH
            </Text>
            <View style={styles.rideActions}>
              <Button
                mode="contained"
                onPress={() => handleStartRide(currentRide.id)}
                style={styles.actionButton}
              >
                Start Ride
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleCompleteRide(currentRide.id)}
                style={styles.actionButton}
              >
                Complete Ride
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Ride Requests */}
      <Card style={styles.requestsCard}>
        <Card.Content>
          <Text style={styles.requestsTitle}>Available Ride Requests</Text>
          {rideRequests.length === 0 ? (
            <Text style={styles.noRequestsText}>No ride requests available</Text>
          ) : (
            rideRequests.map((request: any) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestFrom}>
                    From: {request.pickupAddress}
                  </Text>
                  <Text style={styles.requestTo}>
                    To: {request.destinationAddress}
                  </Text>
                  <Text style={styles.requestFare}>
                    Fare: {request.fare} KSH
                  </Text>
                  <Text style={styles.requestDistance}>
                    Distance: {request.distance} km
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <Button
                    mode="contained"
                    onPress={() => handleAcceptRide(request.id)}
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  >
                    Accept
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleDeclineRide(request.id)}
                    style={styles.actionButton}
                  >
                    Decline
                  </Button>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 15,
    backgroundColor: '#2196F3',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  availabilityCard: {
    margin: 15,
    marginTop: 0,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  penaltyCard: {
    margin: 15,
    marginTop: 0,
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  penaltyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#FF9800',
  },
  penaltyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  earningsCard: {
    margin: 15,
    marginTop: 0,
    backgroundColor: '#e8f5e8',
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  earningsStat: {
    alignItems: 'center',
  },
  earningsStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  earningsStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  currentRideCard: {
    margin: 15,
    marginTop: 0,
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  rideInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  requestsCard: {
    margin: 15,
    marginTop: 0,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  noRequestsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  requestItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  requestInfo: {
    marginBottom: 15,
  },
  requestFrom: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  requestTo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  requestFare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  requestDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

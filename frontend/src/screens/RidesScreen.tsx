import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import CashPaymentConfirmation from '../components/CashPaymentConfirmation';
import { useAuth } from '../contexts/AuthContext';

export default function RidesScreen() {
  const [searchText, setSearchText] = useState('');
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const { user } = useAuth();

  const rideHistory = [
    {
      id: 1,
      date: 'Today, 2:30 PM',
      pickup: '123 Main St',
      destination: '456 Market St',
      cost: '1200 KSH',
      status: 'completed',
      paymentMethod: 'cash',
      isCashPayment: true,
      driverCashConfirm: true,
      riderCashConfirm: false,
      commissionDeducted: false,
    },
    {
      id: 2,
      date: 'Yesterday, 11:15 AM',
      pickup: '789 Park Ave',
      destination: '101 Tech Blvd',
      cost: '875 KSH',
      status: 'completed',
      paymentMethod: 'mpesa',
      isCashPayment: false,
    },
    {
      id: 3,
      date: 'May 15, 5:45 PM',
      pickup: '202 College St',
      destination: '303 Lake View Rd',
      cost: '1530 KSH',
      status: 'completed',
      paymentMethod: 'cash',
      isCashPayment: true,
      driverCashConfirm: true,
      riderCashConfirm: true,
      commissionDeducted: true,
    },
  ];

  const handleRidePress = (ride: any) => {
    // TODO: Navigate to ride details
    console.log('Ride pressed:', ride);
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    console.log('Download receipt');
  };

  const handleCashPaymentConfirmation = (ride: any) => {
    setSelectedRide(ride);
    setShowCashConfirmation(true);
  };

  const handleConfirmationComplete = (result: any) => {
    setShowCashConfirmation(false);
    setSelectedRide(null);
    // Refresh ride history or update UI
    console.log('Cash payment confirmation completed:', result);
  };

  const getCashPaymentStatus = (ride: any) => {
    if (!ride.isCashPayment) return null;
    
    if (ride.driverCashConfirm && ride.riderCashConfirm) {
      return { status: 'confirmed', text: '✅ Payment confirmed', color: '#4CAF50' };
    }
    
    if (ride.driverCashConfirm === false && ride.riderCashConfirm === false) {
      return { status: 'disputed', text: '⚠️ Dispute flagged', color: '#FF9800' };
    }
    
    if (ride.driverCashConfirm === true || ride.riderCashConfirm === true) {
      return { status: 'pending', text: '⏳ Waiting for confirmation', color: '#2196F3' };
    }
    
    return { status: 'waiting', text: '💳 Confirm cash payment', color: '#666' };
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.title}>Your Rides</Text>
        <Text style={styles.subtitle}>View your ride history</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rides"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Card */}
        <Card style={styles.receiptCard}>
          <Card.Content style={styles.receiptContent}>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptTitle}>May 2023 Receipt</Text>
              <Text style={styles.receiptSubtitle}>Download for your records</Text>
            </View>
            <Button
              mode="contained"
              style={styles.downloadButton}
              labelStyle={styles.downloadButtonText}
              onPress={handleDownloadReceipt}
            >
              Download
            </Button>
          </Card.Content>
        </Card>

        {/* Ride History */}
        {rideHistory.map((ride) => (
          <TouchableOpacity
            key={ride.id}
            onPress={() => handleRidePress(ride)}
            style={styles.rideCardContainer}
          >
            <Card style={styles.rideCard}>
              <Card.Content style={styles.rideContent}>
                <View style={styles.rideHeader}>
                  <View style={styles.rideDateContainer}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.rideDate}>{ride.date}</Text>
                  </View>
                  <View style={styles.rideCostContainer}>
                    <Text style={styles.rideCost}>{ride.cost}</Text>
                    <Text style={styles.paymentMethod}>
                      {ride.paymentMethod?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.rideRoute}>
                  {/* Pickup */}
                  <View style={styles.routePoint}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeAddress}>{ride.pickup}</Text>
                    </View>
                  </View>

                  {/* Connection Line */}
                  <View style={styles.routeLine} />

                  {/* Destination */}
                  <View style={styles.routePoint}>
                    <View style={styles.destinationDot} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Destination</Text>
                      <Text style={styles.routeAddress}>{ride.destination}</Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowContainer}>
                    <MaterialIcons name="chevron-right" size={24} color="#666" />
                  </View>
                </View>

                {/* Cash Payment Status */}
                {ride.isCashPayment && (
                  <View style={styles.cashPaymentContainer}>
                    {(() => {
                      const cashStatus = getCashPaymentStatus(ride);
                      if (!cashStatus) return null;
                      
                      return (
                        <View style={styles.cashPaymentStatus}>
                          <Text style={[styles.cashPaymentText, { color: cashStatus.color }]}>
                            {cashStatus.text}
                          </Text>
                          {cashStatus.status === 'waiting' && (
                            <TouchableOpacity
                              style={styles.confirmButton}
                              onPress={() => handleCashPaymentConfirmation(ride)}
                            >
                              <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                )}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cash Payment Confirmation Modal */}
      {selectedRide && (
        <CashPaymentConfirmation
          visible={showCashConfirmation}
          rideId={selectedRide.id}
          fare={parseFloat(selectedRide.cost.replace(' KSH', ''))}
          currency="KSH"
          userType={user?.role === 'Driver' ? 'driver' : 'rider'}
          onClose={() => {
            setShowCashConfirmation(false);
            setSelectedRide(null);
          }}
          onConfirmationComplete={handleConfirmationComplete}
        />
      )}
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  filterButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  receiptCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 20,
  },
  receiptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  downloadButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rideCardContainer: {
    marginBottom: 15,
  },
  rideCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  rideContent: {
    padding: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  rideCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rideRoute: {
    position: 'relative',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
    marginTop: 4,
    marginRight: 12,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
    marginTop: 4,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  routeLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: 20,
    backgroundColor: '#ccc',
  },
  arrowContainer: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  rideCostContainer: {
    alignItems: 'flex-end',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cashPaymentContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cashPaymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cashPaymentText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

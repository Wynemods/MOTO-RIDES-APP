import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api.service';

interface EdgeCaseHandlerProps {
  rideId: string;
  rideStatus: string;
  onStatusChange: (status: string) => void;
  onAction: (action: string, data?: any) => void;
}

export default function EdgeCaseHandler({
  rideId,
  rideStatus,
  onStatusChange,
  onAction,
}: EdgeCaseHandlerProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [emergencyType, setEmergencyType] = useState<'police' | 'helpline' | 'admin'>('helpline');

  const handleNoDriverFound = async () => {
    try {
      const response = await ApiService.retryDriverSearch(rideId);
      if (response.status === 'searching') {
        onStatusChange('searching');
        Alert.alert('Searching...', 'Looking for available drivers...');
      } else {
        Alert.alert('No Drivers', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retry driver search');
    }
  };

  const handleCancelRide = async () => {
    try {
      const response = await ApiService.cancelRide(rideId, cancelReason);
      onStatusChange('cancelled');
      Alert.alert('Ride Cancelled', response.message);
      setShowCancelModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel ride');
    }
  };

  const handleDriverCancel = async () => {
    try {
      const response = await ApiService.driverCancelRide(rideId, cancelReason);
      onStatusChange('cancelled_by_driver');
      Alert.alert('Ride Cancelled', response.message);
      setShowCancelModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel ride');
    }
  };

  const handleNoShow = async () => {
    Alert.alert(
      'Report No Show',
      'Are you sure the passenger did not show up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async () => {
            try {
              const response = await ApiService.reportNoShow(rideId);
              onStatusChange('no_show');
              Alert.alert('No Show Reported', response.message);
            } catch (error) {
              Alert.alert('Error', 'Failed to report no show');
            }
          },
        },
      ]
    );
  };

  const handleEmergency = async () => {
    try {
      const response = await ApiService.reportEmergency(rideId, emergencyType);
      Alert.alert('Emergency Reported', response.message);
      setShowEmergencyModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to report emergency');
    }
  };

  const handlePaymentFailure = async () => {
    Alert.alert(
      'Payment Failed',
      'Your payment could not be processed. Please try a different payment method or pay with cash.',
      [
        { text: 'Try Again', onPress: () => onAction('retry_payment') },
        { text: 'Pay Cash', onPress: () => onAction('pay_cash') },
      ]
    );
  };

  const handleFareDispute = async () => {
    try {
      const breakdown = await ApiService.getFareBreakdown(rideId);
      Alert.alert(
        'Fare Breakdown',
        `Distance: ${breakdown.distance} km\nRate: ${breakdown.breakdown.ratePerKm} KSH/km\nTotal: ${breakdown.fare} KSH`,
        [
          { text: 'OK' },
          { text: 'Report Issue', onPress: () => onAction('report_fare_issue') },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get fare breakdown');
    }
  };

  const renderEdgeCaseActions = () => {
    switch (rideStatus) {
      case 'no_drivers':
        return (
          <Card style={styles.edgeCaseCard}>
            <Card.Content>
              <View style={styles.edgeCaseHeader}>
                <MaterialIcons name="warning" size={24} color="#FF9800" />
                <Text style={styles.edgeCaseTitle}>No Drivers Available</Text>
              </View>
              <Text style={styles.edgeCaseMessage}>
                No drivers available at the moment. Please try again later.
              </Text>
              <Button
                mode="contained"
                onPress={handleNoDriverFound}
                style={styles.edgeCaseButton}
              >
                Retry Search
              </Button>
            </Card.Content>
          </Card>
        );

      case 'payment_failed':
        return (
          <Card style={styles.edgeCaseCard}>
            <Card.Content>
              <View style={styles.edgeCaseHeader}>
                <MaterialIcons name="error" size={24} color="#F44336" />
                <Text style={styles.edgeCaseTitle}>Payment Failed</Text>
              </View>
              <Text style={styles.edgeCaseMessage}>
                Your payment could not be processed.
              </Text>
              <View style={styles.edgeCaseActions}>
                <Button
                  mode="outlined"
                  onPress={() => onAction('retry_payment')}
                  style={styles.edgeCaseButton}
                >
                  Retry Payment
                </Button>
                <Button
                  mode="contained"
                  onPress={() => onAction('pay_cash')}
                  style={styles.edgeCaseButton}
                >
                  Pay Cash
                </Button>
              </View>
            </Card.Content>
          </Card>
        );

      case 'pending':
        return (
          <View style={styles.edgeCaseActions}>
            <Button
              mode="outlined"
              onPress={() => setShowCancelModal(true)}
              style={styles.edgeCaseButton}
            >
              Cancel Ride
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowEmergencyModal(true)}
              style={styles.edgeCaseButton}
            >
              Emergency
            </Button>
          </View>
        );

      case 'accepted':
        return (
          <View style={styles.edgeCaseActions}>
            <Button
              mode="outlined"
              onPress={() => setShowCancelModal(true)}
              style={styles.edgeCaseButton}
            >
              Cancel Ride
            </Button>
            <Button
              mode="outlined"
              onPress={handleFareDispute}
              style={styles.edgeCaseButton}
            >
              Fare Dispute
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowEmergencyModal(true)}
              style={styles.edgeCaseButton}
            >
              Emergency
            </Button>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderEdgeCaseActions()}

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalTitle}>Cancel Ride</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowCancelModal(false)}
                  style={styles.modalButton}
                >
                  Keep Ride
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCancelRide}
                  style={styles.modalButton}
                >
                  Cancel Ride
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* Emergency Modal */}
      <Modal visible={showEmergencyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalTitle}>Emergency</Text>
              <Text style={styles.emergencyText}>
                Select the type of emergency:
              </Text>
              <View style={styles.emergencyOptions}>
                <TouchableOpacity
                  style={[
                    styles.emergencyOption,
                    emergencyType === 'police' && styles.emergencyOptionSelected,
                  ]}
                  onPress={() => setEmergencyType('police')}
                >
                  <MaterialIcons name="local-police" size={24} color="#F44336" />
                  <Text style={styles.emergencyOptionText}>Police (999)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.emergencyOption,
                    emergencyType === 'helpline' && styles.emergencyOptionSelected,
                  ]}
                  onPress={() => setEmergencyType('helpline')}
                >
                  <MaterialIcons name="phone" size={24} color="#2196F3" />
                  <Text style={styles.emergencyOptionText}>Safety Helpline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.emergencyOption,
                    emergencyType === 'admin' && styles.emergencyOptionSelected,
                  ]}
                  onPress={() => setEmergencyType('admin')}
                >
                  <MaterialIcons name="support-agent" size={24} color="#4CAF50" />
                  <Text style={styles.emergencyOptionText}>MOTO Support</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEmergencyModal(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleEmergency}
                  style={styles.modalButton}
                >
                  Report Emergency
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  edgeCaseCard: {
    margin: 10,
    backgroundColor: '#fff',
    elevation: 3,
  },
  edgeCaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  edgeCaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  edgeCaseMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  edgeCaseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  edgeCaseButton: {
    margin: 5,
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  emergencyText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  emergencyOptions: {
    marginBottom: 20,
  },
  emergencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  emergencyOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  emergencyOptionText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

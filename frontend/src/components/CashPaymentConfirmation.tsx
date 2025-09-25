import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api.service';

const { width, height } = Dimensions.get('window');

interface CashPaymentConfirmationProps {
  visible: boolean;
  rideId: string;
  fare: number;
  currency: string;
  userType: 'driver' | 'rider';
  onClose: () => void;
  onConfirmationComplete: (result: any) => void;
}

export default function CashPaymentConfirmation({
  visible,
  rideId,
  fare,
  currency,
  userType,
  onClose,
  onConfirmationComplete,
}: CashPaymentConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible && rideId) {
      loadPaymentStatus();
    }
  }, [visible, rideId]);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const status = await ApiService.getCashPaymentStatus(rideId);
      setPaymentStatus(status);
      
      // Set the confirmed state based on user type
      if (userType === 'driver') {
        setConfirmed(status.driverConfirmed);
      } else {
        setConfirmed(status.riderConfirmed);
      }
    } catch (error) {
      console.error('Failed to load payment status:', error);
      Alert.alert('Error', 'Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (confirmed: boolean) => {
    try {
      setLoading(true);
      
      let result;
      if (userType === 'driver') {
        result = await ApiService.confirmCashPaymentDriver(rideId, confirmed);
      } else {
        result = await ApiService.confirmCashPaymentRider(rideId, confirmed);
      }

      setConfirmed(confirmed);
      setPaymentStatus(result);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        onConfirmationComplete(result);
      } else if (result.disputeFlagged) {
        Alert.alert('Dispute Flagged', result.message);
        onConfirmationComplete(result);
      } else {
        Alert.alert('Confirmation Sent', result.message);
      }
    } catch (error: any) {
      console.error('Failed to confirm payment:', error);
      Alert.alert('Error', error.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!paymentStatus) return 'Loading...';
    
    if (paymentStatus.bothConfirmed) {
      return '✅ Payment confirmed by both parties';
    }
    
    if (paymentStatus.disputeFlagged) {
      return '⚠️ Payment dispute flagged for admin review';
    }
    
    if (confirmed === true) {
      return `✅ You confirmed payment. Waiting for ${userType === 'driver' ? 'rider' : 'driver'} confirmation.`;
    }
    
    if (confirmed === false) {
      return `❌ You denied payment. Waiting for ${userType === 'driver' ? 'rider' : 'driver'} response.`;
    }
    
    return 'Please confirm if cash payment was received';
  };

  const getStatusColor = () => {
    if (!paymentStatus) return '#666';
    
    if (paymentStatus.bothConfirmed) return '#4CAF50';
    if (paymentStatus.disputeFlagged) return '#FF9800';
    if (confirmed === true) return '#2196F3';
    if (confirmed === false) return '#F44336';
    
    return '#666';
  };

  const canConfirm = confirmed === null && !paymentStatus?.bothConfirmed && !paymentStatus?.disputeFlagged;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <MaterialIcons 
                  name="payment" 
                  size={32} 
                  color="#4CAF50" 
                />
                <Text style={styles.title}>Cash Payment Confirmation</Text>
              </View>

              {/* Fare Display */}
              <View style={styles.fareContainer}>
                <Text style={styles.fareLabel}>Ride Fare</Text>
                <Text style={styles.fareAmount}>
                  {fare} {currency}
                </Text>
              </View>

              {/* Status Message */}
              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusMessage()}
                </Text>
              </View>

              {/* Commission Info */}
              {paymentStatus?.commissionDeducted && (
                <View style={styles.commissionContainer}>
                  <Text style={styles.commissionText}>
                    💰 Commission deducted: {paymentStatus.commissionAmount} {currency}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              {canConfirm && (
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={[styles.button, styles.confirmButton]}
                    labelStyle={styles.buttonText}
                    onPress={() => handleConfirmPayment(true)}
                    disabled={loading}
                    loading={loading}
                  >
                    ✅ Confirm Payment Received
                  </Button>
                  
                  <Button
                    mode="outlined"
                    style={[styles.button, styles.denyButton]}
                    labelStyle={[styles.buttonText, styles.denyButtonText]}
                    onPress={() => handleConfirmPayment(false)}
                    disabled={loading}
                  >
                    ❌ Deny Payment
                  </Button>
                </View>
              )}

              {/* Close Button */}
              <Button
                mode="text"
                style={styles.closeButton}
                labelStyle={styles.closeButtonText}
                onPress={onClose}
              >
                Close
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  card: {
    borderRadius: 16,
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  fareContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  commissionContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  commissionText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    borderColor: '#F44336',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  denyButtonText: {
    color: '#F44336',
  },
  closeButton: {
    marginTop: 8,
  },
  closeButtonText: {
    color: '#666',
  },
});

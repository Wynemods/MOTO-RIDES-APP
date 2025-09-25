import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api.service';

interface FinePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  fineAmount?: number;
  currency?: string;
}

export default function FinePaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  fineAmount = 200,
  currency = 'KSH',
}: FinePaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'mpesa' | 'card' | 'wallet'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fineStatus, setFineStatus] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadFineStatus();
    }
  }, [visible]);

  const loadFineStatus = async () => {
    try {
      const status = await ApiService.getFineStatus();
      setFineStatus(status);
    } catch (error) {
      console.error('Failed to load fine status:', error);
    }
  };

  const handlePayment = async () => {
    if (!fineStatus?.hasActiveFine) {
      Alert.alert('No Fine', 'You do not have any active fine to pay.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ApiService.payFine(selectedMethod);
      
      if (result.success) {
        Alert.alert('Payment Successful', result.message);
        onPaymentSuccess();
        onClose();
      } else {
        Alert.alert('Payment Failed', result.message);
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: 'phone-android',
      description: 'Pay via M-Pesa',
      color: '#00A86B',
    },
    {
      id: 'card',
      name: 'Card',
      icon: 'credit-card',
      description: 'Pay with card',
      color: '#2196F3',
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: 'account-balance-wallet',
      description: 'Pay from wallet',
      color: '#FF9800',
    },
    {
      id: 'cash',
      name: 'Cash',
      icon: 'money',
      description: 'Pay with cash',
      color: '#4CAF50',
    },
  ];

  if (!fineStatus) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card.Content>
              {/* Header */}
              <View style={styles.header}>
                <MaterialIcons name="warning" size={32} color="#FF9800" />
                <Text style={styles.title}>Cancellation Fine</Text>
              </View>

              {/* Fine Details */}
              <View style={styles.fineDetails}>
                <Text style={styles.fineAmount}>
                  {fineStatus.fineAmount} {fineStatus.currency}
                </Text>
                <Text style={styles.fineDescription}>
                  You have exceeded the free cancellation limit ({fineStatus.cancellationCount} cancellations).
                  Please pay this fine to continue using MOTO Rides.
                </Text>
              </View>

              {/* Cancellation Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Cancellations</Text>
                  <Text style={styles.statValue}>{fineStatus.cancellationCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Free Cancellations Used</Text>
                  <Text style={styles.statValue}>
                    {fineStatus.cancellationCount - fineStatus.remainingFree}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Remaining Free</Text>
                  <Text style={styles.statValue}>{fineStatus.remainingFree}</Text>
                </View>
              </View>

              {/* Payment Method Selection */}
              <View style={styles.paymentMethodsContainer}>
                <Text style={styles.sectionTitle}>Select Payment Method</Text>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodOption,
                      selectedMethod === method.id && styles.paymentMethodSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id as any)}
                  >
                    <View style={styles.paymentMethodContent}>
                      <MaterialIcons
                        name={method.icon as any}
                        size={24}
                        color={selectedMethod === method.id ? method.color : '#666'}
                      />
                      <View style={styles.paymentMethodInfo}>
                        <Text
                          style={[
                            styles.paymentMethodName,
                            selectedMethod === method.id && styles.paymentMethodNameSelected,
                          ]}
                        >
                          {method.name}
                        </Text>
                        <Text style={styles.paymentMethodDescription}>
                          {method.description}
                        </Text>
                      </View>
                      {selectedMethod === method.id && (
                        <MaterialIcons name="check-circle" size={20} color={method.color} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Button */}
              <Button
                mode="contained"
                onPress={handlePayment}
                loading={isProcessing}
                disabled={isProcessing || !fineStatus.hasActiveFine}
                style={styles.payButton}
                labelStyle={styles.payButtonText}
              >
                {isProcessing ? 'Processing...' : `Pay ${fineStatus.fineAmount} ${fineStatus.currency}`}
              </Button>

              {/* Cancel Button */}
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.cancelButton}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              {/* Info Text */}
              <Text style={styles.infoText}>
                After payment, you will be able to request rides again. Free cancellations reset after payment.
              </Text>
            </Card.Content>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  fineDetails: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
  },
  fineAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 10,
  },
  fineDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  paymentMethodOption: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  paymentMethodSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 15,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: '#4CAF50',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    marginBottom: 10,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginBottom: 15,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

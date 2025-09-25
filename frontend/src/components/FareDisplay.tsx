import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface FareDisplayProps {
  fare: {
    distance: number;
    baseFare: number;
    finalFare: number;
    currency: string;
    breakdown: {
      distanceKm: number;
      ratePerKm: number;
      baseAmount: number;
      rideTypeMultiplier: number;
      total: number;
    };
  };
  rideType: string;
  onRideTypeChange: (type: string) => void;
  onConfirm: () => void;
  isCalculating?: boolean;
  disabled?: boolean;
}

export default function FareDisplay({
  fare,
  rideType,
  onRideTypeChange,
  onConfirm,
  isCalculating = false,
  disabled = false,
}: FareDisplayProps) {
  const rideTypes = [
    { type: 'bike', name: 'Motorcycle', multiplier: 1.0, icon: 'motorcycle' },
    { type: 'car', name: 'Car', multiplier: 1.5, icon: 'directions-car' },
    { type: 'premium', name: 'Premium', multiplier: 2.0, icon: 'star' },
  ];

  const getRideTypeFare = (type: string) => {
    const selectedType = rideTypes.find(t => t.type === type);
    if (!selectedType) return fare.finalFare;
    return Math.round(fare.baseFare * selectedType.multiplier);
  };

  return (
    <Card style={styles.fareCard}>
      <Card.Content>
        {/* Main Fare Display */}
        <View style={styles.mainFareContainer}>
          <View style={styles.fareHeader}>
            <MaterialIcons name="attach-money" size={24} color="#4CAF50" />
            <Text style={styles.fareLabel}>Estimated Fare</Text>
          </View>
          
          <View style={styles.fareAmountContainer}>
            <Text style={styles.fareAmount}>
              {isCalculating ? 'Calculating...' : `${getRideTypeFare(rideType)} ${fare.currency}`}
            </Text>
            <Text style={styles.fareDistance}>
              {fare.distance.toFixed(1)} km • {fare.breakdown.ratePerKm} {fare.currency}/km
            </Text>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Distance:</Text>
            <Text style={styles.breakdownValue}>{fare.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Rate:</Text>
            <Text style={styles.breakdownValue}>{fare.breakdown.ratePerKm} {fare.currency}/km</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Amount:</Text>
            <Text style={styles.breakdownValue}>{fare.baseFare} {fare.currency}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Ride Type:</Text>
            <Text style={styles.breakdownValue}>
              {rideTypes.find(t => t.type === rideType)?.name} (×{rideTypes.find(t => t.type === rideType)?.multiplier})
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{getRideTypeFare(rideType)} {fare.currency}</Text>
          </View>
        </View>

        {/* Ride Type Selection */}
        <View style={styles.rideTypeContainer}>
          <Text style={styles.rideTypeLabel}>Choose Your Ride</Text>
          <View style={styles.rideTypeOptions}>
            {rideTypes.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.rideTypeOption,
                  rideType === type.type && styles.rideTypeOptionSelected
                ]}
                onPress={() => onRideTypeChange(type.type)}
              >
                <MaterialIcons 
                  name={type.icon as any} 
                  size={20} 
                  color={rideType === type.type ? '#4CAF50' : '#666'} 
                />
                <Text style={[
                  styles.rideTypeText,
                  rideType === type.type && styles.rideTypeTextSelected
                ]}>
                  {type.name}
                </Text>
                <Text style={styles.rideTypeFare}>
                  {Math.round(fare.baseFare * type.multiplier)} {fare.currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeContainer}>
          <MaterialIcons name="info" size={16} color="#2196F3" />
          <Text style={styles.noticeText}>
            This is your final fare. No hidden charges. Payment due upon ride completion.
          </Text>
        </View>

        {/* Confirm Button */}
        <Button
          mode="contained"
          onPress={onConfirm}
          disabled={disabled || isCalculating}
          loading={isCalculating}
          style={styles.confirmButton}
          labelStyle={styles.confirmButtonText}
        >
          {isCalculating ? 'Calculating Fare...' : `Confirm Ride - ${getRideTypeFare(rideType)} ${fare.currency}`}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  fareCard: {
    margin: 15,
    backgroundColor: '#fff',
    elevation: 4,
    borderRadius: 12,
  },
  mainFareContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  fareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  fareAmountContainer: {
    alignItems: 'center',
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  fareDistance: {
    fontSize: 14,
    color: '#666',
  },
  breakdownContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rideTypeContainer: {
    marginBottom: 15,
  },
  rideTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  rideTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideTypeOption: {
    flex: 1,
    padding: 15,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  rideTypeOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  rideTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
    color: '#666',
  },
  rideTypeTextSelected: {
    color: '#4CAF50',
  },
  rideTypeFare: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  noticeText: {
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

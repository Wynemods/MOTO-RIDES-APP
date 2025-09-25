import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface RideOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  multiplier: number;
  estimatedArrival: string;
  fare: number;
  currency: string;
}

interface RideOptionsProps {
  options: RideOption[];
  selectedType: string;
  onSelect: (type: string) => void;
  baseFare: number;
}

export default function RideOptions({
  options,
  selectedType,
  onSelect,
  baseFare,
}: RideOptionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Ride</Text>
      <Text style={styles.subtitle}>Select your preferred ride option</Text>
      
      {options.map((option) => (
        <TouchableOpacity
          key={option.type}
          style={[
            styles.optionCard,
            selectedType === option.type && styles.optionCardSelected
          ]}
          onPress={() => onSelect(option.type)}
        >
          <Card style={[
            styles.card,
            selectedType === option.type && styles.cardSelected
          ]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.optionHeader}>
                <View style={styles.iconContainer}>
                  <MaterialIcons 
                    name={option.icon as any} 
                    size={24} 
                    color={selectedType === option.type ? '#4CAF50' : '#666'} 
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[
                    styles.optionName,
                    selectedType === option.type && styles.optionNameSelected
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                <View style={styles.fareContainer}>
                  <Text style={[
                    styles.fareAmount,
                    selectedType === option.type && styles.fareAmountSelected
                  ]}>
                    {Math.round(baseFare * option.multiplier)} KSH
                  </Text>
                  <Text style={styles.arrivalTime}>
                    {option.estimatedArrival}
                  </Text>
                </View>
              </View>
              
              {selectedType === option.type && (
                <View style={styles.selectedIndicator}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  optionCard: {
    marginBottom: 10,
  },
  optionCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  cardSelected: {
    elevation: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardContent: {
    padding: 15,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionNameSelected: {
    color: '#4CAF50',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fareAmountSelected: {
    color: '#4CAF50',
  },
  arrivalTime: {
    fontSize: 12,
    color: '#666',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 5,
    fontWeight: '500',
  },
});

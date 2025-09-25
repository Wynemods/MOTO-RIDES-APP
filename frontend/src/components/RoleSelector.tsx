import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface RoleSelectorProps {
  selectedRole: 'rider' | 'driver' | null;
  onRoleSelect: (role: 'rider' | 'driver') => void;
  disabled?: boolean;
}

export default function RoleSelector({ selectedRole, onRoleSelect, disabled = false }: RoleSelectorProps) {
  const roles = [
    {
      id: 'rider',
      title: 'Rider',
      description: 'Request rides and travel',
      icon: 'person',
      color: '#4CAF50',
      features: [
        'Request rides from point A to B',
        'See fare upfront (60 KSH/km)',
        'View nearest driver and ETA',
        'Pay via M-Pesa, Cash, Wallet, or Card',
        'Cancel ride (with fine system)',
        'Rate driver after ride'
      ]
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'Provide rides and earn money',
      icon: 'local-taxi',
      color: '#2196F3',
      features: [
        'Receive ride requests from passengers',
        'Accept or decline ride requests',
        'Navigate to pickup and destination',
        'Track earnings and completed rides',
        'Rate passengers after ride',
        'Driver penalty rules for cancellations'
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Role</Text>
      <Text style={styles.subtitle}>Select how you want to use MOTO Rides</Text>
      
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.roleCardSelected,
              disabled && styles.roleCardDisabled,
            ]}
            onPress={() => !disabled && onRoleSelect(role.id as 'rider' | 'driver')}
            disabled={disabled}
          >
            <Card style={[
              styles.card,
              selectedRole === role.id && styles.cardSelected,
            ]}>
              <Card.Content>
                <View style={styles.roleHeader}>
                  <MaterialIcons
                    name={role.icon as any}
                    size={32}
                    color={selectedRole === role.id ? role.color : '#666'}
                  />
                  <View style={styles.roleInfo}>
                    <Text style={[
                      styles.roleTitle,
                      selectedRole === role.id && styles.roleTitleSelected,
                    ]}>
                      {role.title}
                    </Text>
                    <Text style={styles.roleDescription}>
                      {role.description}
                    </Text>
                  </View>
                  {selectedRole === role.id && (
                    <MaterialIcons name="check-circle" size={24} color={role.color} />
                  )}
                </View>
                
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Features:</Text>
                  {role.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <MaterialIcons name="check" size={16} color={role.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedRole && (
        <Button
          mode="contained"
          onPress={() => {}} // This would be handled by parent component
          style={[styles.continueButton, { backgroundColor: roles.find(r => r.id === selectedRole)?.color }]}
          disabled={disabled}
        >
          Continue as {selectedRole === 'rider' ? 'Rider' : 'Driver'}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  rolesContainer: {
    flex: 1,
  },
  roleCard: {
    marginBottom: 20,
  },
  roleCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  roleCardDisabled: {
    opacity: 0.6,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  cardSelected: {
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  roleTitleSelected: {
    color: '#4CAF50',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  continueButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

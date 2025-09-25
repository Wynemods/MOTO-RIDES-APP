import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Switch, Chip, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api.service';

interface RoleSwitchProps {
  onRoleChange?: (newRole: 'rider' | 'driver') => void;
  onVerificationRequired?: () => void;
  onDriverRegistration?: () => void;
  onDriverProfile?: () => void;
  compact?: boolean;
}

export default function RoleSwitch({ onRoleChange, onVerificationRequired, onDriverRegistration, onDriverProfile, compact = false }: RoleSwitchProps) {
  const [currentRole, setCurrentRole] = useState<'rider' | 'driver'>('rider');
  const [availableRoles, setAvailableRoles] = useState<('rider' | 'driver')[]>(['rider']);
  const [isSwitching, setIsSwitching] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    loadRoleStatus();
  }, []);

  const loadRoleStatus = async () => {
    try {
      const status = await ApiService.getRoleStatus();
      setCurrentRole(status.activeRole);
      setAvailableRoles(status.availableRoles);
      
      // Load verification status if user has driver role
      if (status.availableRoles.includes('driver')) {
        const verification = await ApiService.getDriverVerificationStatus();
        setVerificationStatus(verification);
      }
    } catch (error) {
      console.error('Failed to load role status:', error);
    }
  };

  const handleRoleSwitch = async (newRole: 'rider' | 'driver') => {
    if (isSwitching || currentRole === newRole) return;

    if (!availableRoles.includes(newRole)) {
      Alert.alert(
        'Role Not Available',
        `You don't have access to ${newRole} mode. Please complete your ${newRole} registration first.`
      );
      return;
    }

    // Check driver verification for driver mode
    if (newRole === 'driver' && verificationStatus && !verificationStatus.verified) {
      Alert.alert(
        'Driver Verification Required',
        'You must complete driver verification before switching to Driver Mode. Would you like to start the verification process?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Verification', 
            onPress: () => onVerificationRequired?.(),
          },
        ]
      );
      return;
    }

    setIsSwitching(true);
    try {
      const result = await ApiService.switchRole(newRole);
      
      if (result.success) {
        setCurrentRole(newRole);
        onRoleChange?.(newRole);
        Alert.alert('Mode Switched', result.message);
      } else {
        Alert.alert('Switch Failed', result.message);
      }
    } catch (error: any) {
      Alert.alert('Switch Error', error.message || 'Failed to switch mode');
    } finally {
      setIsSwitching(false);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[
            styles.compactSwitch,
            currentRole === 'rider' && styles.compactSwitchActive,
          ]}
          onPress={() => handleRoleSwitch('rider')}
          disabled={isSwitching || !availableRoles.includes('rider')}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={currentRole === 'rider' ? '#fff' : '#666'}
          />
          <Text style={[
            styles.compactText,
            currentRole === 'rider' && styles.compactTextActive,
          ]}>
            Rider
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.compactSwitch,
            currentRole === 'driver' && styles.compactSwitchActive,
          ]}
          onPress={() => handleRoleSwitch('driver')}
          disabled={isSwitching || !availableRoles.includes('driver')}
        >
          <MaterialIcons
            name="local-taxi"
            size={20}
            color={currentRole === 'driver' ? '#fff' : '#666'}
          />
          <Text style={[
            styles.compactText,
            currentRole === 'driver' && styles.compactTextActive,
          ]}>
            Driver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialIcons name="swap-horiz" size={24} color="#2196F3" />
          <Text style={styles.title}>Switch Mode</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Choose how you want to use MOTO Rides
        </Text>

        <View style={styles.roleContainer}>
          {/* Rider Mode */}
          <TouchableOpacity
            style={[
              styles.roleOption,
              currentRole === 'rider' && styles.roleOptionActive,
              !availableRoles.includes('rider') && styles.roleOptionDisabled,
            ]}
            onPress={() => handleRoleSwitch('rider')}
            disabled={isSwitching || !availableRoles.includes('rider')}
          >
            <View style={styles.roleContent}>
              <MaterialIcons
                name="person"
                size={32}
                color={currentRole === 'rider' ? '#4CAF50' : '#666'}
              />
              <View style={styles.roleInfo}>
                <Text style={[
                  styles.roleTitle,
                  currentRole === 'rider' && styles.roleTitleActive,
                ]}>
                  Rider Mode
                </Text>
                <Text style={styles.roleDescription}>
                  Request rides and travel
                </Text>
              </View>
              {currentRole === 'rider' && (
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              )}
            </View>
          </TouchableOpacity>

          {/* Driver Mode */}
          <TouchableOpacity
            style={[
              styles.roleOption,
              currentRole === 'driver' && styles.roleOptionActive,
              !availableRoles.includes('driver') && styles.roleOptionDisabled,
            ]}
            onPress={() => handleRoleSwitch('driver')}
            disabled={isSwitching || !availableRoles.includes('driver')}
          >
            <View style={styles.roleContent}>
              <MaterialIcons
                name="local-taxi"
                size={32}
                color={currentRole === 'driver' ? '#2196F3' : '#666'}
              />
              <View style={styles.roleInfo}>
                <Text style={[
                  styles.roleTitle,
                  currentRole === 'driver' && styles.roleTitleActive,
                ]}>
                  Driver Mode
                </Text>
                <Text style={styles.roleDescription}>
                  Provide rides and earn money
                </Text>
              </View>
              {currentRole === 'driver' && (
                <MaterialIcons name="check-circle" size={24} color="#2196F3" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Verification Status */}
        {verificationStatus && (
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationTitle}>Driver Verification Status:</Text>
            <View style={[
              styles.verificationStatus,
              verificationStatus.verified ? styles.verificationApproved : styles.verificationPending,
            ]}>
              <MaterialIcons
                name={verificationStatus.verified ? 'check-circle' : 'pending'}
                size={20}
                color={verificationStatus.verified ? '#4CAF50' : '#FF9800'}
              />
              <Text style={[
                styles.verificationText,
                verificationStatus.verified ? styles.verificationTextApproved : styles.verificationTextPending,
              ]}>
                {verificationStatus.verified ? 'Verified' : verificationStatus.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {!verificationStatus.verified && (
              <Button
                mode="outlined"
                onPress={() => onVerificationRequired?.()}
                style={styles.verificationButton}
                compact
              >
                Complete Verification
              </Button>
            )}
          </View>
        )}

        {/* Driver Actions */}
        {currentRole === 'driver' && availableRoles.includes('driver') && (
          <View style={styles.driverActionsContainer}>
            <Text style={styles.driverActionsTitle}>Driver Actions:</Text>
            <View style={styles.driverActionsButtons}>
              <Button
                mode="outlined"
                onPress={() => onDriverRegistration?.()}
                style={styles.driverActionButton}
                icon="account-plus"
                compact
              >
                Register as Driver
              </Button>
              <Button
                mode="outlined"
                onPress={() => onDriverProfile?.()}
                style={styles.driverActionButton}
                icon="account-edit"
                compact
              >
                Profile Settings
              </Button>
            </View>
          </View>
        )}

        {/* Role Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Available Modes:</Text>
          <View style={styles.chipContainer}>
            {availableRoles.map((role) => (
              <Chip
                key={role}
                mode="outlined"
                selected={currentRole === role}
                disabled={role === 'driver' && verificationStatus && !verificationStatus.verified}
                style={[
                  styles.chip,
                  currentRole === role && styles.chipSelected,
                  role === 'driver' && verificationStatus && !verificationStatus.verified && styles.chipDisabled,
                ]}
                textStyle={[
                  styles.chipText,
                  currentRole === role && styles.chipTextSelected,
                  role === 'driver' && verificationStatus && !verificationStatus.verified && styles.chipTextDisabled,
                ]}
              >
                {role === 'rider' ? 'Rider' : 'Driver'}
                {role === 'driver' && verificationStatus && !verificationStatus.verified && ' (Verification Required)'}
              </Chip>
            ))}
          </View>
        </View>

        {isSwitching && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Switching mode...</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 2,
  },
  compactSwitch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  compactSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#666',
  },
  compactTextActive: {
    color: '#fff',
  },

  // Full card styles
  card: {
    margin: 15,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleOption: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  roleOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  roleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleTitleActive: {
    color: '#4CAF50',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginTop: 10,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#fff',
  },
  driverActionsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  driverActionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  driverActionsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverActionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Verification styles
  verificationContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  verificationApproved: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
  },
  verificationPending: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 6,
  },
  verificationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  verificationTextApproved: {
    color: '#4CAF50',
  },
  verificationTextPending: {
    color: '#FF9800',
  },
  verificationButton: {
    marginTop: 5,
  },
  chipDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  chipTextDisabled: {
    color: '#999',
  },
});

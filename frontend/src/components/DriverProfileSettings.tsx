import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Picker
} from 'react-native';
import { apiService } from '../services/api.service';

interface Vehicle {
  id: string;
  type: 'motorcycle' | 'car' | 'lorry';
  brand: string;
  model: string;
  color: string;
  numberPlate: string;
  year?: number;
  insuranceDocUrl?: string;
  isVerified: boolean;
}

interface DriverProfile {
  id: string;
  name: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  licenseNumber: string;
  governmentId?: string;
  isVerified: boolean;
  vehicles: Vehicle[];
}

interface DriverProfileSettingsProps {
  onBack: () => void;
}

export const DriverProfileSettings: React.FC<DriverProfileSettingsProps> = ({
  onBack
}) => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    phoneNumber: '',
    profilePictureUrl: ''
  });

  const [vehicleData, setVehicleData] = useState({
    type: 'motorcycle' as 'motorcycle' | 'car' | 'lorry',
    brand: '',
    model: '',
    color: '',
    numberPlate: '',
    year: new Date().getFullYear(),
    insuranceDocUrl: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDriverProfile();
      setProfile(response);
      setProfileData({
        name: response.name,
        phoneNumber: response.phoneNumber,
        profilePictureUrl: response.profilePictureUrl || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      await apiService.updateDriverProfile(profileData);
      Alert.alert('Success', 'Profile updated successfully');
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleVehicleUpdate = async (vehicleId: string) => {
    try {
      setSaving(true);
      await apiService.updateVehicle(vehicleId, vehicleData);
      Alert.alert('Success', 'Vehicle updated successfully');
      setEditingVehicle(null);
      loadProfile();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async () => {
    try {
      setSaving(true);
      await apiService.addVehicle(vehicleData);
      Alert.alert('Success', 'Vehicle added successfully');
      setShowAddVehicle(false);
      setVehicleData({
        type: 'motorcycle',
        brand: '',
        model: '',
        color: '',
        numberPlate: '',
        year: new Date().getFullYear(),
        insuranceDocUrl: ''
      });
      loadProfile();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeVehicle(vehicleId);
              Alert.alert('Success', 'Vehicle removed successfully');
              loadProfile();
            } catch (error) {
              console.error('Error removing vehicle:', error);
              Alert.alert('Error', 'Failed to remove vehicle');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load profile</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Driver Profile Settings</Text>
      
      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={profileData.name}
          onChangeText={(value) => setProfileData(prev => ({ ...prev, name: value }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={profileData.phoneNumber}
          onChangeText={(value) => setProfileData(prev => ({ ...prev, phoneNumber: value }))}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Profile Picture URL"
          value={profileData.profilePictureUrl}
          onChangeText={(value) => setProfileData(prev => ({ ...prev, profilePictureUrl: value }))}
        />
        
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleProfileUpdate}
          disabled={saving}
        >
          <Text style={styles.updateButtonText}>
            {saving ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddVehicle(true)}
          >
            <Text style={styles.addButtonText}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </View>
        
        {profile.vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleTitle}>
                {vehicle.brand} {vehicle.model} ({vehicle.type})
              </Text>
              <View style={styles.vehicleActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingVehicle(vehicle)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveVehicle(vehicle.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.vehicleInfo}>
              Color: {vehicle.color} | Plate: {vehicle.numberPlate}
            </Text>
            <Text style={styles.vehicleInfo}>
              Year: {vehicle.year || 'N/A'} | Verified: {vehicle.isVerified ? 'Yes' : 'No'}
            </Text>
          </View>
        ))}
      </View>

      {/* Add/Edit Vehicle Modal */}
      {(showAddVehicle || editingVehicle) && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Vehicle Type</Text>
              <Picker
                selectedValue={vehicleData.type}
                onValueChange={(value) => setVehicleData(prev => ({ ...prev, type: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Motorcycle" value="motorcycle" />
                <Picker.Item label="Car" value="car" />
                <Picker.Item label="Lorry" value="lorry" />
              </Picker>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Brand"
              value={vehicleData.brand}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, brand: value }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Model"
              value={vehicleData.model}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, model: value }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Color"
              value={vehicleData.color}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, color: value }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Number Plate"
              value={vehicleData.numberPlate}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, numberPlate: value }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Year"
              value={vehicleData.year.toString()}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, year: parseInt(value) || new Date().getFullYear() }))}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Insurance Doc URL (Optional)"
              value={vehicleData.insuranceDocUrl}
              onChangeText={(value) => setVehicleData(prev => ({ ...prev, insuranceDocUrl: value }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddVehicle(false);
                  setEditingVehicle(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => editingVehicle ? handleVehicleUpdate(editingVehicle.id) : handleAddVehicle()}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : editingVehicle ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  updateButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vehicleCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    padding: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

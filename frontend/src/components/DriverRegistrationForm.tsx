import React, { useState } from 'react';
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

interface VehicleDetails {
  type: 'motorcycle' | 'car' | 'lorry';
  brand: string;
  model: string;
  color: string;
  numberPlate: string;
  year: number;
  insuranceDocUrl?: string;
}

interface DriverRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    profilePictureUrl: '',
    licenseNumber: '',
    licenseExpiry: '',
    governmentId: '',
    vehicle: {
      type: 'motorcycle' as 'motorcycle' | 'car' | 'lorry',
      brand: '',
      model: '',
      color: '',
      numberPlate: '',
      year: new Date().getFullYear(),
      insuranceDocUrl: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('vehicle.')) {
      const vehicleField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      const requiredFields = [
        'name', 'phoneNumber', 'licenseNumber', 'licenseExpiry'
      ];
      const requiredVehicleFields = [
        'brand', 'color', 'numberPlate'
      ];

      const missingFields = requiredFields.filter(field => !formData[field]);
      const missingVehicleFields = requiredVehicleFields.filter(field => !formData.vehicle[field]);

      if (missingFields.length > 0 || missingVehicleFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all required fields');
        return;
      }

      // Submit registration
      const response = await apiService.registerDriver(formData);
      
      Alert.alert(
        'Registration Successful',
        'Your driver registration has been submitted for review. You will be notified once approved.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>
      
      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Government ID"
          value={formData.governmentId}
          onChangeText={(value) => handleInputChange('governmentId', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Driver License Number *"
          value={formData.licenseNumber}
          onChangeText={(value) => handleInputChange('licenseNumber', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="License Expiry (YYYY-MM-DD) *"
          value={formData.licenseExpiry}
          onChangeText={(value) => handleInputChange('licenseExpiry', value)}
        />
      </View>

      {/* Vehicle Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Vehicle Type *</Text>
          <Picker
            selectedValue={formData.vehicle.type}
            onValueChange={(value) => handleInputChange('vehicle.type', value)}
            style={styles.picker}
          >
            <Picker.Item label="Motorcycle" value="motorcycle" />
            <Picker.Item label="Car" value="car" />
            <Picker.Item label="Lorry" value="lorry" />
          </Picker>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Brand *"
          value={formData.vehicle.brand}
          onChangeText={(value) => handleInputChange('vehicle.brand', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Model"
          value={formData.vehicle.model}
          onChangeText={(value) => handleInputChange('vehicle.model', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Color *"
          value={formData.vehicle.color}
          onChangeText={(value) => handleInputChange('vehicle.color', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Number Plate *"
          value={formData.vehicle.numberPlate}
          onChangeText={(value) => handleInputChange('vehicle.numberPlate', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Year"
          value={formData.vehicle.year.toString()}
          onChangeText={(value) => handleInputChange('vehicle.year', value)}
          keyboardType="numeric"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface DocumentUploadProps {
  onDocumentsSubmit: (documents: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DocumentState {
  fileName: string;
  fileUrl: string;
  status: 'empty' | 'uploaded' | 'error';
}

export default function DocumentUpload({ onDocumentsSubmit, onCancel, isLoading = false }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<{
    governmentId: DocumentState;
    driversLicense: DocumentState;
    vehicleRegistration: DocumentState;
    vehicleInsurance: DocumentState;
  }>({
    governmentId: { fileName: '', fileUrl: '', status: 'empty' },
    driversLicense: { fileName: '', fileUrl: '', status: 'empty' },
    vehicleRegistration: { fileName: '', fileUrl: '', status: 'empty' },
    vehicleInsurance: { fileName: '', fileUrl: '', status: 'empty' },
  });

  const [additionalNotes, setAdditionalNotes] = useState('');

  const documentTypes = [
    {
      key: 'governmentId',
      title: 'Government ID',
      description: 'Valid government-issued ID (National ID, Passport)',
      required: true,
      icon: 'badge',
    },
    {
      key: 'driversLicense',
      title: 'Driver\'s License',
      description: 'Valid driver\'s license',
      required: true,
      icon: 'card-membership',
    },
    {
      key: 'vehicleRegistration',
      title: 'Vehicle Registration',
      description: 'Vehicle registration certificate',
      required: true,
      icon: 'directions-car',
    },
    {
      key: 'vehicleInsurance',
      title: 'Vehicle Insurance',
      description: 'Vehicle insurance certificate (if required)',
      required: false,
      icon: 'security',
    },
  ];

  const pickDocument = async (documentType: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `document_${Date.now()}.jpg`;
        const fileUrl = asset.uri;

        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            fileName,
            fileUrl,
            status: 'uploaded',
          },
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeDocument = (documentType: string) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: {
        fileName: '',
        fileUrl: '',
        status: 'empty',
      },
    }));
  };

  const handleSubmit = () => {
    // Validate required documents
    const requiredDocuments = documentTypes.filter(doc => doc.required);
    const missingDocuments = requiredDocuments.filter(doc => 
      documents[doc.key as keyof typeof documents].status !== 'uploaded'
    );

    if (missingDocuments.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload the following required documents:\n${missingDocuments.map(doc => `• ${doc.title}`).join('\n')}`
      );
      return;
    }

    // Prepare documents for submission
    const submissionData = {
      governmentId: {
        type: 'government_id',
        fileName: documents.governmentId.fileName,
        fileUrl: documents.governmentId.fileUrl,
      },
      driversLicense: {
        type: 'drivers_license',
        fileName: documents.driversLicense.fileName,
        fileUrl: documents.driversLicense.fileUrl,
      },
      vehicleRegistration: {
        type: 'vehicle_registration',
        fileName: documents.vehicleRegistration.fileName,
        fileUrl: documents.vehicleRegistration.fileUrl,
      },
      ...(documents.vehicleInsurance.status === 'uploaded' && {
        vehicleInsurance: {
          type: 'vehicle_insurance',
          fileName: documents.vehicleInsurance.fileName,
          fileUrl: documents.vehicleInsurance.fileUrl,
        },
      }),
      additionalNotes: additionalNotes.trim() || undefined,
    };

    onDocumentsSubmit(submissionData);
  };

  const isSubmitDisabled = documentTypes
    .filter(doc => doc.required)
    .some(doc => documents[doc.key as keyof typeof documents].status !== 'uploaded');

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="verified-user" size={32} color="#2196F3" />
            <Text style={styles.title}>Driver Verification</Text>
          </View>
          <Text style={styles.subtitle}>
            Upload the required documents to verify your driver account. 
            This process usually takes 24-48 hours.
          </Text>
        </Card.Content>
      </Card>

      {documentTypes.map((docType) => (
        <Card key={docType.key} style={styles.documentCard}>
          <Card.Content>
            <View style={styles.documentHeader}>
              <MaterialIcons name={docType.icon as any} size={24} color="#666" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  {docType.title}
                  {docType.required && <Text style={styles.required}> *</Text>}
                </Text>
                <Text style={styles.documentDescription}>
                  {docType.description}
                </Text>
              </View>
            </View>

            <View style={styles.documentActions}>
              {documents[docType.key as keyof typeof documents].status === 'uploaded' ? (
                <View style={styles.uploadedDocument}>
                  <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.uploadedText}>
                    {documents[docType.key as keyof typeof documents].fileName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeDocument(docType.key)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="close" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument(docType.key)}
                >
                  <MaterialIcons name="cloud-upload" size={20} color="#2196F3" />
                  <Text style={styles.uploadText}>Upload Document</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}

      <Card style={styles.notesCard}>
        <Card.Content>
          <Text style={styles.notesTitle}>Additional Notes (Optional)</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Any additional information you'd like to include..."
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            style={styles.notesInput}
          />
        </Card.Content>
      </Card>

      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={isSubmitDisabled || isLoading}
          loading={isLoading}
          style={styles.submitButton}
        >
          Submit for Review
        </Button>
      </View>

      <Text style={styles.helpText}>
        * Required documents must be uploaded before submission. 
        All documents will be reviewed by our admin team.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 15,
    backgroundColor: '#e3f2fd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  documentCard: {
    margin: 15,
    marginTop: 0,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#F44336',
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  documentActions: {
    marginTop: 10,
  },
  uploadedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
  },
  uploadedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  notesCard: {
    margin: 15,
    marginTop: 0,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
    marginTop: 0,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    flex: 1,
    marginLeft: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    margin: 15,
    fontStyle: 'italic',
  },
});

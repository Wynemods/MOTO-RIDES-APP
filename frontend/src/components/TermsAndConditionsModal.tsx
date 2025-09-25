import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TermsAndConditionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height } = Dimensions.get('window');

export default function TermsAndConditionsModal({ visible, onClose }: TermsAndConditionsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Terms & Conditions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
            
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using MOTO Rides, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>

            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.paragraph}>
              MOTO Rides is a ride-hailing platform that connects passengers with drivers for transportation services. We provide a mobile application that facilitates the booking and management of rides.
            </Text>

            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.paragraph}>
              • Provide accurate and complete information during registration{'\n'}
              • Maintain the security of your account credentials{'\n'}
              • Use the service in compliance with local laws and regulations{'\n'}
              • Treat drivers and other users with respect{'\n'}
              • Report any safety concerns immediately
            </Text>

            <Text style={styles.sectionTitle}>4. Driver Requirements</Text>
            <Text style={styles.paragraph}>
              • Valid driver's license and vehicle registration{'\n'}
              • Clean driving record{'\n'}
              • Vehicle insurance coverage{'\n'}
              • Pass background checks and verification processes{'\n'}
              • Maintain professional conduct at all times
            </Text>

            <Text style={styles.sectionTitle}>5. Payment Terms</Text>
            <Text style={styles.paragraph}>
              • Fares are calculated based on distance and time{'\n'}
              • Payment is due upon completion of ride{'\n'}
              • We accept cash, mobile money (M-Pesa), and card payments{'\n'}
              • Cancellation fees may apply as per our policy{'\n'}
              • Refunds are processed within 5-7 business days
            </Text>

            <Text style={styles.sectionTitle}>6. Safety and Security</Text>
            <Text style={styles.paragraph}>
              • All drivers undergo background checks{'\n'}
              • Real-time GPS tracking for all rides{'\n'}
              • Emergency assistance available 24/7{'\n'}
              • Incident reporting and investigation procedures{'\n'}
              • Data protection and privacy measures
            </Text>

            <Text style={styles.sectionTitle}>7. Cancellation Policy</Text>
            <Text style={styles.paragraph}>
              • Free cancellations within 5 minutes of booking{'\n'}
              • Cancellation fees apply after grace period{'\n'}
              • No-show charges for missed pickups{'\n'}
              • Driver cancellation penalties{'\n'}
              • Refund policy for cancelled rides
            </Text>

            <Text style={styles.sectionTitle}>8. Privacy Policy</Text>
            <Text style={styles.paragraph}>
              We collect and process personal data in accordance with applicable privacy laws. Your information is used to provide services, ensure safety, and improve our platform. We do not sell your personal data to third parties.
            </Text>

            <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MOTO Rides acts as an intermediary platform. We are not responsible for the actions of drivers or passengers. Users participate at their own risk and should exercise caution when using our services.
            </Text>

            <Text style={styles.sectionTitle}>10. Termination</Text>
            <Text style={styles.paragraph}>
              We reserve the right to terminate or suspend accounts that violate these terms. Users may terminate their account at any time by contacting customer support.
            </Text>

            <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may update these terms from time to time. Users will be notified of significant changes. Continued use of the service constitutes acceptance of updated terms.
            </Text>

            <Text style={styles.sectionTitle}>12. Contact Information</Text>
            <Text style={styles.paragraph}>
              For questions about these terms, please contact us:{'\n'}
              Email: support@motorides.com{'\n'}
              Phone: +254 700 000 000{'\n'}
              Address: Nairobi, Kenya
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 15,
  },
});

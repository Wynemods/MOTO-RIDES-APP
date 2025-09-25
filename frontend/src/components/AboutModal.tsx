import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  showPrivacyPolicy?: boolean;
}

const { height } = Dimensions.get('window');

export default function AboutModal({ visible, onClose, showPrivacyPolicy = false }: AboutModalProps) {
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
            <Text style={styles.title}>
              {showPrivacyPolicy ? 'Privacy Policy' : 'About MOTO Rides'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!showPrivacyPolicy && (
              <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                  <MaterialIcons name="motorcycle" size={40} color="#000" />
                </View>
                <Text style={styles.appName}>MOTO Rides</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
              </View>
            )}

            {showPrivacyPolicy ? (
              <>
                <Text style={styles.sectionTitle}>Information We Collect</Text>
                <Text style={styles.paragraph}>
                  We collect information you provide directly to us, such as when you create an account, request a ride, or contact us for support. This includes:
                </Text>
                <Text style={styles.paragraph}>
                  • Personal information (name, email, phone number){'\n'}
                  • Payment information (processed securely through third-party providers){'\n'}
                  • Location data (to provide ride services){'\n'}
                  • Communication preferences{'\n'}
                  • Device information and usage data
                </Text>

                <Text style={styles.sectionTitle}>How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                  We use the information we collect to:
                </Text>
                <Text style={styles.paragraph}>
                  • Provide, maintain, and improve our services{'\n'}
                  • Process transactions and send related information{'\n'}
                  • Send technical notices and support messages{'\n'}
                  • Respond to your comments and questions{'\n'}
                  • Monitor and analyze trends and usage{'\n'}
                  • Personalize and improve your experience
                </Text>

                <Text style={styles.sectionTitle}>Information Sharing</Text>
                <Text style={styles.paragraph}>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with:
                </Text>
                <Text style={styles.paragraph}>
                  • Service providers who assist us in operating our platform{'\n'}
                  • Drivers (limited information necessary for ride completion){'\n'}
                  • Legal authorities when required by law{'\n'}
                  • Business partners with your explicit consent
                </Text>

                <Text style={styles.sectionTitle}>Data Security</Text>
                <Text style={styles.paragraph}>
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </Text>

                <Text style={styles.sectionTitle}>Your Rights</Text>
                <Text style={styles.paragraph}>
                  You have the right to:
                </Text>
                <Text style={styles.paragraph}>
                  • Access and update your personal information{'\n'}
                  • Delete your account and associated data{'\n'}
                  • Opt-out of marketing communications{'\n'}
                  • Request a copy of your data{'\n'}
                  • Withdraw consent for data processing
                </Text>

                <Text style={styles.sectionTitle}>Contact Us</Text>
                <Text style={styles.paragraph}>
                  If you have any questions about this Privacy Policy, please contact us:
                </Text>
                <Text style={styles.paragraph}>
                  Email: privacy@motorides.com{'\n'}
                  Phone: +254 700 000 000{'\n'}
                  Address: Nairobi, Kenya
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>What is MOTO Rides?</Text>
                <Text style={styles.paragraph}>
                  MOTO Rides is Kenya's premier ride-hailing platform, connecting passengers with reliable drivers for safe, convenient, and affordable transportation. Whether you need a quick ride across town or a longer journey, MOTO Rides has you covered.
                </Text>
              </>
            )}

            {!showPrivacyPolicy && (
              <>
                <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialIcons name="speed" size={20} color="#000" />
                <Text style={styles.featureText}>Fast & Reliable Service</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="security" size={20} color="#000" />
                <Text style={styles.featureText}>Verified Drivers</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="payment" size={20} color="#000" />
                <Text style={styles.featureText}>Multiple Payment Options</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="gps-fixed" size={20} color="#000" />
                <Text style={styles.featureText}>Real-time Tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="support-agent" size={20} color="#000" />
                <Text style={styles.featureText}>24/7 Customer Support</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="eco" size={20} color="#000" />
                <Text style={styles.featureText}>Eco-friendly Options</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Enter your destination and request a ride</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Get matched with a nearby verified driver</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Track your driver's arrival in real-time</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Enjoy a safe and comfortable ride</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.paragraph}>
              To revolutionize transportation in Kenya by providing safe, reliable, and affordable ride-hailing services while creating economic opportunities for drivers and improving mobility for passengers.
            </Text>

            <Text style={styles.sectionTitle}>Safety First</Text>
            <Text style={styles.paragraph}>
              Your safety is our top priority. All drivers undergo thorough background checks, vehicle inspections, and continuous monitoring. We also provide emergency assistance and real-time support.
            </Text>

            <Text style={styles.sectionTitle}>Supporting Local Economy</Text>
            <Text style={styles.paragraph}>
              MOTO Rides creates employment opportunities for Kenyan drivers while providing convenient transportation solutions for residents and visitors alike.
            </Text>

            <Text style={styles.sectionTitle}>Contact Us</Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <MaterialIcons name="email" size={20} color="#000" />
                <Text style={styles.contactText}>support@motorides.com</Text>
              </View>
              <View style={styles.contactItem}>
                <MaterialIcons name="phone" size={20} color="#000" />
                <Text style={styles.contactText}>+254 700 000 000</Text>
              </View>
              <View style={styles.contactItem}>
                <MaterialIcons name="location-on" size={20} color="#000" />
                <Text style={styles.contactText}>Nairobi, Kenya</Text>
              </View>
            </View>

                <Text style={styles.footerText}>
                  © 2024 MOTO Rides. All rights reserved.
                </Text>
              </>
            )}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 15,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

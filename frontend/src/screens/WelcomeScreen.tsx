import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import AboutModal from '../components/AboutModal';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: 'speed',
      title: 'Lightning Fast',
      description: 'Get matched with drivers in under 2 minutes',
      color: '#000',
    },
    {
      icon: 'security',
      title: '100% Safe',
      description: 'Verified drivers with background checks',
      color: '#000',
    },
    {
      icon: 'payment',
      title: 'Easy Payments',
      description: 'Pay with M-Pesa, card, or cash',
      color: '#000',
    },
    {
      icon: 'gps-fixed',
      title: 'Live Tracking',
      description: 'Real-time GPS tracking and ETA',
      color: '#000',
    },
    {
      icon: 'support-agent',
      title: '24/7 Support',
      description: 'Round-the-clock customer assistance',
      color: '#000',
    },
    {
      icon: 'eco',
      title: 'Eco-Friendly',
      description: 'Sustainable transportation options',
      color: '#000',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Happy Riders' },
    { number: '500+', label: 'Verified Drivers' },
    { number: '50K+', label: 'Rides Completed' },
    { number: '4.9★', label: 'Average Rating' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f8f8f8', '#ffffff']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="motorcycle" size={40} color="#fff" />
              </View>
              <Text style={styles.appName}>MOTO RIDES</Text>
              <Text style={styles.tagline}>Your Journey, Our Priority</Text>
            </View>
          </Animated.View>

          {/* Hero Section */}
          <Animated.View 
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.heroTitle}>
              Fast, Safe & Reliable{'\n'}
              <Text style={styles.heroSubtitle}>Ride-Hailing in Kenya</Text>
            </Text>
            <Text style={styles.heroDescription}>
              Experience the future of transportation with MOTO Rides. 
              Connect with verified drivers, track your journey in real-time, 
              and enjoy seamless payments - all in one app.
            </Text>
          </Animated.View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Trusted by Thousands</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Why Choose MOTO Rides?</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <MaterialIcons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Book Your Ride</Text>
                  <Text style={styles.stepDescription}>Enter your destination and get instant fare estimates</Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Track Your Driver</Text>
                  <Text style={styles.stepDescription}>See your driver's location and estimated arrival time</Text>
                </View>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Enjoy the Ride</Text>
                  <Text style={styles.stepDescription}>Sit back and relax while we take you to your destination</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.primaryButton}
              labelStyle={styles.primaryButtonText}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={styles.secondaryButton}
              labelStyle={styles.secondaryButtonText}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>
          </View>

          {/* Footer Links */}
          <View style={styles.footerSection}>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => setShowAbout(true)} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>About Us</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity onPress={() => setShowTerms(true)} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Terms & Conditions</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerText}>
              © 2024 MOTO Rides. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Modals */}
      <TermsAndConditionsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <AboutModal
        visible={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    letterSpacing: 1,
    fontWeight: '300',
  },
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: '#666',
    fontWeight: '400',
  },
  heroDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  statsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: (width - 60) / 2,
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  howItWorksSection: {
    marginBottom: 40,
  },
  stepsContainer: {
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    width: '100%',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingTop: 5,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonSection: {
    width: '100%',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    paddingVertical: 12,
  },
  footerSection: {
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  footerLink: {
    padding: 10,
  },
  footerLinkText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  footerSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
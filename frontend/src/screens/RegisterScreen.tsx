import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { Text, TextInput, Button, Card, RadioButton, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import AboutModal from '../components/AboutModal';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, isLoading } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Rider' as 'Rider' | 'Driver',
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors = {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms & Conditions to continue.');
      return;
    }

    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      registrationType: formData.role.toLowerCase() as 'rider' | 'driver',
    });

    if (success) {
      navigation.navigate('MainTabs');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <MaterialIcons name="motorcycle" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>MOTO RIDES</Text>
          <Text style={styles.subtitle}>Join thousands of happy riders</Text>
        </Animated.View>

        {/* Registration Form */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Full Name *"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.name}
                  left={<TextInput.Icon icon="account" />}
                  theme={{
                    colors: {
                      primary: '#000',
                      error: '#ff4444',
                    }
                  }}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              {/* Phone Number */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Phone Number *"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  error={!!errors.phone}
                  left={<TextInput.Icon icon="phone" />}
                  theme={{
                    colors: {
                      primary: '#000',
                      error: '#ff4444',
                    }
                  }}
                />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Email (Optional)"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  mode="outlined"
                  keyboardType="email-address"
                  style={styles.input}
                  error={!!errors.email}
                  left={<TextInput.Icon icon="email" />}
                  theme={{
                    colors: {
                      primary: '#000',
                      error: '#ff4444',
                    }
                  }}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>I am a:</Text>
                <View style={styles.roleOptions}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'Rider' && styles.roleOptionSelected
                    ]}
                    onPress={() => updateFormData('role', 'Rider')}
                  >
                    <MaterialIcons 
                      name="person" 
                      size={24} 
                      color={formData.role === 'Rider' ? '#fff' : '#000'} 
                    />
                    <Text style={[
                      styles.roleText,
                      formData.role === 'Rider' && styles.roleTextSelected
                    ]}>
                      Rider
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'Driver' && styles.roleOptionSelected
                    ]}
                    onPress={() => updateFormData('role', 'Driver')}
                  >
                    <MaterialIcons 
                      name="drive-eta" 
                      size={24} 
                      color={formData.role === 'Driver' ? '#fff' : '#000'} 
                    />
                    <Text style={[
                      styles.roleText,
                      formData.role === 'Driver' && styles.roleTextSelected
                    ]}>
                      Driver
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Password *"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  error={!!errors.password}
                  left={<TextInput.Icon icon="lock" />}
                  theme={{
                    colors: {
                      primary: '#000',
                      error: '#ff4444',
                    }
                  }}
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  error={!!errors.confirmPassword}
                  left={<TextInput.Icon icon="lock-check" />}
                  theme={{
                    colors: {
                      primary: '#000',
                      error: '#ff4444',
                    }
                  }}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Checkbox
                  status={acceptTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  color="#000"
                />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setShowTerms(true)}
                    >
                      Terms & Conditions
                    </Text>
                    {' '}and{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setShowAbout(true)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading || !acceptTerms}
                style={styles.registerButton}
                labelStyle={styles.registerButtonText}
                contentStyle={styles.buttonContent}
              >
                Create Account
              </Button>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <TermsAndConditionsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <AboutModal
        visible={showAbout}
        onClose={() => setShowAbout(false)}
        showPrivacyPolicy={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    flex: 1,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  roleOptionSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  roleTextSelected: {
    color: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    paddingVertical: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
});
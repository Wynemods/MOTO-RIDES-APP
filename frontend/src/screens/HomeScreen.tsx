import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import LocationSearch from '../components/LocationSearch';
const MapViewComponent = lazy(() => import('../components/MapView'));
import EdgeCaseHandler from '../components/EdgeCaseHandler';
import NetworkErrorHandler from '../components/NetworkErrorHandler';
import FareDisplay from '../components/FareDisplay';
import RideOptions from '../components/RideOptions';
import FinePaymentModal from '../components/FinePaymentModal';
import { DriverRegistrationForm } from '../components/DriverRegistrationForm';
import { DriverProfileSettings } from '../components/DriverProfileSettings';
import { useLocation } from '../contexts/LocationContext';
import { useRides } from '../contexts/RidesContext';
import { useAuth } from '../contexts/AuthContext';
import OpenStreetMapService from '../services/openstreetmap.service';
import ApiService from '../services/api.service';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [fromLocation, setFromLocation] = useState('Your location');
  const [toLocation, setToLocation] = useState('Where to?');
  const [selectedFromLocation, setSelectedFromLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [selectedToLocation, setSelectedToLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [route, setRoute] = useState<{
    polyline: string;
    distance: number;
    duration: number;
  } | null>(null);
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [selectedRideType, setSelectedRideType] = useState<'bike' | 'car' | 'premium'>('bike');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'wallet' | 'mpesa' | 'card'>('mpesa');
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  const [showFareDisplay, setShowFareDisplay] = useState(false);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [rideStatus, setRideStatus] = useState<string>('idle');
  const [networkError, setNetworkError] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [currentDriver, setCurrentDriver] = useState<any>(null);
  const [fineStatus, setFineStatus] = useState<any>(null);

  // Split Fare states
  const [showSplitFareModal, setShowSplitFareModal] = useState(false);
  const [splitFareParticipants, setSplitFareParticipants] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    amount: number;
    paymentMethod: 'mpesa' | 'cash';
  }>>([]);
  const [isEqualSplit, setIsEqualSplit] = useState(true);
  const [splitFareTotal, setSplitFareTotal] = useState(0);
  const [splitFareLoading, setSplitFareLoading] = useState(false);

  // Map expansion state
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapHeight, setMapHeight] = useState(200); // Default minimized height
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialMapHeight, setInitialMapHeight] = useState(200);
  
  // Animation values persisted across renders
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { isAuthenticated } = useAuth();
  const { currentLocation } = useLocation();
  const { requestRide } = useRides();

  // Saved locations data (memoized)
  const savedLocations = useMemo(() => ([
    { id: '1', name: 'Home', address: '123 Maple Street', icon: 'home' },
    { id: '2', name: 'Work', address: '456 Corporate Plaza', icon: 'work' },
    { id: '3', name: 'Downtown', address: '3.2 km', icon: 'location-on' },
    { id: '4', name: 'Airport', address: '12.5 km', icon: 'flight' },
  ]), []);

  const getCurrentTime = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const getIconComponent = useCallback((iconName: string) => {
    switch (iconName) {
      case 'home':
        return <MaterialIcons name="home" size={20} color="#4CAF50" />;
      case 'work':
        return <MaterialIcons name="work" size={20} color="#2196F3" />;
      case 'location-on':
        return <MaterialIcons name="location-on" size={20} color="#FF9800" />;
      case 'flight':
        return <MaterialIcons name="flight" size={20} color="#9C27B0" />;
      default:
        return <MaterialIcons name="place" size={20} color="#666" />;
    }
  }, []);

  const handleConfirmRide = useCallback(async () => {
    if (!selectedFromLocation || !selectedToLocation) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    try {
      setIsRequestingRide(true);
      
      const rideData = {
        pickup: {
          lat: selectedFromLocation.latitude,
          lng: selectedFromLocation.longitude,
          address: selectedFromLocation.address,
        },
        destination: {
          lat: selectedToLocation.latitude,
          lng: selectedToLocation.longitude,
          address: selectedToLocation.address,
        },
        fare: fareEstimate?.finalFare || 0,
        paymentMethod: selectedPaymentMethod === 'card' ? 'stripe' : selectedPaymentMethod as 'wallet' | 'mpesa' | 'stripe',
      };

      const success = await requestRide(rideData);
      
      if (success) {
        setRideStatus('requested');
        Alert.alert('Success', 'Ride requested successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request ride');
    } finally {
      setIsRequestingRide(false);
    }
  }, [selectedFromLocation, selectedToLocation, fareEstimate, selectedPaymentMethod, requestRide]);

  // Split Fare functions
  const handleSplitFarePress = useCallback(() => {
    if (!selectedFromLocation || !selectedToLocation) {
      Alert.alert('Location Required', 'Please select both pickup and destination locations first');
      return;
    }

    if (!fareEstimate) {
      Alert.alert('Fare Required', 'Please wait for the fare calculation to complete');
      return;
    }

    // Initialize with current user as first participant
    const currentUser = {
      id: 'current-user',
      name: 'You',
      phone: '+254712345678', // This should come from user context
      amount: 0,
      paymentMethod: 'mpesa' as const,
    };

    setSplitFareTotal(fareEstimate.finalFare);
    setSplitFareParticipants([currentUser]);
    setShowSplitFareModal(true);
  }, [selectedFromLocation, selectedToLocation, fareEstimate]);

  const calculateEqualSplit = useCallback(() => {
    if (splitFareParticipants.length === 0) return;
    const amountPerPerson = splitFareTotal / splitFareParticipants.length;
    const updatedParticipants = splitFareParticipants.map(p => ({
      ...p,
      amount: amountPerPerson
    }));
    setSplitFareParticipants(updatedParticipants);
  }, [splitFareParticipants, splitFareTotal]);

  const addParticipant = useCallback(() => {
    const newParticipant = {
      id: `participant-${Date.now()}`,
      name: '',
      phone: '',
      amount: 0,
      paymentMethod: 'mpesa' as const,
    };
    setSplitFareParticipants(prev => [...prev, newParticipant]);
  }, []);

  const removeParticipant = useCallback((id: string) => {
    if (splitFareParticipants.length > 1) {
      setSplitFareParticipants(prev => prev.filter(p => p.id !== id));
    }
  }, [splitFareParticipants.length]);

  const updateParticipant = useCallback((id: string, field: string, value: any) => {
    setSplitFareParticipants(participants =>
      participants.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  }, []);

  const toggleEqualSplit = useCallback(() => {
    setIsEqualSplit(prev => {
      const next = !prev;
      if (!next) {
        calculateEqualSplit();
      }
      return next;
    });
  }, [calculateEqualSplit]);

  const validateSplitFare = useCallback(() => {
    const totalAmount = splitFareParticipants.reduce((sum, p) => sum + p.amount, 0);
    return Math.abs(totalAmount - splitFareTotal) < 0.01;
  }, [splitFareParticipants, splitFareTotal]);

  const handleCreateSplitFareRide = useCallback(async () => {
    if (!validateSplitFare()) {
      Alert.alert('Invalid Split', 'The sum of all amounts must equal the total fare');
      return;
    }

    if (splitFareParticipants.some(p => !p.name || !p.phone || p.amount <= 0)) {
      Alert.alert('Invalid Data', 'Please fill in all participant details');
      return;
    }

    try {
      setSplitFareLoading(true);
      
      const splitFareData = {
        pickup: {
          lat: selectedFromLocation.latitude,
          lng: selectedFromLocation.longitude,
          address: selectedFromLocation.address,
        },
        destination: {
          lat: selectedToLocation.latitude,
          lng: selectedToLocation.longitude,
          address: selectedToLocation.address,
        },
        rideType: selectedRideType,
        totalFare: splitFareTotal,
        participants: splitFareParticipants.map(p => ({
          riderId: p.id,
          name: p.name,
          phone: p.phone,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
        })),
        isEqualSplit,
        notes: '',
      };

      const result = await ApiService.createSplitFareRide(splitFareData);
      
      if (result.success) {
        Alert.alert('Success', 'Split fare ride created! Processing payments...');
        setShowSplitFareModal(false);
        
        // Process payments
        await ApiService.processSplitFarePayments(result.rideId);
        
        // Reset form
        setSplitFareParticipants([]);
        setSplitFareTotal(0);
        setIsEqualSplit(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create split fare ride');
    } finally {
      setSplitFareLoading(false);
    }
  }, [selectedFromLocation, selectedToLocation, selectedRideType, splitFareTotal, splitFareParticipants, isEqualSplit, validateSplitFare]);

  // Type-safe wrapper for ride type selection
  const handleRideTypeSelect = useCallback((type: string) => {
    if (type === 'bike' || type === 'car' || type === 'premium') {
      setSelectedRideType(type);
    }
  }, []);

  // Calculate route when both locations are selected
  useEffect(() => {
    if (!(selectedFromLocation && selectedToLocation)) return;

    const timer = setTimeout(async () => {
      try {
        const routeData = await OpenStreetMapService.getRoute(
          selectedFromLocation,
          selectedToLocation
        );
        
        if (routeData) setRoute(routeData);
      } catch (error) {
        console.error('Failed to calculate route:', error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedFromLocation, selectedToLocation]);

  // Map resizing handlers
  const handleMapDragStart = useCallback((event: any) => {
    setIsDragging(true);
    setDragStartY(event.nativeEvent.pageY);
    setInitialMapHeight(mapHeight);
  }, [mapHeight]);

  const handleMapDragMove = useCallback((event: any) => {
    if (!isDragging) return;
    
    const currentY = event.nativeEvent.pageY;
    const deltaY = dragStartY - currentY; // Inverted for natural feel
    const newHeight = Math.max(150, Math.min(height * 0.8, initialMapHeight + deltaY));
    
    setMapHeight(newHeight);
    
    // Auto-expand when dragged up significantly
    if (newHeight > height * 0.6) {
      setIsMapExpanded(true);
    } else {
      setIsMapExpanded(false);
    }
  }, [isDragging, dragStartY, initialMapHeight]);

  const handleMapDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Snap to predefined sizes
    if (mapHeight < height * 0.3) {
      setMapHeight(200); // Minimized
      setIsMapExpanded(false);
    } else if (mapHeight > height * 0.6) {
      setMapHeight(height * 0.8); // Expanded
      setIsMapExpanded(true);
    } else {
      setMapHeight(height * 0.4); // Medium
      setIsMapExpanded(false);
    }
  }, [mapHeight]);

  const toggleMapExpansion = useCallback(() => {
    if (isMapExpanded) {
      // Collapse map with animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setMapHeight(200);
      setIsMapExpanded(false);
    } else {
      // Expand map with animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setMapHeight(height * 0.8);
      setIsMapExpanded(true);
    }
  }, [isMapExpanded, fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.appLogo}>MOTO</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialIcons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.greeting}>{getCurrentTime()}</Text>
        <Text style={styles.subtitle}>Where are you going today?</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ride Booking Section */}
        <Card style={styles.bookingCard}>
          <Card.Content style={styles.bookingContent}>
            {/* From Location */}
            <View style={styles.locationRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.currentLocationDot} />
              </View>
              <View style={styles.locationInputContainer}>
                <MaterialIcons name="location-on" size={20} color="#000" />
                <LocationSearch
                  placeholder="Your location"
                  value={selectedFromLocation?.address || fromLocation}
                  onLocationSelect={(location) => {
                    setSelectedFromLocation(location);
                    setFromLocation(location.address);
                  }}
                />
              </View>
            </View>

            {/* Connection Line */}
            <View style={styles.connectionLine} />

            {/* To Location */}
            <View style={styles.locationRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.locationInputContainer}>
                <MaterialIcons name="send" size={20} color="#000" />
                <LocationSearch
                  placeholder="Where to?"
                  value={selectedToLocation?.address || toLocation}
                  onLocationSelect={(location) => {
                    setSelectedToLocation(location);
                    setToLocation(location.address);
                  }}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons - Auto-hide when map expanded */}
        <Animated.View 
          style={[
            styles.actionButtonsContainer, 
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleSplitFarePress}>
            <FontAwesome5 name="users" size={16} color="#000" />
            <Text style={styles.actionButtonText}>Split Fare</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="schedule" size={16} color="#000" />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="local-offer" size={16} color="#000" />
            <Text style={styles.actionButtonText}>Promo</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Find Drivers Button - Auto-hide when map expanded */}
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Button
            mode="contained"
            style={styles.findDriversButton}
            labelStyle={styles.findDriversText}
            onPress={() => {
              if (selectedFromLocation && selectedToLocation) {
                setShowFareDisplay(true);
                setShowRideOptions(true);
              }
            }}
            disabled={!selectedFromLocation || !selectedToLocation || isRequestingRide}
          >
            Find Drivers
          </Button>
        </Animated.View>

        {/* Map Section - Resizable with Drag Gestures */}
        {selectedFromLocation && selectedToLocation && (
          <Card style={styles.mapCard}>
            <Card.Content style={styles.mapContent}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>Route Preview</Text>
                <View style={styles.mapControls}>
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={toggleMapExpansion}
                  >
                    <MaterialIcons 
                      name={isMapExpanded ? "fullscreen-exit" : "fullscreen"} 
                      size={24} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Drag Handle */}
              <View 
                style={styles.dragHandle}
                onTouchStart={handleMapDragStart}
                onTouchMove={handleMapDragMove}
                onTouchEnd={handleMapDragEnd}
              >
                <View style={styles.dragIndicator} />
              </View>
              
              <Suspense fallback={<View style={{ height: mapHeight }} />}> 
                <MapViewComponent
                  fromLocation={selectedFromLocation}
                  toLocation={selectedToLocation}
                  route={route}
                  style={[
                    styles.mapView,
                    { height: mapHeight }
                  ]}
                />
              </Suspense>
              
              {/* Map Status Overlay */}
              {isMapExpanded && (
                <View style={styles.mapStatusOverlay}>
                  <View style={styles.etaBanner}>
                    <MaterialIcons name="schedule" size={16} color="#4CAF50" />
                    <Text style={styles.etaText}>Driver arriving in 3 mins</Text>
                  </View>
                  <View style={styles.fareBanner}>
                    <Text style={styles.fareText}>KSH {fareEstimate?.finalFare || 0}</Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Saved Locations Section - Auto-hide when map expanded */}
        <Animated.View 
          style={[
            styles.savedLocationsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
          <View style={styles.savedLocationsGrid}>
            {savedLocations.map((location) => (
              <TouchableOpacity key={location.id} style={styles.savedLocationCard}>
                <View style={styles.savedLocationIcon}>
                  {getIconComponent(location.icon)}
                </View>
                <Text style={styles.savedLocationName}>{location.name}</Text>
                <Text style={styles.savedLocationAddress}>{location.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Ride Options */}
        {showRideOptions && fareEstimate && (
          <RideOptions
            options={[
              {
                type: 'bike',
                name: 'Motorcycle',
                description: 'Fast and affordable',
                icon: 'motorcycle',
                multiplier: 1.0,
                estimatedArrival: '2-3 min',
                fare: Math.round(fareEstimate.baseFare * 1.0),
                currency: 'KSH',
              },
              {
                type: 'car',
                name: 'Car',
                description: 'Comfortable ride',
                icon: 'directions-car',
                multiplier: 1.5,
                estimatedArrival: '3-5 min',
                fare: Math.round(fareEstimate.baseFare * 1.5),
                currency: 'KSH',
              },
              {
                type: 'premium',
                name: 'Premium',
                description: 'Luxury vehicle',
                icon: 'star',
                multiplier: 2.0,
                estimatedArrival: '5-7 min',
                fare: Math.round(fareEstimate.baseFare * 2.0),
                currency: 'KSH',
              },
            ]}
            selectedType={selectedRideType}
            onSelect={handleRideTypeSelect}
            baseFare={fareEstimate.baseFare}
          />
        )}

        {/* Fare Display */}
        {showFareDisplay && fareEstimate && (
          <FareDisplay
            fare={fareEstimate}
            rideType={selectedRideType}
            onRideTypeChange={handleRideTypeSelect}
            onConfirm={handleConfirmRide}
            isCalculating={isCalculatingFare}
            disabled={isRequestingRide}
          />
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={24} color="#4CAF50" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="history" size={24} color="#666" />
          <Text style={styles.navText}>Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="drive-eta" size={24} color="#666" />
          <Text style={styles.navText}>Drive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#666" />
          <Text style={styles.navText}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="person" size={24} color="#666" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Status Popups */}
      {rideStatus === 'driver_arriving' && (
        <View style={styles.statusToast}>
          <MaterialIcons name="directions-car" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>Driver is 2 minutes away!</Text>
        </View>
      )}

      {rideStatus === 'ride_started' && (
        <View style={[styles.statusToast, styles.statusToastBlue]}>
          <MaterialIcons name="play-arrow" size={20} color="#2196F3" />
          <Text style={styles.statusText}>Ride in progress...</Text>
        </View>
      )}

      {rideStatus === 'ride_completed' && (
        <View style={[styles.statusToast, styles.statusToastGreen]}>
          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>You have arrived at your destination!</Text>
        </View>
      )}

      {/* Edge Case Popups */}
      {networkError && (
        <View style={[styles.statusToast, styles.statusToastRed]}>
          <MaterialIcons name="wifi-off" size={20} color="#F44336" />
          <Text style={styles.statusText}>No internet connection</Text>
        </View>
      )}

      {/* Split Fare Modal */}
      {showSplitFareModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.splitFareModal}>
            <View style={styles.splitFareHeader}>
              <Text style={styles.splitFareTitle}>Split Fare</Text>
              <TouchableOpacity onPress={() => setShowSplitFareModal(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.splitFareContent}>
              {/* Total Fare Display */}
              <View style={styles.totalFareContainer}>
                <Text style={styles.totalFareLabel}>Total Fare</Text>
                <Text style={styles.totalFareAmount}>KSH {splitFareTotal}</Text>
              </View>

              {/* Equal Split Toggle */}
              <View style={styles.equalSplitContainer}>
                <TouchableOpacity 
                  style={styles.equalSplitToggle}
                  onPress={toggleEqualSplit}
                >
                  <View style={[styles.toggleSwitch, isEqualSplit && styles.toggleSwitchActive]}>
                    <View style={[styles.toggleThumb, isEqualSplit && styles.toggleThumbActive]} />
                  </View>
                  <Text style={styles.equalSplitText}>Split equally</Text>
                </TouchableOpacity>
              </View>

              {/* Participants List */}
              <View style={styles.participantsContainer}>
                <Text style={styles.participantsTitle}>Participants</Text>
                {splitFareParticipants.map((participant, index) => (
                  <View key={participant.id} style={styles.participantCard}>
                    <View style={styles.participantHeader}>
                      <Text style={styles.participantNumber}>#{index + 1}</Text>
                      {splitFareParticipants.length > 1 && (
                        <TouchableOpacity onPress={() => removeParticipant(participant.id)}>
                          <MaterialIcons name="close" size={20} color="#F44336" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <TextInput
                      style={styles.participantInput}
                      placeholder="Name"
                      value={participant.name}
                      onChangeText={(text) => updateParticipant(participant.id, 'name', text)}
                    />
                    
                    <TextInput
                      style={styles.participantInput}
                      placeholder="Phone Number"
                      value={participant.phone}
                      onChangeText={(text) => updateParticipant(participant.id, 'phone', text)}
                      keyboardType="phone-pad"
                    />
                    
                    <View style={styles.participantAmountRow}>
                      <TextInput
                        style={[styles.participantInput, styles.amountInput]}
                        placeholder="Amount"
                        value={participant.amount.toString()}
                        onChangeText={(text) => updateParticipant(participant.id, 'amount', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                      
                      <View style={styles.paymentMethodContainer}>
                        <TouchableOpacity
                          style={[
                            styles.paymentMethodButton,
                            participant.paymentMethod === 'mpesa' && styles.paymentMethodButtonActive
                          ]}
                          onPress={() => updateParticipant(participant.id, 'paymentMethod', 'mpesa')}
                        >
                          <Text style={[
                            styles.paymentMethodText,
                            participant.paymentMethod === 'mpesa' && styles.paymentMethodTextActive
                          ]}>
                            M-Pesa
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.paymentMethodButton,
                            participant.paymentMethod === 'cash' && styles.paymentMethodButtonActive
                          ]}
                          onPress={() => updateParticipant(participant.id, 'paymentMethod', 'cash')}
                        >
                          <Text style={[
                            styles.paymentMethodText,
                            participant.paymentMethod === 'cash' && styles.paymentMethodTextActive
                          ]}>
                            Cash
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Add Participant Button */}
              <TouchableOpacity style={styles.addParticipantButton} onPress={addParticipant}>
                <MaterialIcons name="add" size={20} color="#000" />
                <Text style={styles.addParticipantText}>Add Participant</Text>
              </TouchableOpacity>

              {/* Validation Error */}
              {!validateSplitFare() && (
                <View style={styles.validationError}>
                  <MaterialIcons name="error" size={16} color="#F44336" />
                  <Text style={styles.validationErrorText}>
                    Total amount must equal KSH {splitFareTotal}
                  </Text>
                </View>
              )}

              {/* Commission Info */}
              <View style={styles.commissionInfo}>
                <Text style={styles.commissionTitle}>Commission Breakdown</Text>
                <Text style={styles.commissionText}>
                  Driver will receive: KSH {Math.round(splitFareTotal * 0.7)} (after 30% commission)
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.splitFareActions}>
              <Button
                mode="outlined"
                onPress={() => setShowSplitFareModal(false)}
                style={styles.splitFareButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateSplitFareRide}
                style={[styles.splitFareButton, styles.createButton]}
                loading={splitFareLoading}
                disabled={!validateSplitFare() || splitFareLoading}
              >
                Create Split Fare
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Header Section
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  appLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notificationButton: {
    padding: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  // Main Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Ride Booking Section
  bookingCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingContent: {
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  locationIndicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  connectionLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 9,
    marginVertical: 4,
  },
  locationInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
    fontWeight: '500',
  },
  // Find Drivers Button
  findDriversButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 16,
  },
  findDriversText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Map Section
  mapCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapContent: {
    padding: 0,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  expandButton: {
    padding: 8,
  },
  mapView: {
    width: '100%',
    borderRadius: 8,
  },
  mapControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#999',
    borderRadius: 2,
  },
  mapStatusOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  etaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fareBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fareText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hiddenElement: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
  // Saved Locations
  savedLocationsSection: {
    marginBottom: 16,
  },
  savedLocationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  savedLocationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  savedLocationCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  savedLocationIcon: {
    marginBottom: 8,
  },
  savedLocationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  savedLocationAddress: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Bottom Navigation
  bottomNavigation: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // Status Toasts
  statusToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  statusToastBlue: {
    backgroundColor: '#2196F3',
  },
  statusToastGreen: {
    backgroundColor: '#4CAF50',
  },
  statusToastRed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Split Fare Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  splitFareModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  splitFareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  splitFareTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  splitFareContent: {
    maxHeight: 400,
    padding: 16,
  },
  totalFareContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  totalFareLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  equalSplitContainer: {
    marginBottom: 20,
  },
  equalSplitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  equalSplitText: {
    fontSize: 16,
    color: '#000',
  },
  participantsContainer: {
    marginBottom: 20,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  participantCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  participantInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  participantAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
  },
  paymentMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paymentMethodButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  addParticipantText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  validationErrorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
  },
  commissionInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  commissionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  commissionText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  splitFareActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  splitFareButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
});

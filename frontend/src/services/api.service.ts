import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = (() => {
  try {
    // Lazy require to avoid breaking non-Expo environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const isWeb = typeof window !== 'undefined';
    const extra = (Constants?.expoConfig || Constants?.manifest)?.extra || {};
    const api = extra.api || {};
    return isWeb ? (api.webBaseUrl || 'http://localhost:3000') : (api.baseUrl || 'http://10.0.2.2:3000');
  } catch (_e) {
    return 'http://10.0.2.2:3000';
  }
})();

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: 'Rider' | 'Driver';
  registrationType?: 'rider' | 'driver' | 'both';
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    roles: ('rider' | 'driver')[];
    activeRole: 'rider' | 'driver';
    driverId?: string;
    driver?: {
      id: string;
      licenseNumber: string;
      vehicleInfo: string;
      rating: number;
      isOnline: boolean;
    };
  };
}

export interface RideRequest {
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  rideType: 'bike' | 'car' | 'premium';
  paymentMethod: 'cash' | 'wallet' | 'mpesa' | 'card';
  notes?: string;
}

export interface FareEstimateRequest {
  pickup: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  rideType?: 'bike' | 'car' | 'premium';
}

export interface RatingRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export interface PaymentRequest {
  amount: number;
  method: 'mpesa' | 'stripe' | 'wallet';
  description: string;
  phoneNumber?: string;
  email?: string;
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear it
          await this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', credentials);
    const { token, user } = response.data;
    await this.setToken(token);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/register', userData);
    const { token, user } = response.data;
    await this.setToken(token);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }

  async getProfile(): Promise<any> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // Rides
  async requestRide(rideData: RideRequest): Promise<any> {
    const response = await this.api.post('/rides', rideData);
    return response.data;
  }

  async cancelRide(rideId: string, reason?: string): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/cancel`, { reason });
    return response.data;
  }

  async getNearbyDrivers(lat: number, lng: number, radius?: number): Promise<any[]> {
    const response = await this.api.post('/realtime/drivers/nearby', { lat, lng, radius });
    return response.data.drivers;
  }

  async updateDriverLocation(location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }): Promise<any> {
    const response = await this.api.post('/drivers/update-location', location);
    return response.data;
  }

  async getDriverProfile(): Promise<any> {
    const response = await this.api.get('/drivers/profile');
    return response.data;
  }

  async updateDriverProfile(profileData: any): Promise<any> {
    const response = await this.api.patch('/drivers/profile', profileData);
    return response.data;
  }

  async getRides(): Promise<any[]> {
    const response = await this.api.get('/rides');
    return response.data;
  }

  async getRide(rideId: string): Promise<any> {
    const response = await this.api.get(`/rides/${rideId}`);
    return response.data;
  }

  async updateRideStatus(rideId: string, status: string): Promise<any> {
    const response = await this.api.patch(`/rides/${rideId}/status`, { status });
    return response.data;
  }


  // Payments
  async createPayment(paymentData: PaymentRequest): Promise<any> {
    const response = await this.api.post('/payments', paymentData);
    return response.data;
  }

  async getPayments(): Promise<any[]> {
    const response = await this.api.get('/payments');
    return response.data;
  }

  async getWalletBalance(): Promise<any> {
    const response = await this.api.get('/payments/wallet/balance');
    return response.data;
  }

  async getWalletTransactions(): Promise<any[]> {
    const response = await this.api.get('/payments/wallet/transactions');
    return response.data;
  }

  async addToWallet(amount: number, description: string): Promise<any> {
    const response = await this.api.post('/payments/wallet/add', { amount, description });
    return response.data;
  }

  // Maps
  async geocodeAddress(address: string): Promise<any> {
    const response = await this.api.get(`/maps/geocode?address=${encodeURIComponent(address)}`);
    return response.data;
  }

  async reverseGeocode(lat: number, lng: number): Promise<any> {
    const response = await this.api.get(`/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
    return response.data;
  }

  async searchPlaces(query: string, lat?: number, lng?: number): Promise<any[]> {
    const params = new URLSearchParams({ query });
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    }
    const response = await this.api.get(`/maps/search-places?${params}`);
    return response.data;
  }

  async getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<any> {
    const response = await this.api.post('/maps/route', { origin, destination });
    return response.data;
  }

  async findNearbyDrivers(lat: number, lng: number, radius?: number): Promise<any[]> {
    const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
    if (radius) params.append('radius', radius.toString());
    const response = await this.api.get(`/maps/nearby-drivers?${params}`);
    return response.data;
  }

  // Real-time
  async getSystemStatus(): Promise<any> {
    const response = await this.api.get('/realtime/status');
    return response.data;
  }


  async startRideTracking(rideId: string): Promise<any> {
    const response = await this.api.post(`/realtime/ride/${rideId}/track`);
    return response.data;
  }

  async stopRideTracking(rideId: string): Promise<any> {
    const response = await this.api.post(`/realtime/ride/${rideId}/stop-track`);
    return response.data;
  }


  // Notifications
  async getNotifications(): Promise<any[]> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await this.api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data.count;
  }

  // Drivers

  async getDriverRides(): Promise<any[]> {
    const response = await this.api.get('/drivers/rides');
    return response.data;
  }

  async updateDriverStatus(status: 'online' | 'offline' | 'busy' | 'available'): Promise<any> {
    const response = await this.api.patch('/drivers/status', { status });
    return response.data;
  }

  // Users
  async updateUserProfile(profileData: any): Promise<any> {
    const response = await this.api.patch('/users/profile', profileData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await this.api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }

  // New ride flow methods
  async calculateFare(fareRequest: FareEstimateRequest): Promise<any> {
    const response = await this.api.post('/rides/calculate-fare', fareRequest);
    return response.data;
  }

  async getRideTypes(): Promise<any[]> {
    const response = await this.api.get('/rides/ride-types');
    return response.data;
  }


  async rateRide(ratingData: RatingRequest): Promise<any> {
    const response = await this.api.post('/rides/rate', ratingData);
    return response.data;
  }

  async getRideHistory(limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await this.api.get(`/rides/history?${params}`);
    return response.data;
  }

  async getDriverRideHistory(limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await this.api.get(`/rides/driver/history?${params}`);
    return response.data;
  }

  async getRideReceipt(rideId: string): Promise<any> {
    const response = await this.api.get(`/rides/${rideId}/receipt`);
    return response.data;
  }

  // Edge case handling methods

  async driverCancelRide(rideId: string, reason?: string): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/driver-cancel`, { reason });
    return response.data;
  }

  async reportNoShow(rideId: string): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/no-show`);
    return response.data;
  }

  async changeDestination(rideId: string, destination: any): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/change-destination`, { destination });
    return response.data;
  }

  async reportEmergency(rideId: string, emergencyType: 'police' | 'helpline' | 'admin'): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/emergency`, { emergencyType });
    return response.data;
  }

  async retryDriverSearch(rideId: string): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/retry-driver-search`);
    return response.data;
  }

  async getFareBreakdown(rideId: string): Promise<any> {
    const response = await this.api.get(`/rides/${rideId}/fare-breakdown`);
    return response.data;
  }

  async validateFare(fareRequest: {
    pickup: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    rideType: string;
    expectedFare?: number;
  }): Promise<any> {
    const response = await this.api.post('/rides/validate-fare', fareRequest);
    return response.data;
  }

  // Fine payment methods
  async getFineStatus(): Promise<any> {
    const response = await this.api.get('/fine-payments/status');
    return response.data;
  }

  async payFine(paymentMethod: 'cash' | 'mpesa' | 'card' | 'wallet', paymentData?: any): Promise<any> {
    const response = await this.api.post('/fine-payments/pay', {
      paymentMethod,
      paymentData,
    });
    return response.data;
  }

  async checkCancellationEligibility(): Promise<any> {
    const response = await this.api.get('/fine-payments/cancellation-eligibility');
    return response.data;
  }

  // Driver-specific methods
  async getDriverRideRequests(): Promise<any> {
    const response = await this.api.get('/drivers/ride-requests');
    return response.data;
  }

  async acceptRide(rideId: string): Promise<any> {
    const response = await this.api.post(`/drivers/accept-ride/${rideId}`);
    return response.data;
  }

  async declineRide(rideId: string, reason?: string): Promise<any> {
    const response = await this.api.post(`/drivers/decline-ride/${rideId}`, { reason });
    return response.data;
  }

  async startRide(rideId: string): Promise<any> {
    const response = await this.api.post(`/drivers/start-ride/${rideId}`);
    return response.data;
  }

  async completeRide(rideId: string): Promise<any> {
    const response = await this.api.post(`/drivers/complete-ride/${rideId}`);
    return response.data;
  }

  async getDriverEarnings(): Promise<any> {
    const response = await this.api.get('/drivers/earnings');
    return response.data;
  }


  async setDriverAvailability(isAvailable: boolean, reason?: string): Promise<any> {
    const response = await this.api.post('/drivers/set-availability', {
      isAvailable,
      reason,
    });
    return response.data;
  }

  async getDriverPenaltyStatus(): Promise<any> {
    const response = await this.api.get('/drivers/penalty-status');
    return response.data;
  }

  // Rider-specific methods

  async getFareEstimate(pickup: any, destination: any, rideType?: string): Promise<any> {
    const response = await this.api.post('/riders/fare-estimate', {
      pickup,
      destination,
      rideType,
    });
    return response.data;
  }

  async rateDriver(ratingData: any): Promise<any> {
    const response = await this.api.post('/riders/rate-driver', ratingData);
    return response.data;
  }

  async getRiderRideHistory(): Promise<any> {
    const response = await this.api.get('/riders/ride-history');
    return response.data;
  }

  async getRiderFineStatus(): Promise<any> {
    const response = await this.api.get('/riders/fine-status');
    return response.data;
  }


  async getPaymentMethods(): Promise<any> {
    const response = await this.api.get('/riders/payment-methods');
    return response.data;
  }

  // Role switching methods
  async getRoleStatus(): Promise<any> {
    const response = await this.api.get('/role-switching/status');
    return response.data;
  }

  async switchRole(role: 'rider' | 'driver'): Promise<any> {
    const response = await this.api.post('/role-switching/switch', { role });
    return response.data;
  }

  async addRole(role: 'rider' | 'driver'): Promise<any> {
    const response = await this.api.post('/role-switching/add-role', { role });
    return response.data;
  }

  async removeRole(role: 'rider' | 'driver'): Promise<any> {
    const response = await this.api.post('/role-switching/remove-role', { role });
    return response.data;
  }

  async canAccessRole(role: 'rider' | 'driver'): Promise<any> {
    const response = await this.api.get(`/role-switching/can-access/${role}`);
    return response.data;
  }

  // Driver verification methods
  async submitDriverVerification(documents: any): Promise<any> {
    const response = await this.api.post('/driver-verification/submit', documents);
    return response.data;
  }

  async getDriverVerificationStatus(): Promise<any> {
    const response = await this.api.get('/driver-verification/status');
    return response.data;
  }

  async canSwitchToDriver(): Promise<any> {
    const response = await this.api.get('/driver-verification/can-switch');
    return response.data;
  }

  // Admin verification methods
  async getPendingVerifications(): Promise<any> {
    const response = await this.api.get('/driver-verification/pending');
    return response.data;
  }

  async approveDriverVerification(userId: string, notes?: string): Promise<any> {
    const response = await this.api.post(`/driver-verification/approve/${userId}`, { notes });
    return response.data;
  }

  async rejectDriverVerification(userId: string, reason: string, requiresResubmission?: boolean): Promise<any> {
    const response = await this.api.post(`/driver-verification/reject/${userId}`, { 
      reason, 
      requiresResubmission 
    });
    return response.data;
  }

  async getVerificationStats(): Promise<any> {
    const response = await this.api.get('/driver-verification/stats');
    return response.data;
  }

  // Driver registration methods
  async registerDriver(driverData: any): Promise<any> {
    const response = await this.api.post('/driver-registration/register', driverData);
    return response.data;
  }


  async getDriverVehicles(): Promise<any> {
    const response = await this.api.get('/driver-registration/vehicles');
    return response.data;
  }

  async updateVehicle(vehicleId: string, vehicleData: any): Promise<any> {
    const response = await this.api.put(`/driver-registration/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  }

  async addVehicle(vehicleData: any): Promise<any> {
    const response = await this.api.post('/driver-registration/vehicles', vehicleData);
    return response.data;
  }

  async removeVehicle(vehicleId: string): Promise<any> {
    const response = await this.api.delete(`/driver-registration/vehicles/${vehicleId}`);
    return response.data;
  }

  async checkDriverEligibility(): Promise<any> {
    const response = await this.api.get('/driver-registration/eligibility');
    return response.data;
  }

  // Cash Payment Methods
  /**
   * Confirm cash payment (Driver)
   */
  async confirmCashPaymentDriver(rideId: string, confirmed: boolean): Promise<any> {
    try {
      const response = await this.api.post(`/rides/${rideId}/cash-payment/confirm-driver`, {
        confirmed,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to confirm cash payment (driver):', error);
      throw error;
    }
  }

  /**
   * Confirm cash payment (Rider)
   */
  async confirmCashPaymentRider(rideId: string, confirmed: boolean): Promise<any> {
    try {
      const response = await this.api.post(`/rides/${rideId}/cash-payment/confirm-rider`, {
        confirmed,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to confirm cash payment (rider):', error);
      throw error;
    }
  }

  /**
   * Get cash payment status
   */
  async getCashPaymentStatus(rideId: string): Promise<any> {
    try {
      const response = await this.api.get(`/rides/${rideId}/cash-payment/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get cash payment status:', error);
      throw error;
    }
  }

  /**
   * Get disputed cash payments (Admin)
   */
  async getDisputedCashPayments(): Promise<any[]> {
    try {
      const response = await this.api.get('/rides/cash-payment/disputes');
      return response.data;
    } catch (error) {
      console.error('Failed to get disputed cash payments:', error);
      throw error;
    }
  }

  /**
   * Admin resolve cash payment dispute
   */
  async adminResolveCashDispute(rideId: string, resolution: 'confirm' | 'deny', adminNotes: string): Promise<any> {
    try {
      const response = await this.api.post(`/rides/${rideId}/cash-payment/admin-resolve`, {
        resolution,
        adminNotes,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to resolve cash dispute:', error);
      throw error;
    }
  }

  /**
   * Get cash payment statistics (Admin)
   */
  async getCashPaymentStats(): Promise<any> {
    try {
      const response = await this.api.get('/rides/cash-payment/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get cash payment stats:', error);
      throw error;
    }
  }

  // Split Fare Methods
  /**
   * Create a split fare ride
   */
  async createSplitFareRide(splitFareData: any): Promise<any> {
    try {
      const response = await this.api.post('/rides/split-fare', splitFareData);
      return response.data;
    } catch (error) {
      console.error('Failed to create split fare ride:', error);
      throw error;
    }
  }

  /**
   * Process split fare payments
   */
  async processSplitFarePayments(rideId: string): Promise<any> {
    try {
      const response = await this.api.post(`/rides/${rideId}/split-fare/process-payments`);
      return response.data;
    } catch (error) {
      console.error('Failed to process split fare payments:', error);
      throw error;
    }
  }

  /**
   * Confirm cash payment for split fare
   */
  async confirmSplitFareCashPayment(rideId: string, riderId: string, confirmed: boolean): Promise<any> {
    try {
      const response = await this.api.post(`/rides/${rideId}/split-fare/confirm-cash/${riderId}`, {
        confirmed,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to confirm split fare cash payment:', error);
      throw error;
    }
  }

  /**
   * Get split fare status
   */
  async getSplitFareStatus(rideId: string): Promise<any> {
    try {
      const response = await this.api.get(`/rides/${rideId}/split-fare/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get split fare status:', error);
      throw error;
    }
  }

  /**
   * Calculate equal split amounts
   */
  async calculateEqualSplit(totalFare: number, participantCount: number): Promise<number[]> {
    try {
      const response = await this.api.post('/rides/split-fare/calculate-equal-split', {
        totalFare,
        participantCount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to calculate equal split:', error);
      throw error;
    }
  }
}

export default new ApiService();

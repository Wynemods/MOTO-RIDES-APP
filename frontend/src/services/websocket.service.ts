import { io, Socket } from 'socket.io-client';
import ApiService from './api.service';
import Constants from 'expo-constants';

export interface WebSocketEvents {
  // Connection events
  connected: (data: { message: string; userId: string; userType: string }) => void;
  disconnected: () => void;
  error: (error: { message: string }) => void;

  // Driver events
  'driver:location:update': (data: {
    driverId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    timestamp: Date;
  }) => void;
  'driver:status:update': (data: {
    driverId: string;
    status: string;
    timestamp: Date;
  }) => void;

  // Ride events
  'ride:request:new': (data: {
    rideId: string;
    riderId: string;
    pickup: any;
    destination: any;
    fare: number;
    timestamp: Date;
  }) => void;
  'ride:accepted': (data: {
    rideId: string;
    driverId: string;
    driverName: string;
    driverPhone: string;
    estimatedArrival: number;
    timestamp: Date;
  }) => void;
  'ride:status:update': (data: {
    rideId: string;
    status: string;
    driverId?: string;
    riderId?: string;
    location?: { lat: number; lng: number };
    eta?: number;
    timestamp: Date;
  }) => void;

  // Chat events
  'chat:message:new': (data: {
    rideId: string;
    senderId: string;
    message: string;
    timestamp: Date;
  }) => void;

  // Notification events
  'notification:new': (data: {
    title: string;
    message: string;
    type: string;
    data?: any;
    timestamp: Date;
  }) => void;

  // Emergency events
  'emergency:alert:new': (data: {
    rideId: string;
    userId: string;
    type: string;
    message: string;
    location: { lat: number; lng: number };
    timestamp: Date;
  }) => void;

  // System events
  'announcement:new': (data: {
    title: string;
    message: string;
    type: string;
    timestamp: Date;
  }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    try {
      const token = await ApiService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io((() => {
        const extra: any = (Constants?.expoConfig || (Constants as any)?.manifest)?.extra || {};
        const api = extra.api || {};
        const isWeb = typeof window !== 'undefined';
        return isWeb ? (api.webBaseUrl || 'http://localhost:3000') : (api.baseUrl || 'http://10.0.2.2:3000');
      })(), {
        auth: { token },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.setupEventListeners();
      this.setupConnectionHandlers();

    } catch (error) {
      console.error('WebSocket connection error:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
      this.emit('connected', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Driver events
    this.socket.on('driver:location:update', (data) => {
      this.emit('driver:location:update', data);
    });

    this.socket.on('driver:status:update', (data) => {
      this.emit('driver:status:update', data);
    });

    // Ride events
    this.socket.on('ride:request:new', (data) => {
      this.emit('ride:request:new', data);
    });

    this.socket.on('ride:accepted', (data) => {
      this.emit('ride:accepted', data);
    });

    this.socket.on('ride:status:update', (data) => {
      this.emit('ride:status:update', data);
    });

    // Chat events
    this.socket.on('chat:message:new', (data) => {
      this.emit('chat:message:new', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });

    // Emergency events
    this.socket.on('emergency:alert:new', (data) => {
      this.emit('emergency:alert:new', data);
    });

    // System events
    this.socket.on('announcement:new', (data) => {
      this.emit('announcement:new', data);
    });
  }

  private setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    });
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  // Event management
  on<K extends keyof WebSocketEvents>(event: K, listener: WebSocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof WebSocketEvents>(event: K, listener: WebSocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, data: Parameters<WebSocketEvents[K]>[0]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  // Driver methods
  sendLocation(lat: number, lng: number, heading?: number, speed?: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:location', { lat, lng, heading, speed });
    }
  }

  updateStatus(status: 'online' | 'offline' | 'busy' | 'available') {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:status', { status });
    }
  }

  acceptRide(rideId: string, riderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride:accept', { rideId, riderId });
    }
  }

  // Rider methods
  requestRide(pickup: any, destination: any, fare: number, rideId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride:request', { pickup, destination, fare, rideId });
    }
  }

  updateRideStatus(rideId: string, status: string, riderId?: string, driverId?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride:status', { rideId, status, riderId, driverId });
    }
  }

  // Chat methods
  sendMessage(rideId: string, message: string, recipientId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message', { rideId, message, recipientId });
    }
  }

  // Emergency methods
  sendEmergencyAlert(rideId: string, type: string, message: string, location: { lat: number; lng: number }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('emergency:alert', { rideId, type, message, location });
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Get nearby drivers
  getNearbyDrivers(lat: number, lng: number, radius: number = 5000) {
    if (this.socket && this.isConnected) {
      this.socket.emit('drivers:nearby', { lat, lng, radius });
    }
  }
}

export default new WebSocketService();

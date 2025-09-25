# 🚀 Real-time Features Setup Guide

## 🎯 Real-time Features Overview

Your MotoLink app now has **complete real-time capabilities**:

- **Live Driver Tracking** - Real-time location updates
- **Ride Status Updates** - Instant ride progress notifications
- **Driver Notifications** - New ride requests, updates
- **Rider Notifications** - Driver location, ETA updates
- **Chat System** - Driver-rider communication
- **Admin Dashboard** - Real-time monitoring

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install socket.io @nestjs/websockets @nestjs/platform-socket.io
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install socket.io-client
npm start
```

## 🔧 WebSocket Events

### **Connection Events**
```typescript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Connection confirmation
socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### **Driver Events**
```typescript
// Send driver location
socket.emit('driver:location', {
  lat: -0.0236,
  lng: 37.9062,
  heading: 45,
  speed: 30
});

// Update driver status
socket.emit('driver:status', {
  status: 'available' // online, offline, busy, available
});

// Listen for ride requests
socket.on('ride:request:new', (data) => {
  console.log('New ride request:', data);
});

// Accept ride
socket.emit('ride:accept', {
  rideId: 'ride-123',
  riderId: 'rider-456'
});
```

### **Rider Events**
```typescript
// Request a ride
socket.emit('ride:request', {
  pickup: { lat: -0.0236, lng: 37.9062, address: 'Chuka University' },
  destination: { lat: -0.0200, lng: 37.9100, address: 'Town Centre' },
  fare: 500,
  rideId: 'ride-123'
});

// Listen for driver updates
socket.on('driver:location:update', (data) => {
  console.log('Driver location:', data);
});

// Listen for ride status updates
socket.on('ride:status:update', (data) => {
  console.log('Ride status:', data);
});

// Listen for ride acceptance
socket.on('ride:accepted', (data) => {
  console.log('Ride accepted by:', data.driverName);
});
```

### **Chat Events**
```typescript
// Send chat message
socket.emit('chat:message', {
  rideId: 'ride-123',
  message: 'I\'m on my way!',
  recipientId: 'driver-789'
});

// Listen for chat messages
socket.on('chat:message:new', (data) => {
  console.log('New message:', data);
});
```

### **Emergency Events**
```typescript
// Send emergency alert
socket.emit('emergency:alert', {
  rideId: 'ride-123',
  type: 'medical',
  message: 'Need medical assistance',
  location: { lat: -0.0236, lng: 37.9062 }
});

// Listen for emergency alerts
socket.on('emergency:alert:new', (data) => {
  console.log('Emergency alert:', data);
});
```

## 📱 Frontend Integration

### 1. WebSocket Service
```typescript
// src/services/websocket.service.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: { token }
    });

    this.socket.on('connected', (data) => {
      console.log('Connected to WebSocket:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Driver methods
  sendLocation(lat: number, lng: number, heading?: number, speed?: number) {
    this.socket?.emit('driver:location', { lat, lng, heading, speed });
  }

  updateStatus(status: 'online' | 'offline' | 'busy' | 'available') {
    this.socket?.emit('driver:status', { status });
  }

  // Rider methods
  requestRide(pickup: any, destination: any, fare: number, rideId: string) {
    this.socket?.emit('ride:request', { pickup, destination, fare, rideId });
  }

  // Chat methods
  sendMessage(rideId: string, message: string, recipientId: string) {
    this.socket?.emit('chat:message', { rideId, message, recipientId });
  }
}

export default new WebSocketService();
```

### 2. Real-time Location Tracking
```typescript
// src/hooks/useLocationTracking.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import WebSocketService from '../services/websocket.service';

export const useLocationTracking = (isDriver: boolean) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!isDriver) return;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Send to WebSocket
          WebSocketService.sendLocation(latitude, longitude);
        }
      );

      return () => subscription.remove();
    };

    startTracking();
  }, [isDriver]);

  return location;
};
```

### 3. Real-time Notifications
```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import WebSocketService from '../services/websocket.service';

export const useNotifications = () => {
  useEffect(() => {
    const socket = WebSocketService.socket;
    if (!socket) return;

    // Ride status updates
    socket.on('ride:status:update', (data) => {
      Alert.alert('Ride Update', data.status);
    });

    // Driver location updates
    socket.on('driver:location:update', (data) => {
      // Update map with driver location
      console.log('Driver location:', data);
    });

    // Chat messages
    socket.on('chat:message:new', (data) => {
      Alert.alert('New Message', data.message);
    });

    // Emergency alerts
    socket.on('emergency:alert:new', (data) => {
      Alert.alert('Emergency Alert', data.message);
    });

    return () => {
      socket.off('ride:status:update');
      socket.off('driver:location:update');
      socket.off('chat:message:new');
      socket.off('emergency:alert:new');
    };
  }, []);
};
```

## 🔧 Backend API Endpoints

### **Real-time Management**
```bash
# Get system status
GET /realtime/status

# Get nearby drivers
GET /realtime/drivers/nearby
{
  "lat": -0.0236,
  "lng": 37.9062,
  "radius": 5000
}

# Start ride tracking
POST /realtime/ride/:rideId/track

# Stop ride tracking
POST /realtime/ride/:rideId/stop-track

# Get active trackings
GET /realtime/tracking/active
```

### **Driver Management**
```bash
# Get driver location
GET /realtime/driver/:driverId/location

# Update driver location
POST /realtime/driver/:driverId/location
{
  "lat": -0.0236,
  "lng": 37.9062,
  "heading": 45,
  "speed": 30
}
```

### **Notifications**
```bash
# Send notification
POST /realtime/notification/send
{
  "userId": "user-123",
  "title": "Ride Accepted",
  "message": "Your driver is on the way",
  "type": "ride"
}

# Send announcement
POST /realtime/announcement/send
{
  "title": "System Maintenance",
  "message": "App will be down for 1 hour",
  "targetUsers": ["user-123", "user-456"]
}
```

## 🧪 Testing Real-time Features

### 1. Test WebSocket Connection
```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3000" -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test message
{"event": "driver:location", "data": {"lat": -0.0236, "lng": 37.9062}}
```

### 2. Test Driver Tracking
```typescript
// Test driver location updates
const testDriverTracking = () => {
  const locations = [
    { lat: -0.0236, lng: 37.9062 },
    { lat: -0.0230, lng: 37.9065 },
    { lat: -0.0225, lng: 37.9070 },
  ];

  locations.forEach((location, index) => {
    setTimeout(() => {
      WebSocketService.sendLocation(location.lat, location.lng);
    }, index * 5000);
  });
};
```

### 3. Test Ride Flow
```typescript
// Test complete ride flow
const testRideFlow = () => {
  // 1. Request ride
  WebSocketService.requestRide(
    { lat: -0.0236, lng: 37.9062, address: 'Chuka University' },
    { lat: -0.0200, lng: 37.9100, address: 'Town Centre' },
    500,
    'test-ride-123'
  );

  // 2. Driver accepts (simulate)
  setTimeout(() => {
    WebSocketService.socket?.emit('ride:accept', {
      rideId: 'test-ride-123',
      riderId: 'rider-456'
    });
  }, 2000);

  // 3. Send location updates
  setTimeout(() => {
    WebSocketService.sendLocation(-0.0230, 37.9065);
  }, 5000);
};
```

## 🔒 Security Features

### 1. JWT Authentication
- All WebSocket connections require valid JWT token
- Token is verified on connection
- User data is attached to socket

### 2. Rate Limiting
- Location updates limited to 1 per second
- Chat messages limited to 10 per minute
- Emergency alerts have higher limits

### 3. Data Validation
- All incoming data is validated
- Malicious data is rejected
- User permissions are checked

## 📊 Monitoring

### 1. Connection Monitoring
```typescript
// Get connection statistics
const stats = await fetch('/realtime/status');
const data = await stats.json();
console.log('Connected users:', data.connectedUsers);
console.log('Active trackings:', data.activeTrackings);
```

### 2. Performance Metrics
- WebSocket connection count
- Message throughput
- Response times
- Error rates

## 🚀 Production Deployment

### 1. WebSocket Scaling
- Use Redis adapter for multiple servers
- Load balance WebSocket connections
- Monitor connection limits

### 2. Security
- Use WSS (WebSocket Secure) in production
- Implement rate limiting
- Monitor for abuse

### 3. Monitoring
- Set up alerts for connection drops
- Monitor message rates
- Track error rates

## 🎉 Success!

Your MotoLink app now has:
- ✅ **Live driver tracking** - Real-time location updates
- ✅ **Instant notifications** - Push and in-app notifications
- ✅ **Real-time chat** - Driver-rider communication
- ✅ **Live ride updates** - Status and progress tracking
- ✅ **Emergency alerts** - Safety features
- ✅ **Admin monitoring** - Real-time dashboard

## 🚀 Next Steps

Now that real-time features are working, we can:
1. **Connect frontend to backend** (API integration)
2. **Deploy to production** (Hosting setup)
3. **Add advanced features** (AI, analytics)

---

**🎉 Congratulations! Your app now has complete real-time capabilities!**

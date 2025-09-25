import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'rider' | 'driver' | 'admin';
  driverId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/',
})
export class WebsocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketsGateway');
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private driverLocations: Map<string, { lat: number; lng: number; timestamp: Date }> = new Map();

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = this.jwtService.verify(token);
        const user = await this.authService.findUserById(payload.sub);
        
        if (!user) {
          this.logger.warn('WebSocket connection rejected: Invalid user');
          client.disconnect();
          return;
        }

        // Set user data on socket
        client.userId = user.id;
        const activeRole = (user as any).activeRole || (Array.isArray((user as any).roles) && (user as any).roles.includes('driver') ? 'driver' : 'rider');
        client.userType = activeRole === 'driver' ? 'driver' : 'rider';
        if ((user as any).driver?.id) {
          client.driverId = (user as any).driver.id;
        }

        // Store connected user
        this.connectedUsers.set(user.id, client);
        
        this.logger.log(`WebSocket connected: User ${user.id} (${client.userType})`);
      } catch (error) {
        this.logger.warn('WebSocket connection rejected: Invalid token', { error: error.message });
        client.disconnect();
        return;
      }

      // Join user to their personal room
      client.join(`user:${client.userId}`);

      // Join driver to driver room if applicable
      if (client.userType === 'driver') {
        client.join('drivers');
        this.logger.log(`Driver ${client.userId} connected`);
      } else {
        client.join('riders');
        this.logger.log(`Rider ${client.userId} connected`);
      }

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected successfully',
        userId: client.userId,
        userType: client.userType,
      });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      
      if (client.userType === 'driver') {
        this.driverLocations.delete(client.userId);
        this.logger.log(`Driver ${client.userId} disconnected`);
      } else {
        this.logger.log(`Rider ${client.userId} disconnected`);
      }
    }
  }

  // Driver location tracking
  @SubscribeMessage('driver:location')
  handleDriverLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat: number; lng: number; heading?: number; speed?: number }
  ) {
    if (client.userType !== 'driver') {
      client.emit('error', { message: 'Only drivers can send location updates' });
      return;
    }

    // Store driver location
    this.driverLocations.set(client.userId, {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(),
    });

    // Broadcast to all riders
    this.server.to('riders').emit('driver:location:update', {
      driverId: client.userId,
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      speed: data.speed,
      timestamp: new Date(),
    });

    this.logger.debug(`Driver ${client.userId} location updated: ${data.lat}, ${data.lng}`);
  }

  // Driver status updates
  @SubscribeMessage('driver:status')
  handleDriverStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'offline' | 'busy' | 'available' }
  ) {
    if (client.userType !== 'driver') {
      client.emit('error', { message: 'Only drivers can update status' });
      return;
    }

    // Broadcast driver status to all riders
    this.server.to('riders').emit('driver:status:update', {
      driverId: client.userId,
      status: data.status,
      timestamp: new Date(),
    });

    this.logger.log(`Driver ${client.userId} status: ${data.status}`);
  }

  // Ride request handling
  @SubscribeMessage('ride:request')
  handleRideRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      pickup: { lat: number; lng: number; address: string };
      destination: { lat: number; lng: number; address: string };
      fare: number;
      rideId: string;
    }
  ) {
    if (client.userType !== 'rider') {
      client.emit('error', { message: 'Only riders can request rides' });
      return;
    }

    // Broadcast ride request to all available drivers
    this.server.to('drivers').emit('ride:request:new', {
      rideId: data.rideId,
      riderId: client.userId,
      pickup: data.pickup,
      destination: data.destination,
      fare: data.fare,
      timestamp: new Date(),
    });

    this.logger.log(`Ride request from rider ${client.userId}: ${data.rideId}`);
  }

  // Driver accepts ride
  @SubscribeMessage('ride:accept')
  handleRideAccept(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string; driverId: string; riderId: string }
  ) {
    if (client.userType !== 'driver') {
      client.emit('error', { message: 'Only drivers can accept rides' });
      return;
    }

    // Notify the specific rider
    this.server.to(`user:${data.riderId}`).emit('ride:accepted', {
      rideId: data.rideId,
      driverId: client.userId,
      driverName: 'Driver Name', // You can fetch this from database
      driverPhone: '+254712345678', // You can fetch this from database
      estimatedArrival: 5, // minutes
      timestamp: new Date(),
    });

    this.logger.log(`Driver ${client.userId} accepted ride ${data.rideId}`);
  }

  // Ride status updates
  @SubscribeMessage('ride:status')
  handleRideStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      rideId: string;
      status: 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
      riderId?: string;
      driverId?: string;
    }
  ) {
    // Notify both rider and driver
    if (data.riderId) {
      this.server.to(`user:${data.riderId}`).emit('ride:status:update', {
        rideId: data.rideId,
        status: data.status,
        timestamp: new Date(),
      });
    }

    if (data.driverId) {
      this.server.to(`user:${data.driverId}`).emit('ride:status:update', {
        rideId: data.rideId,
        status: data.status,
        timestamp: new Date(),
      });
    }

    this.logger.log(`Ride ${data.rideId} status: ${data.status}`);
  }

  // Chat messages
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      rideId: string;
      message: string;
      recipientId: string;
    }
  ) {
    // Send message to the recipient
    this.server.to(`user:${data.recipientId}`).emit('chat:message:new', {
      rideId: data.rideId,
      senderId: client.userId,
      message: data.message,
      timestamp: new Date(),
    });

    this.logger.log(`Chat message in ride ${data.rideId} from ${client.userId}`);
  }

  // Emergency alerts
  @SubscribeMessage('emergency:alert')
  handleEmergencyAlert(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      rideId: string;
      type: 'medical' | 'safety' | 'technical';
      message: string;
      location: { lat: number; lng: number };
    }
  ) {
    // Notify admin and emergency contacts
    this.server.to('admin').emit('emergency:alert:new', {
      rideId: data.rideId,
      userId: client.userId,
      type: data.type,
      message: data.message,
      location: data.location,
      timestamp: new Date(),
    });

    this.logger.warn(`Emergency alert from ${client.userId} in ride ${data.rideId}`);
  }

  // Get nearby drivers
  @SubscribeMessage('drivers:nearby')
  handleGetNearbyDrivers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat: number; lng: number; radius: number }
  ) {
    const nearbyDrivers = Array.from(this.driverLocations.entries())
      .map(([driverId, location]) => ({
        driverId,
        lat: location.lat,
        lng: location.lng,
        timestamp: location.timestamp,
        distance: this.calculateDistance(data.lat, data.lng, location.lat, location.lng),
      }))
      .filter(driver => driver.distance <= data.radius)
      .sort((a, b) => a.distance - b.distance);

    client.emit('drivers:nearby:response', {
      drivers: nearbyDrivers,
      timestamp: new Date(),
    });
  }

  // Helper method to calculate distance
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Public methods for server-side events
  notifyRideUpdate(rideId: string, update: any) {
    this.server.emit('ride:update', {
      rideId,
      update,
      timestamp: new Date(),
    });
  }

  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  notifyDrivers(event: string, data: any) {
    this.server.to('drivers').emit(event, data);
  }

  notifyRiders(event: string, data: any) {
    this.server.to('riders').emit(event, data);
  }

  getConnectedDrivers(): string[] {
    return Array.from(this.connectedUsers.entries())
      .filter(([_, socket]) => socket.userType === 'driver')
      .map(([userId, _]) => userId);
  }

  getDriverLocation(driverId: string) {
    return this.driverLocations.get(driverId);
  }
}

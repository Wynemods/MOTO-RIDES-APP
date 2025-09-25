import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.driver.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: true,
      },
    });
  }

  async findOne(id: string): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async findByUserId(userId: string): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async createDriver(userId: string, driverData: {
    licenseNumber: string;
    licenseExpiry: Date;
  }): Promise<any> {
    // Check if user already has a driver profile
    const existingDriver = await this.prisma.driver.findFirst({
      where: { 
        OR: [
          { name: { contains: userId } }, // Temporary check
          { phoneNumber: { contains: userId } }
        ]
      }
    });

    if (existingDriver) {
      throw new BadRequestException('Driver profile already exists');
    }

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const driver = await this.prisma.driver.create({
      data: {
        name: user.name,
        phoneNumber: user.phone,
        licenseNumber: driverData.licenseNumber,
        licenseExpiry: driverData.licenseExpiry,
        status: 'offline',
      },
    });

    // Update user to link with driver
    await this.prisma.user.update({
      where: { id: userId },
      data: { driverId: driver.id }
    });

    return driver;
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const validStatuses = ['OFFLINE', 'ONLINE', 'BUSY', 'AVAILABLE'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.prisma.driver.update({
      where: { id },
      data: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: true,
      },
    });
  }

  async updateLocation(id: string, latitude: number, longitude: number, heading?: number, speed?: number): Promise<any> {
    return this.prisma.driver.update({
      where: { id },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        currentHeading: heading,
        currentSpeed: speed,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: true,
      },
    });
  }

  async addVehicle(driverId: string, vehicleData: {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color: string;
    type: 'MOTORCYCLE' | 'SCOOTER' | 'BICYCLE';
    image?: string;
  }): Promise<any> {
    // Check if plate number already exists
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { numberPlate: vehicleData.plateNumber }
    });

    if (existingVehicle) {
      throw new BadRequestException('Vehicle with this plate number already exists');
    }

    return this.prisma.vehicle.create({
      data: {
        driverId,
        brand: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        numberPlate: vehicleData.plateNumber,
        color: vehicleData.color,
        type: vehicleData.type.toLowerCase() as any,
        // image: vehicleData.image, // Remove if not in schema
      },
    });
  }

  async updateVehicle(id: string, vehicleData: Partial<{
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color: string;
    type: 'MOTORCYCLE' | 'SCOOTER' | 'BICYCLE';
    image: string;
    isActive: boolean;
  }>): Promise<any> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...vehicleData,
        type: vehicleData.type?.toLowerCase() as any,
      },
    });
  }

  async getDriverRides(driverId: string): Promise<any[]> {
    return this.prisma.ride.findMany({
      where: { driverId },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverEarnings(driverId: string): Promise<{ totalEarnings: number; totalRides: number; averageRating: number }> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        totalEarnings: true,
        totalRides: true,
        rating: true,
      }
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      totalEarnings: Number(driver.totalEarnings),
      totalRides: driver.totalRides,
      averageRating: driver.rating,
    };
  }

  async findNearbyDrivers(lat: number, lng: number, radius: number = 5000): Promise<any[]> {
    // This is a simplified implementation
    // In production, you'd use PostGIS or similar for proper geographic queries
    const drivers = await this.prisma.driver.findMany({
      where: {
        status: 'available',
        currentLat: {
          not: null,
        },
        currentLng: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
          }
        },
        vehicles: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    // Filter by distance (simplified)
    return drivers.filter(driver => {
      if (!driver.currentLat || !driver.currentLng) return false;
      const distance = this.calculateDistance(lat, lng, Number(driver.currentLat), Number(driver.currentLng));
      return distance <= radius;
    });
  }

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
}

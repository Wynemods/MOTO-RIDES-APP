import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverProfileDto } from '../dto/update-driver-profile.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

@Injectable()
export class DriverRegistrationService {
  constructor(private prisma: PrismaService) {}

  async createDriver(userId: string, createDriverDto: CreateDriverDto) {
    const { 
      name, 
      phoneNumber, 
      profilePictureUrl, 
      licenseNumber, 
      licenseExpiry, 
      governmentId,
      vehicle 
    } = createDriverDto;

    // Check if driver already exists
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        OR: [
          { phoneNumber },
          { licenseNumber },
          { userId }
        ]
      }
    });

    if (existingDriver) {
      throw new ConflictException('Driver already exists with this phone number, license, or user ID');
    }

    // Check if license number is already taken
    const licenseExists = await this.prisma.driver.findUnique({
      where: { licenseNumber }
    });

    if (licenseExists) {
      throw new ConflictException('License number already registered');
    }

    // Create driver with vehicle
    const driver = await this.prisma.driver.create({
      data: {
        name,
        phoneNumber,
        profilePictureUrl,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        governmentId,
        userId,
        vehicles: {
          create: {
            type: vehicle.type,
            brand: vehicle.brand,
            model: vehicle.model || '',
            color: vehicle.color,
            numberPlate: vehicle.numberPlate,
            year: vehicle.year,
            insuranceDocUrl: vehicle.insuranceDocUrl
          }
        }
      },
      include: {
        vehicles: true,
        user: true
      }
    });

    return driver;
  }

  async getDriverProfile(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicles: true,
        user: true
      }
    });

    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    return driver;
  }

  async updateDriverProfile(driverId: string, updateDto: UpdateDriverProfileDto) {
    const { name, phoneNumber, profilePictureUrl } = updateDto;

    // Check if phone number is already taken by another driver
    if (phoneNumber) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: {
          phoneNumber,
          id: { not: driverId }
        }
      });

      if (existingDriver) {
        throw new ConflictException('Phone number already registered to another driver');
      }
    }

    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(profilePictureUrl && { profilePictureUrl })
      },
      include: {
        vehicles: true,
        user: true
      }
    });

    return driver;
  }

  async updateVehicle(driverId: string, vehicleId: string, updateDto: UpdateVehicleDto) {
    const { type, brand, model, color, numberPlate, year, insuranceDocUrl } = updateDto;

    // Check if number plate is already taken by another vehicle
    if (numberPlate) {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          numberPlate,
          id: { not: vehicleId },
          driverId: { not: driverId }
        }
      });

      if (existingVehicle) {
        throw new ConflictException('Number plate already registered to another vehicle');
      }
    }

    // Check if vehicle belongs to driver
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId
      }
    });

    if (!vehicle) {
      throw new BadRequestException('Vehicle not found or does not belong to driver');
    }

    // Determine if this is a sensitive update requiring re-verification
    const sensitiveFields = ['numberPlate'];
    const hasSensitiveChanges = sensitiveFields.some(field => 
      updateDto[field] && updateDto[field] !== vehicle[field]
    );

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(type && { type }),
        ...(brand && { brand }),
        ...(model && { model }),
        ...(color && { color }),
        ...(numberPlate && { numberPlate }),
        ...(year && { year }),
        ...(insuranceDocUrl !== undefined && { insuranceDocUrl }),
        // Reset verification if sensitive fields changed
        ...(hasSensitiveChanges && { isVerified: false })
      }
    });

    // If sensitive changes, also reset driver verification
    if (hasSensitiveChanges) {
      await this.prisma.driver.update({
        where: { id: driverId },
        data: { isVerified: false }
      });
    }

    return updatedVehicle;
  }

  async addVehicle(driverId: string, vehicleData: any) {
    // Check if number plate is already taken
    if (vehicleData.numberPlate) {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          numberPlate: vehicleData.numberPlate,
          driverId: { not: driverId }
        }
      });

      if (existingVehicle) {
        throw new ConflictException('Number plate already registered to another vehicle');
      }
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        driverId
      }
    });

    return vehicle;
  }

  async removeVehicle(driverId: string, vehicleId: string) {
    // Check if vehicle belongs to driver
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId
      }
    });

    if (!vehicle) {
      throw new BadRequestException('Vehicle not found or does not belong to driver');
    }

    // Check if this is the only vehicle
    const vehicleCount = await this.prisma.vehicle.count({
      where: { driverId }
    });

    if (vehicleCount <= 1) {
      throw new BadRequestException('Cannot remove the only vehicle. Drivers must have at least one vehicle.');
    }

    await this.prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    return { message: 'Vehicle removed successfully' };
  }

  async getDriverVehicles(driverId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    });

    return vehicles;
  }

  async checkDriverEligibility(userId: string) {
    // Check if user has driver role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        roles: true, 
        activeRole: true, 
        driverVerified: true,
        driverVerificationStatus: true
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hasDriverRole = user.roles.includes('driver');
    const canRegister = hasDriverRole && user.driverVerified;

    return {
      hasDriverRole,
      canRegister,
      verificationStatus: user.driverVerificationStatus,
      driverVerified: user.driverVerified
    };
  }
}

import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface DriverDocument {
  type: 'government_id' | 'drivers_license' | 'vehicle_registration' | 'vehicle_insurance';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface DriverVerificationRequest {
  governmentId: DriverDocument;
  driversLicense: DriverDocument;
  vehicleRegistration: DriverDocument;
  vehicleInsurance?: DriverDocument;
  additionalNotes?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verificationStatus: string;
  missingDocuments?: string[];
  nextSteps?: string[];
}

@Injectable()
export class DriverVerificationService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Submit driver verification documents
   */
  async submitVerificationDocuments(
    userId: string,
    documents: DriverVerificationRequest,
    vehicleDetails?: {
      type: 'motorcycle' | 'car' | 'lorry';
      brand: string;
      model?: string;
      color: string;
      numberPlate: string;
      year?: number;
    }
  ): Promise<VerificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: true,
        driverVerificationStatus: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    if (!user.roles.includes('driver')) {
      throw new BadRequestException('User does not have driver role');
    }

    // Check if already verified
    if (user.driverVerificationStatus === 'approved') {
      throw new BadRequestException('Driver is already verified');
    }

    // Validate required documents
    const validationResult = this.validateDocuments(documents);
    if (!validationResult.isValid) {
      return {
        success: false,
        message: 'Missing required documents',
        verificationStatus: 'pending',
        missingDocuments: validationResult.missingDocuments,
        nextSteps: ['Please upload all required documents'],
      };
    }

    // Save verification documents
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        driverVerificationDocuments: documents as any,
        driverVerificationStatus: 'under_review',
        driverVerificationDate: new Date(),
      },
    });

    // Create or update driver profile with vehicle details if provided
    if (vehicleDetails) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: { userId }
      });

      if (existingDriver) {
        // Update existing driver
        await this.prisma.driver.update({
          where: { id: existingDriver.id },
          data: {
            name: vehicleDetails.brand, // This should come from user profile
            governmentId: documents.governmentId.fileUrl,
            licenseNumber: documents.driversLicense.fileUrl,
          }
        });

        // Update or create vehicle
        const existingVehicle = await this.prisma.vehicle.findFirst({
          where: { driverId: existingDriver.id }
        });

        if (existingVehicle) {
          await this.prisma.vehicle.update({
            where: { id: existingVehicle.id },
            data: {
              type: vehicleDetails.type,
              brand: vehicleDetails.brand,
              model: vehicleDetails.model || '',
              color: vehicleDetails.color,
              numberPlate: vehicleDetails.numberPlate,
              year: vehicleDetails.year,
            }
          });
        } else {
          await this.prisma.vehicle.create({
            data: {
              type: vehicleDetails.type,
              brand: vehicleDetails.brand,
              model: vehicleDetails.model || '',
              color: vehicleDetails.color,
              numberPlate: vehicleDetails.numberPlate,
              year: vehicleDetails.year,
              driverId: existingDriver.id
            }
          });
        }
      } else {
        // Create new driver profile
        const driver = await this.prisma.driver.create({
          data: {
            name: vehicleDetails.brand, // This should come from user profile
            phoneNumber: '', // This should come from user profile
            governmentId: documents.governmentId.fileUrl,
            licenseNumber: documents.driversLicense.fileUrl,
            licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            userId,
            vehicles: {
              create: {
                type: vehicleDetails.type,
                brand: vehicleDetails.brand,
                model: vehicleDetails.model || '',
                color: vehicleDetails.color,
                numberPlate: vehicleDetails.numberPlate,
                year: vehicleDetails.year,
              }
            }
          }
        });
      }
    }

    // Send notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Verification Documents Submitted',
      message: 'Your driver verification documents have been submitted and are under review.',
      type: 'system',
      data: {
        verificationStatus: 'under_review',
        submittedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Verification documents submitted successfully. They are now under review.',
      verificationStatus: 'under_review',
      nextSteps: [
        'Wait for admin review (usually 24-48 hours)',
        'Check your notifications for updates',
        'You can track verification status in your profile',
      ],
    };
  }

  /**
   * Get driver verification status
   */
  async getVerificationStatus(userId: string): Promise<{
    status: string;
    verified: boolean;
    documents: any;
    notes?: string;
    submittedAt?: Date;
    canSwitchToDriver: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        driverVerified: true,
        driverVerificationStatus: true,
        driverVerificationDocuments: true,
        driverVerificationNotes: true,
        driverVerificationDate: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canSwitchToDriver = user.roles.includes('driver') && user.driverVerified;

    return {
      status: user.driverVerificationStatus,
      verified: user.driverVerified,
      documents: user.driverVerificationDocuments,
      notes: user.driverVerificationNotes,
      submittedAt: user.driverVerificationDate,
      canSwitchToDriver,
    };
  }

  /**
   * Admin: Approve driver verification
   */
  async approveDriverVerification(
    userId: string,
    adminId: string,
    notes?: string
  ): Promise<VerificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        driverVerificationStatus: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes('driver')) {
      throw new BadRequestException('User does not have driver role');
    }

    if (user.driverVerificationStatus !== 'under_review') {
      throw new BadRequestException('Driver verification is not under review');
    }

    // Update verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        driverVerified: true,
        driverVerificationStatus: 'approved',
        driverVerificationNotes: notes,
      },
    });

    // Send approval notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Driver Verification Approved',
      message: 'Congratulations! Your driver verification has been approved. You can now switch to Driver Mode.',
      type: 'system',
      data: {
        verifiedBy: adminId,
        verifiedAt: new Date(),
        notes,
      },
    });

    return {
      success: true,
      message: 'Driver verification approved successfully',
      verificationStatus: 'approved',
    };
  }

  /**
   * Admin: Reject driver verification
   */
  async rejectDriverVerification(
    userId: string,
    adminId: string,
    reason: string,
    requiresResubmission: boolean = true
  ): Promise<VerificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        driverVerificationStatus: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes('driver')) {
      throw new BadRequestException('User does not have driver role');
    }

    if (user.driverVerificationStatus !== 'under_review') {
      throw new BadRequestException('Driver verification is not under review');
    }

    const newStatus = requiresResubmission ? 'requires_resubmission' : 'rejected';

    // Update verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        driverVerified: false,
        driverVerificationStatus: newStatus,
        driverVerificationNotes: reason,
      },
    });

    // Send rejection notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Driver Verification Update',
      message: `Your driver verification has been ${newStatus === 'rejected' ? 'rejected' : 'returned for resubmission'}. Reason: ${reason}`,
      type: 'system',
      data: {
        rejectedBy: adminId,
        rejectedAt: new Date(),
        reason,
        requiresResubmission,
      },
    });

    return {
      success: true,
      message: `Driver verification ${newStatus === 'rejected' ? 'rejected' : 'returned for resubmission'}`,
      verificationStatus: newStatus,
    };
  }

  /**
   * Get pending verifications for admin review
   */
  async getPendingVerifications(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        driverVerificationStatus: 'under_review',
        roles: {
          has: 'driver',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        driverVerificationDocuments: true,
        driverVerificationDate: true,
        driverVerificationNotes: true,
      },
      orderBy: {
        driverVerificationDate: 'asc',
      },
    });

    return users;
  }

  /**
   * Validate required documents
   */
  private validateDocuments(documents: DriverVerificationRequest): {
    isValid: boolean;
    missingDocuments: string[];
  } {
    const missingDocuments: string[] = [];

    if (!documents.governmentId) {
      missingDocuments.push('Government ID');
    }
    if (!documents.driversLicense) {
      missingDocuments.push('Driver\'s License');
    }
    if (!documents.vehicleRegistration) {
      missingDocuments.push('Vehicle Registration');
    }

    return {
      isValid: missingDocuments.length === 0,
      missingDocuments,
    };
  }

  /**
   * Check if user can switch to driver mode
   */
  async canSwitchToDriverMode(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        driverVerified: true,
        driverVerificationStatus: true,
      },
    });

    if (!user) {
      return false;
    }

    return user.roles.includes('driver') && user.driverVerified;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalDrivers: number;
    verifiedDrivers: number;
    pendingVerifications: number;
    rejectedVerifications: number;
    underReview: number;
  }> {
    const stats = await this.prisma.user.aggregate({
      _count: {
        id: true,
      },
      where: {
        roles: {
          has: 'driver',
        },
      },
    });

    const verifiedDrivers = await this.prisma.user.count({
      where: {
        roles: {
          has: 'driver',
        },
        driverVerified: true,
      },
    });

    const pendingVerifications = await this.prisma.user.count({
      where: {
        roles: {
          has: 'driver',
        },
        driverVerificationStatus: 'pending',
      },
    });

    const rejectedVerifications = await this.prisma.user.count({
      where: {
        roles: {
          has: 'driver',
        },
        driverVerificationStatus: 'rejected',
      },
    });

    const underReview = await this.prisma.user.count({
      where: {
        roles: {
          has: 'driver',
        },
        driverVerificationStatus: 'under_review',
      },
    });

    return {
      totalDrivers: stats._count.id,
      verifiedDrivers,
      pendingVerifications,
      rejectedVerifications,
      underReview,
    };
  }
}

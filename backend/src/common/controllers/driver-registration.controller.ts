import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseUUIDPipe 
} from '@nestjs/common';
import { DriverRegistrationService } from '../services/driver-registration.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverProfileDto } from '../dto/update-driver-profile.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('driver-registration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverRegistrationController {
  constructor(private driverRegistrationService: DriverRegistrationService) {}

  @Post('register')
  @Roles('driver')
  async registerDriver(
    @CurrentUser() user: any,
    @Body() createDriverDto: CreateDriverDto
  ) {
    return this.driverRegistrationService.createDriver(user.id, createDriverDto);
  }

  @Get('profile')
  @Roles('driver')
  async getDriverProfile(@CurrentUser() user: any) {
    // Get driver by userId
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.getDriverProfile(driver.id);
  }

  @Put('profile')
  @Roles('driver')
  async updateDriverProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateDriverProfileDto
  ) {
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.updateDriverProfile(driver.id, updateDto);
  }

  @Get('vehicles')
  @Roles('driver')
  async getDriverVehicles(@CurrentUser() user: any) {
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.getDriverVehicles(driver.id);
  }

  @Put('vehicles/:vehicleId')
  @Roles('driver')
  async updateVehicle(
    @CurrentUser() user: any,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() updateDto: UpdateVehicleDto
  ) {
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.updateVehicle(driver.id, vehicleId, updateDto);
  }

  @Post('vehicles')
  @Roles('driver')
  async addVehicle(
    @CurrentUser() user: any,
    @Body() vehicleData: any
  ) {
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.addVehicle(driver.id, vehicleData);
  }

  @Delete('vehicles/:vehicleId')
  @Roles('driver')
  async removeVehicle(
    @CurrentUser() user: any,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string
  ) {
    const driver = await this.driverRegistrationService.prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      throw new Error('Driver profile not found');
    }

    return this.driverRegistrationService.removeVehicle(driver.id, vehicleId);
  }

  @Get('eligibility')
  @Roles('driver')
  async checkEligibility(@CurrentUser() user: any) {
    return this.driverRegistrationService.checkDriverEligibility(user.id);
  }
}

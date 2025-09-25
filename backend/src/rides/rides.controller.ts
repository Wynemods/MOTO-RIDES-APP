import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRideDto, RideType } from './dto/create-ride.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { CreateRatingDto } from './dto/rating.dto';
import { CreateSplitFareRideDto, SplitFareConfirmationDto, SplitFareStatusResponse } from './dto/split-fare.dto';
import { FareValidationService } from '../common/services/fare-validation.service';

@ApiTags('Rides')
@Controller('rides')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly fareValidationService: FareValidationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ride' })
  @ApiResponse({ status: 201, description: 'Ride created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride data' })
  create(@Request() req, @Body() createRideDto: CreateRideDto) {
    return this.ridesService.createRide(req.user.id, createRideDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rides' })
  @ApiResponse({ status: 200, description: 'Rides retrieved successfully' })
  findAll() {
    return this.ridesService.findAll();
  }

  @Get('my-rides')
  @ApiOperation({ summary: 'Get my rides' })
  @ApiResponse({ status: 200, description: 'User rides retrieved successfully' })
  getMyRides(@Request() req) {
    return this.ridesService.findByRiderId(req.user.id);
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get rides for a specific driver' })
  @ApiResponse({ status: 200, description: 'Driver rides retrieved successfully' })
  getDriverRides(@Param('driverId') driverId: string) {
    return this.ridesService.findByDriverId(driverId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby available rides' })
  @ApiResponse({ status: 200, description: 'Nearby rides found' })
  findNearbyRides(@Request() req, @Body() body: { lat: number; lng: number; radius?: number }) {
    return this.ridesService.findNearbyRides(body.lat, body.lng, body.radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride by ID' })
  @ApiResponse({ status: 200, description: 'Ride retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ride status' })
  @ApiResponse({ status: 200, description: 'Ride status updated successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  updateStatus(@Param('id') id: string, @Body() updateRideStatusDto: UpdateRideStatusDto) {
    return this.ridesService.updateStatus(id, updateRideStatusDto.status, updateRideStatusDto.notes);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a ride (driver only)' })
  @ApiResponse({ status: 200, description: 'Ride accepted successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  acceptRide(@Param('id') id: string, @Request() req) {
    return this.ridesService.acceptRide(id, req.user.id);
  }


  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a ride (driver only)' })
  @ApiResponse({ status: 200, description: 'Ride completed successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  completeRide(@Param('id') id: string, @Request() req) {
    return this.ridesService.completeRide(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ride' })
  @ApiResponse({ status: 200, description: 'Ride deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  remove(@Param('id') id: string) {
    return this.ridesService.remove(id);
  }

  @Post('calculate-fare')
  @ApiOperation({ summary: 'Calculate fare estimate for a ride' })
  @ApiResponse({ status: 200, description: 'Fare calculated successfully' })
  calculateFare(@Body() body: { pickup: any; destination: any; rideType?: RideType }) {
    return this.ridesService.calculateFareEstimate(
      body.pickup,
      body.destination,
      body.rideType || RideType.BIKE
    );
  }

  @Get('ride-types')
  @ApiOperation({ summary: 'Get available ride types' })
  @ApiResponse({ status: 200, description: 'Ride types retrieved successfully' })
  getRideTypes() {
    return this.ridesService.getRideTypes();
  }

  @Post('rate')
  @ApiOperation({ summary: 'Rate a completed ride' })
  @ApiResponse({ status: 201, description: 'Ride rated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating data' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  rateRide(@Request() req, @Body() ratingDto: CreateRatingDto) {
    return this.ridesService.rateRide(ratingDto, req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get ride history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Ride history retrieved successfully' })
  getRideHistory(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.ridesService.getRideHistory(req.user.id, limit, offset);
  }

  @Get('driver/history')
  @ApiOperation({ summary: 'Get ride history for the authenticated driver' })
  @ApiResponse({ status: 200, description: 'Driver ride history retrieved successfully' })
  getDriverRideHistory(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.ridesService.getDriverRideHistory(req.user.driverId, limit, offset);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Get ride receipt' })
  @ApiResponse({ status: 200, description: 'Ride receipt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  getRideReceipt(@Param('id') id: string, @Request() req) {
    return this.ridesService.getRideReceipt(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a ride' })
  @ApiResponse({ status: 200, description: 'Ride cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  cancelRide(@Param('id') id: string, @Request() req, @Body() body: { reason?: string }) {
    return this.ridesService.cancelRide(id, req.user.id, body.reason);
  }

  @Post(':id/driver-cancel')
  @ApiOperation({ summary: 'Cancel a ride (driver)' })
  @ApiResponse({ status: 200, description: 'Ride cancelled by driver' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  driverCancelRide(@Param('id') id: string, @Request() req, @Body() body: { reason?: string }) {
    return this.ridesService.driverCancelRide(id, req.user.driverId, body.reason);
  }

  @Post(':id/no-show')
  @ApiOperation({ summary: 'Report passenger no-show' })
  @ApiResponse({ status: 200, description: 'No-show reported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid no-show report' })
  reportNoShow(@Param('id') id: string, @Request() req) {
    return this.ridesService.reportNoShow(id, req.user.driverId);
  }

  @Post(':id/change-destination')
  @ApiOperation({ summary: 'Change destination mid-ride' })
  @ApiResponse({ status: 200, description: 'Destination changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid destination change' })
  changeDestination(@Param('id') id: string, @Request() req, @Body() body: { destination: any }) {
    return this.ridesService.changeDestination(id, body.destination, req.user.driverId);
  }

  @Post(':id/emergency')
  @ApiOperation({ summary: 'Report emergency situation' })
  @ApiResponse({ status: 200, description: 'Emergency reported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid emergency report' })
  reportEmergency(@Param('id') id: string, @Request() req, @Body() body: { emergencyType: string }) {
    return this.ridesService.reportEmergency(id, req.user.id, body.emergencyType as 'admin' | 'police' | 'helpline');
  }

  @Post(':id/retry-driver-search')
  @ApiOperation({ summary: 'Retry driver search' })
  @ApiResponse({ status: 200, description: 'Driver search retried' })
  @ApiResponse({ status: 400, description: 'Invalid retry request' })
  retryDriverSearch(@Param('id') id: string, @Request() req) {
    return this.ridesService.retryDriverSearch(id, req.user.id);
  }

  @Get(':id/fare-breakdown')
  @ApiOperation({ summary: 'Get fare breakdown for dispute resolution' })
  @ApiResponse({ status: 200, description: 'Fare breakdown retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  getFareBreakdown(@Param('id') id: string, @Request() req) {
    return this.ridesService.getFareBreakdown(id, req.user.id);
  }

  @Post('validate-fare')
  @ApiOperation({ summary: 'Validate fare calculation before ride confirmation' })
  @ApiResponse({ status: 200, description: 'Fare validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid fare data' })
  validateFare(@Body() body: { 
    pickup: { lat: number; lng: number }; 
    destination: { lat: number; lng: number }; 
    rideType: string;
    expectedFare?: number;
  }) {
    if (body.expectedFare) {
      return this.fareValidationService.validateFareForConfirmation(
        body.pickup,
        body.destination,
        body.rideType,
        body.expectedFare
      );
    }
    
    return this.fareValidationService.getFareEstimate(
      body.pickup,
      body.destination,
      body.rideType
    );
  }

  // Cash Payment Endpoints
  @Post(':id/cash-payment/confirm-driver')
  @ApiOperation({ summary: 'Confirm cash payment (Driver)' })
  @ApiResponse({ status: 200, description: 'Cash payment confirmation processed' })
  @ApiResponse({ status: 400, description: 'Invalid confirmation request' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  confirmCashPaymentDriver(@Param('id') id: string, @Request() req, @Body() body: { confirmed: boolean }) {
    return this.ridesService.confirmCashPaymentDriver(id, req.user.driverId, body.confirmed);
  }

  @Post(':id/cash-payment/confirm-rider')
  @ApiOperation({ summary: 'Confirm cash payment (Rider)' })
  @ApiResponse({ status: 200, description: 'Cash payment confirmation processed' })
  @ApiResponse({ status: 400, description: 'Invalid confirmation request' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  confirmCashPaymentRider(@Param('id') id: string, @Request() req, @Body() body: { confirmed: boolean }) {
    return this.ridesService.confirmCashPaymentRider(id, req.user.id, body.confirmed);
  }

  @Get(':id/cash-payment/status')
  @ApiOperation({ summary: 'Get cash payment status' })
  @ApiResponse({ status: 200, description: 'Cash payment status retrieved' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  getCashPaymentStatus(@Param('id') id: string, @Request() req) {
    return this.ridesService.getCashPaymentStatus(id, req.user.id);
  }

  @Get('cash-payment/disputes')
  @ApiOperation({ summary: 'Get disputed cash payments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Disputed cash payments retrieved' })
  getDisputedCashPayments() {
    return this.ridesService.getDisputedCashPayments();
  }

  @Post(':id/cash-payment/admin-resolve')
  @ApiOperation({ summary: 'Resolve cash payment dispute (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid resolution request' })
  adminResolveCashDispute(@Param('id') id: string, @Request() req, @Body() body: { 
    resolution: 'confirm' | 'deny'; 
    adminNotes: string 
  }) {
    return this.ridesService.adminResolveCashDispute(id, req.user.id, body.resolution, body.adminNotes);
  }

  @Get('cash-payment/stats')
  @ApiOperation({ summary: 'Get cash payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cash payment statistics retrieved' })
  getCashPaymentStats() {
    return this.ridesService.getCashPaymentStats();
  }

  // Split Fare Endpoints
  @Post('split-fare')
  @ApiOperation({ summary: 'Create a split fare ride' })
  @ApiResponse({ status: 201, description: 'Split fare ride created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid split fare data' })
  createSplitFareRide(@Request() req, @Body() createSplitFareDto: CreateSplitFareRideDto) {
    return this.ridesService.createSplitFareRide(req.user.id, createSplitFareDto);
  }

  @Post(':id/split-fare/process-payments')
  @ApiOperation({ summary: 'Process split fare payments' })
  @ApiResponse({ status: 200, description: 'Split fare payments processed' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  processSplitFarePayments(@Param('id') id: string) {
    return this.ridesService.processSplitFarePayments(id);
  }

  @Post(':id/split-fare/confirm-cash/:riderId')
  @ApiOperation({ summary: 'Confirm cash payment for split fare' })
  @ApiResponse({ status: 200, description: 'Cash payment confirmed' })
  @ApiResponse({ status: 404, description: 'Split fare payment not found' })
  confirmSplitFareCashPayment(
    @Param('id') id: string,
    @Param('riderId') riderId: string,
    @Body() confirmationDto: SplitFareConfirmationDto
  ) {
    return this.ridesService.confirmSplitFareCashPayment(id, riderId, confirmationDto.confirmed);
  }

  @Get(':id/split-fare/status')
  @ApiOperation({ summary: 'Get split fare status' })
  @ApiResponse({ status: 200, description: 'Split fare status retrieved' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  getSplitFareStatus(@Param('id') id: string): Promise<SplitFareStatusResponse> {
    return this.ridesService.getSplitFareStatus(id);
  }

  @Post('split-fare/calculate-equal-split')
  @ApiOperation({ summary: 'Calculate equal split amounts' })
  @ApiResponse({ status: 200, description: 'Equal split calculated' })
  calculateEqualSplit(@Body() body: { totalFare: number; participantCount: number }) {
    return this.ridesService.calculateEqualSplit(body.totalFare, body.participantCount);
  }

  // GPS Tracking and Fare Adjustment Endpoints
  @Post(':id/gps/start-tracking')
  @ApiOperation({ summary: 'Start GPS tracking for a ride' })
  @ApiResponse({ status: 200, description: 'GPS tracking started' })
  startGpsTracking(@Param('id') id: string, @Body() body: { lat: number; lng: number; accuracy?: number }) {
    return this.ridesService.startGpsTracking(id, body);
  }

  @Post(':id/gps/add-location')
  @ApiOperation({ summary: 'Add GPS location to ride track' })
  @ApiResponse({ status: 200, description: 'GPS location added' })
  addGpsLocation(@Param('id') id: string, @Body() body: { lat: number; lng: number; accuracy?: number; speed?: number }) {
    return this.ridesService.addGpsLocation(id, body);
  }

  @Get(':id/gps/track')
  @ApiOperation({ summary: 'Get GPS track for a ride' })
  @ApiResponse({ status: 200, description: 'GPS track retrieved' })
  getGpsTrack(@Param('id') id: string) {
    return this.ridesService.getGpsTrack(id);
  }

  @Post(':id/fare/recalculate')
  @ApiOperation({ summary: 'Recalculate fare based on actual distance traveled' })
  @ApiResponse({ status: 200, description: 'Fare recalculated' })
  recalculateFare(@Param('id') id: string) {
    return this.ridesService.recalculateFare(id);
  }

  @Post(':id/route/validate')
  @ApiOperation({ summary: 'Validate if route can be calculated' })
  @ApiResponse({ status: 200, description: 'Route validation result' })
  validateRoute(@Param('id') id: string, @Body() body: { pickup: { lat: number; lng: number }; destination: { lat: number; lng: number } }) {
    return this.ridesService.validateRoute(body.pickup, body.destination);
  }
}

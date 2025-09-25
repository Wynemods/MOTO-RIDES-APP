# Driver Registration & Profile Management System

## Overview

The MOTO Rides application now includes a comprehensive driver registration and profile management system that allows users to register as drivers, manage their profiles, and handle vehicle information with proper verification workflows.

## Features

### 1. Driver Registration
- **Personal Information**: Full name, phone number, government ID, driver license
- **Profile Picture**: Upload clear face photo for identification
- **Vehicle Details**: Type (motorcycle, car, lorry), brand, model, color, number plate
- **Optional Insurance**: Vehicle insurance document upload
- **Validation**: All required fields must be filled before account approval

### 2. Driver Profile Management
- **Editable Fields**: Profile picture, phone number, vehicle details
- **Re-verification Logic**: Sensitive changes (number plate, license) require admin re-approval
- **Instant Updates**: Minor changes (color, phone) can be updated immediately
- **Multiple Vehicles**: Support for drivers with multiple vehicles

### 3. Ride Display Enhancement
- **Driver Information**: Name, profile picture, rating
- **Vehicle Details**: Type, brand, color, number plate for passenger identification
- **Contact Options**: Direct call functionality

## Database Schema

### Driver Model
```prisma
model Driver {
  id                            String              @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name                          String              @db.VarChar
  phoneNumber                   String              @unique @db.VarChar
  profilePictureUrl             String?             @db.VarChar
  licenseNumber                 String              @unique @db.VarChar
  licenseExpiry                 DateTime            @db.Timestamp(6)
  governmentId                  String?             @db.VarChar
  rating                        Int                 @default(0)
  totalRides                    Int                 @default(0)
  totalEarnings                 Int                 @default(0)
  status                        drivers_status_enum @default(offline)
  isVerified                    Boolean             @default(false)
  isActive                      Boolean             @default(true)
  isAvailable                   Boolean             @default(false)
  currentLat                    Decimal?            @db.Decimal(10, 8)
  currentLng                    Decimal?            @db.Decimal(11, 8)
  currentHeading                Decimal?            @db.Decimal(5, 2)
  currentSpeed                  Decimal?            @db.Decimal(5, 2)
  lastLocationUpdate            DateTime?           @db.Timestamp(6)
  penalties                     Json?               @default("[]")
  earnings                      Decimal             @default(0) @db.Decimal(10, 2)
  createdAt                     DateTime            @default(now()) @db.Timestamp(6)
  updatedAt                     DateTime            @default(now()) @updatedAt @db.Timestamp(6)
  userId                        String?             @unique @db.Uuid
  user                          User?               @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  rides                         Ride[]
  ratings                       Rating[]
  vehicles                      Vehicle[]
}
```

### Vehicle Model
```prisma
model Vehicle {
  id                    String             @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  type                  vehicles_type_enum @default(motorcycle)
  brand                 String             @db.VarChar
  model                 String             @db.VarChar
  color                 String             @db.VarChar
  numberPlate           String             @unique @db.VarChar
  year                  Int?
  insuranceDocUrl       String?            @db.VarChar
  isActive              Boolean            @default(true)
  isVerified            Boolean            @default(false)
  createdAt             DateTime           @default(now()) @db.Timestamp(6)
  updatedAt             DateTime           @default(now()) @updatedAt @db.Timestamp(6)
  driverId              String?            @db.Uuid
  driver                Driver?            @relation(fields: [driverId], references: [id], onDelete: NoAction, onUpdate: NoAction)
}
```

### Vehicle Types Enum
```prisma
enum vehicles_type_enum {
  motorcycle
  car
  lorry
}
```

## API Endpoints

### Driver Registration
- `POST /driver-registration/register` - Register as a driver
- `GET /driver-registration/profile` - Get driver profile
- `PUT /driver-registration/profile` - Update driver profile
- `GET /driver-registration/vehicles` - Get driver vehicles
- `PUT /driver-registration/vehicles/:id` - Update vehicle
- `POST /driver-registration/vehicles` - Add new vehicle
- `DELETE /driver-registration/vehicles/:id` - Remove vehicle
- `GET /driver-registration/eligibility` - Check registration eligibility

### Driver Verification (Enhanced)
- `POST /driver-verification/submit` - Submit verification documents with vehicle details
- `GET /driver-verification/status` - Get verification status
- `POST /driver-verification/approve/:userId` - Approve driver verification
- `POST /driver-verification/reject/:userId` - Reject driver verification

## Frontend Components

### 1. DriverRegistrationForm
- Complete registration form with personal and vehicle information
- Validation for required fields
- Support for profile picture upload
- Vehicle type selection (motorcycle, car, lorry)

### 2. DriverProfileSettings
- Profile management interface
- Vehicle management (add, edit, remove)
- Re-verification notifications for sensitive changes
- Real-time validation

### 3. DriverInfoCard
- Display driver and vehicle information during rides
- Contact functionality
- Rating display
- Vehicle identification details

### 4. RoleSwitch (Enhanced)
- Driver registration and profile access buttons
- Verification status display
- Role-specific actions

## Business Logic

### Registration Flow
1. User selects "Driver" or "Both" during registration
2. User completes driver verification with documents
3. User fills out driver registration form with vehicle details
4. Admin reviews and approves driver profile
5. Driver can start accepting rides

### Profile Updates
- **Simple Updates**: Profile picture, phone number, vehicle color → Auto-save
- **Sensitive Updates**: Number plate, driver license → Require re-verification
- **Vehicle Management**: Add multiple vehicles, edit existing ones

### Re-verification Logic
- Changes to sensitive fields reset verification status
- Driver cannot accept rides until re-verified
- Admin notification for re-verification requests

## Security Features

### Data Validation
- Required field validation
- Unique constraint enforcement (phone numbers, license numbers, number plates)
- Input sanitization and type checking

### Access Control
- Role-based access to driver features
- Verification status checks
- User ownership validation for profile updates

### Audit Trail
- Creation and update timestamps
- Change tracking for sensitive fields
- Verification status history

## Integration Points

### With Existing Systems
- **Authentication**: Integrated with user authentication system
- **Role Management**: Works with dual-role support
- **Verification**: Enhanced driver verification workflow
- **Ride System**: Driver and vehicle info displayed during rides
- **Payment System**: Driver earnings tracking

### External Services
- **File Upload**: Profile picture and document storage
- **SMS/Email**: Notification system for verification status
- **Maps**: Vehicle location tracking

## Usage Examples

### Register as Driver
```typescript
const driverData = {
  name: "John Doe",
  phoneNumber: "+254712345678",
  licenseNumber: "DL123456",
  licenseExpiry: "2025-12-31",
  governmentId: "ID123456",
  vehicle: {
    type: "car",
    brand: "Toyota",
    model: "Corolla",
    color: "White",
    numberPlate: "KCA 123A",
    year: 2020,
    insuranceDocUrl: "https://example.com/insurance.pdf"
  }
};

await apiService.registerDriver(driverData);
```

### Update Vehicle
```typescript
const vehicleData = {
  color: "Blue",
  year: 2021
};

await apiService.updateVehicle(vehicleId, vehicleData);
```

### Get Driver Profile
```typescript
const profile = await apiService.getDriverProfile();
console.log(profile.vehicles); // Array of vehicles
```

## Testing

All backend tests pass successfully:
- Authentication service tests
- Driver registration service tests
- Vehicle management tests
- Verification workflow tests

## Future Enhancements

1. **Document OCR**: Automatic extraction of information from uploaded documents
2. **Background Checks**: Integration with external verification services
3. **Vehicle Inspection**: Scheduled vehicle inspection reminders
4. **Driver Analytics**: Performance metrics and insights
5. **Multi-language Support**: Localization for different regions

## Troubleshooting

### Common Issues
1. **Registration Fails**: Check all required fields are filled
2. **Vehicle Not Found**: Ensure vehicle belongs to the driver
3. **Verification Required**: Complete verification before accessing driver features
4. **Duplicate Data**: Check for existing phone numbers, license numbers, or number plates

### Error Codes
- `400`: Bad Request - Missing or invalid data
- `409`: Conflict - Duplicate data (phone, license, plate)
- `403`: Forbidden - Insufficient permissions or verification required
- `404`: Not Found - Driver or vehicle not found

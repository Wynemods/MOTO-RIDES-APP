# MotoLink Backend API

Motorcycle ride-hailing API for Chuka University and surrounding areas.

## Features

- 🚀 **User Authentication** - JWT-based authentication with phone/email
- 👥 **User Management** - Student, Staff, and Resident user types
- 🏍️ **Driver Management** - Driver registration and verification
- 🚗 **Ride Booking** - Real-time ride requests and matching
- 💳 **Payment Processing** - Stripe and M-Pesa integration
- 📍 **Location Services** - Google Maps integration
- 🔔 **Notifications** - Push and SMS notifications
- 📊 **Analytics** - Ride tracking and earnings

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class Validator
- **Payments**: Stripe & M-Pesa

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb motolink
   
   # Run migrations
   npm run db:run
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=motolink

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google Maps
GOOGLE_MAPS_API_KEY=your-api-key

# Payments
STRIPE_SECRET_KEY=your-stripe-key
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile
- `PUT /auth/change-password` - Change password

### Users
- `GET /users` - Get all users
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update user profile

### Drivers
- `GET /drivers` - Get all drivers
- `GET /drivers/profile` - Get driver profile
- `PATCH /drivers/status` - Update driver status
- `PATCH /drivers/location` - Update driver location

### Rides
- `POST /rides` - Create new ride
- `GET /rides` - Get all rides
- `GET /rides/my-rides` - Get user's rides
- `PATCH /rides/:id/status` - Update ride status

### Payments
- `POST /payments` - Create payment
- `GET /payments/my-payments` - Get user's payments
- `PATCH /payments/:id/status` - Update payment status

### Locations
- `POST /locations` - Save location
- `GET /locations` - Get user's locations
- `PATCH /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location

### Notifications
- `GET /notifications` - Get user's notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read

## Database Schema

### Core Entities
- **Users** - User accounts and profiles
- **Drivers** - Driver profiles and status
- **Vehicles** - Driver vehicles
- **Rides** - Ride bookings and tracking
- **Payments** - Payment transactions
- **Locations** - Saved user locations
- **Notifications** - User notifications

## Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Migrations
```bash
# Generate migration
npm run db:generate -- src/database/migrations/MigrationName

# Run migrations
npm run db:run

# Revert migration
npm run db:revert
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Docker
```bash
# Build image
docker build -t motolink-api .

# Run container
docker run -p 3000:3000 motolink-api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

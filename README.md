# MOTOLINK 

Tap. Ride. Arrive. 

![MOTOLINK Logo](docs/images/icon.png)

##  Overview
MOTOLINK is a ride-hailing app focused on fast, reliable motorcycle transport. Riders request rides, drivers accept, and payments are handled securely in-app.

##  App Preview
<p>
  <img src="docs/images/splash.png" alt="Splash" width="240"/>
  <img src="docs/images/icon.png" alt="Icon" width="240"/>
</p>

##  Core Flows
-  Rider: Search destination  Get fare  Request  Track  Pay  Rate
-  Driver: Go online  Accept  Navigate  Complete  Earn  Withdraw

##  Project Structure
- rontend/ Expo React Native app (rider/driver UI)
- ackend/ NestJS API (auth, rides, payments, websockets)

##  Key Features
-  JWT auth and role switching (rider/driver)
-  Maps and live tracking
-  Payments: wallet, Stripe/M-Pesa adapters (mock)
-  Split fare support
-  Realtime notifications via WebSockets

##  Screenshots
<p>
  <img src="docs/images/preview-home.png" alt="Home" width="240"/>
  <img src="docs/images/preview-drive.png" alt="Drive" width="240"/>
  <img src="docs/images/preview-wallet.png" alt="Wallet" width="240"/>
  <img src="docs/images/preview-rides.png" alt="Rides" width="240"/>
  <img src="docs/images/preview-profile.png" alt="Profile" width="240"/>
</p>

Place your screenshots into docs/images/ with the above names to display them.

##  Setup
### Backend
`ash
cd backend
cp env.example .env
npm i
npm run prisma:generate
npm run start:dev
`

### Frontend
`ash
cd frontend
cp app.json app.local.json # edit if needed
npm i
npm start
`

##  Test
`ash
cd backend
npm run test
`

##  Deployment
- Backend: containerize with Docker, deploy to a Node host
- Frontend: EAS or Expo build for Android/iOS

##  License
MIT

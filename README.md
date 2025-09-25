# MOTOLINK 

Tap. Ride. Arrive.

![MOTOLINK Logo](docs/images/icon.png)

---

##  What is MOTOLINK?
MOTOLINK is a motorcycle ridehailing app designed for speed and simplicity. Riders request a bike in seconds, track the trip live, and pay securely. Drivers go online, accept rides, navigate with turnbyturn directions, and get paidfast.

---

##  How the App Works
### For Riders 
1. Search your destination 
2. See estimated fare and ETA 
3. Request a ride 
4. Track your driver live on the map 
5. Arrive, pay (wallet/card/cash where enabled), and rate 

### For Drivers 
1. Go online 
2. Accept a nearby request 
3. Navigate with inapp maps 
4. Complete the trip 
5. Earnings land in your wallet  -> withdraw to bank 

---

##  Roles: Rider  Driver
- Single account can switch roles any time
- Rolebased access controls keep permissions clean and secure 

---

##  Becoming a Rider (Driver)  Requirements & Steps
1. Create an account and verify your phone/email 
2. Provide driver details: ID, license, and motorcycle info 
3. Upload clear photos of your bike and documents 
4. Pass basic verification 
5. Add payout method (bank/card) for withdrawals 
6. Go online and start accepting rides! 

> Tip: Keep documents uptodate to avoid downtime. 

---

##  Payments & Wallet
- Inapp wallet shows balance, transactions, earnings, and payouts
- Supported gateways are modular (Stripe/MPesa adapters available) 
- Withdrawals to bank accounts happen from the Wallet tab 

---

##  Promos & Group Rides
- Promo codes for discounts on eligible trips 
- Split Fare: invite friends (25 riders) to share a single fare equally or by percentage 
  - Each rider confirms the share inapp
  - If someone drops, remaining riders are rebalanced automatically 

---

##  Maps & Live Tracking
- Realtime GPS tracking for riders and drivers
- Turnbyturn navigation for drivers
- Smart pickup positioning and rerouting when conditions change
- WebSockets power live updates 

---

##  Safety & Trust
- Verified drivers and vehicles 
- Trip details shared with emergency contacts (optional) 
- Ratings and feedback after every trip 

---

##  Why MOTOLINK is Awesome (Benefits)
- Faster pickups in dense cities 
- Lower fares vs. cars for many routes 
- Less traffic footprint and easier parking 
- Fair driver earnings with transparent fees 

---

##  Fun Facts & Jokes
- 060? More like 0Pickmeup! 
- Our bikes dont drink gas. They sip it politely. 
- We tried adding a turbo button. Legal said maybe not. 

---

##  App Preview
<p>
  <img src= docs/images/preview-home.png alt=Home width=240/>
  <img src=docs/images/preview-drive.png alt=Drive width=240/>
  <img src=docs/images/preview-wallet.png alt=Wallet width=240/>
  <img src=docs/images/preview-rides.png alt=Rides width=240/>
  <img src=docs/images/preview-profile.png alt=Profile width=240/>
</p>

> Place screenshots in docs/images/ with the names above to display them.

---

##  Project Structure
- rontend/  Expo React Native app (rider & driver UI)
- ackend/  NestJS API (auth, rides, payments, websockets)

---

##  Setup & Run
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
npm i
npm start
`

---

##  FAQ
- Q: Can I split fares with more than 2 riders?
  - A: Yes! Split fare supports groups of 25 riders. 
- Q: Do I need data on both phones for live tracking?
  - A: Yes, both sides need connectivity for the live map and updates. 
- Q: Can drivers use my phone GPS if mine is off?
  - A: The app uses each devices GPS separately for accuracy. 

---

##  License
MIT

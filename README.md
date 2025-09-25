
---

# 🏍️ MOTOLINK

**Tap. Ride. Arrive.**

![MOTOLINK Logo](docs/images/icon.png)

---

## ✨ What is MOTOLINK?

MOTOLINK isn’t just another ride-hailing app — it’s **two wheels, one mission: speed and simplicity**.

👤 Riders: Request a motorbike in seconds, watch your driver arrive live on the map, and pay without the awkward cash shuffle.
🛵 Drivers: Go online, accept rides, follow smooth turn-by-turn navigation, and watch your wallet grow.

Think of it as your **digital helmet buddy**.

---

## ⚙️ How the App Works

### 🎒 For Riders

1. 🔎 Search your destination
2. 💸 Glance at the estimated fare + ETA
3. 🛎️ Request your ride
4. 🛰️ Track your driver in real-time
5. 🏁 Arrive, pay (wallet/card/cash), and rate the ride

### 🛵 For Drivers

1. ✅ Go online
2. 📲 Accept nearby requests
3. 🗺️ Navigate with in-app maps
4. 🏍️ Complete the trip
5. 💰 Cash out earnings to your bank account

---

## 👥 Dual Roles: Rider ↔ Driver

One app. One account. Two hats.
Switch between **Rider** and **Driver** whenever life demands it.
(Yes, permissions are locked down tighter than your nan’s biscuit tin 🍪).

---

## 🏍️ Becoming a Driver: Requirements & Steps

```
[📱 Account] → [🪪 ID & Licence] → [📷 Upload Bike Pics]  
      ↓                 ↓
  [✅ Verification] → [💳 Payout Setup] → [🚦 Go Online!]
```

Tips from HQ:

* Keep documents up-to-date or risk unexpected downtime.
* Upload crystal-clear photos (blurry selfies of your number plate won’t do, champ).

---

## 💳 Payments & Wallet

* In-app wallet shows **earnings, payouts, and transaction history** at a glance
* Modular gateways (Stripe, M-Pesa & friends)
* Withdraw straight from wallet to your bank — no smoke, no mirrors

---

## 🎉 Promos & Group Rides

* 💸 Promo codes: quick discounts, instant smiles
* 👯‍♂️ Split Fare: up to **25 riders** can share one trip

  * Each confirms their share in-app
  * If Dave suddenly “has to go,” the app politely rebalances the fare

---

## 🗺️ Maps & Live Tracking

* 🔴 Real-time GPS tracking
* 🗺️ Turn-by-turn navigation for drivers
* 🔄 Smart rerouting when conditions shift
* ⚡ Powered by **WebSockets** (translation: fast, live, smooth)

---

## 🛡️ Safety & Trust

* ✅ Verified drivers + vehicles
* 📤 Share trip details with emergency contacts
* ⭐ Ratings + feedback after every journey

---

## 💡 Why MOTOLINK is Awesome

* ⏱️ Faster pickups in traffic-heavy cities
* 💸 Cheaper than cars on short hops
* 🏙️ Smaller footprint, easy parking
* 🤝 Fair driver earnings with transparent fees

---

## 🤪 Fun Facts & Jokes

* “0–60? More like 0–PickMeUp!”
* Our bikes don’t guzzle petrol. They sip it… with pinkies raised ☕.
* We *did* consider adding a turbo button. Legal sent us a strongly worded email.

---

## 📸 App Preview

<p>
  <img src=docs/images/preview-home.png alt=Home width=240/>
  <img src=docs/images/preview-drive.png alt=Drive width=240/>
  <img src=docs/images/preview-wallet.png alt=Wallet width=240/>
  <img src=docs/images/preview-rides.png alt=Rides width=240/>
  <img src=docs/images/preview-profile.png alt=Profile width=240/>
</p>

---

## 📂 Project Structure

```
MOTOLINK/
├── frontend/   # Expo React Native (rider & driver UI)
└── backend/    # NestJS API (auth, rides, payments, websockets)
```

---

## 🛠️ Setup & Run

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## ❓ FAQ

* **Can I split fares with more than 2 riders?**
  Absolutely — split up to **25 riders**.

* **Do I need mobile data for live tracking?**
  Yes, both rider and driver need active data for real-time updates.

* **Can drivers use my GPS if mine’s off?**
  Nope. Each device reports its own GPS for accuracy.

---

---

## 🔄 Ride Request Lifecycle

```text
      ┌──────────┐
      │  Rider   │
      └────┬─────┘
           │
   📍 Enter Destination
           │
           ▼
      ┌──────────┐
      │  Backend │
      └────┬─────┘
           │
   🔍 Find Nearby Driver
           │
           ▼
      ┌──────────┐
      │  Driver  │
      └────┬─────┘
           │
   🚦 Accept / Reject
           │
   ┌───────┴────────┐
   │                 │
   ▼                 ▼
 ✅ Accept        ❌ Reject
   │                 │
   ▼                 │
🚴 Pickup Rider      │
   │                 │
   ▼                 │
🗺️ Navigate to Drop  │
   │                 │
   ▼                 │
🏁 Trip Complete     │
   │                 │
   ▼                 │
💸 Payment → Wallet  │
   │                 │
   ▼                 │
⭐ Rating & Feedback │
```

---

That diagram shows:

* Rider input → Backend → Driver
* Accept/reject flow
* Payment + feedback loop

Brilliant choice 😎 — the **Split Fare / Group Ride** flow is one of your app’s killer features, so let’s visualise it. Here’s an **ASCII diagram** you can drop straight into your README under the **Promos & Group Rides** section:

---

## 👯 Split Fare / Group Ride Lifecycle

```text
      ┌──────────┐
      │  Rider A │ (Trip Owner)
      └────┬─────┘
           │
   🚕 Creates Ride + Enables Split Fare
           │
           ▼
 ┌────────────────────────┐
 │ Invite Friends (Riders)│
 └───────┬────────────────┘
         │
         ▼
 ┌──────────┐   ┌──────────┐   ┌──────────┐
 │  Rider B │   │  Rider C │ … │  Rider N │
 └────┬─────┘   └────┬─────┘   └────┬─────┘
      │              │              │
  💸 Accept Share  💸 Accept Share  💸 Accept Share
      │              │              │
      └───────┬──────┴───────┬──────┘
              ▼              ▼
        ┌────────────────────────┐
        │ Fare Split Equally/By %│
        └───────┬────────────────┘
                │
         🏍️ Ride Happens
                │
                ▼
        💳 Each Rider Pays
                │
                ▼
        📲 Driver Wallet Updated
```

---


* Rider A sets up the ride + invites friends
* Riders B, C, … N accept their share
* Fare auto-splits → each pays seamlessly → driver still gets one clean payout

---



## 📜 License

MIT – Freedom to ride, freedom to build.

---

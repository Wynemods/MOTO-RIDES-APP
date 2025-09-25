# 💳 Payment Processing Setup Guide

## 🎯 Payment System Overview

Your MotoLink app now supports **3 payment methods**:

1. **M-Pesa** - Primary for Kenya (mobile money)
2. **Stripe** - International cards and backup
3. **Wallet** - In-app balance management

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install stripe
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install @stripe/stripe-react-native
npm start
```

## 🔧 M-Pesa Setup (Kenya)

### 1. Get M-Pesa API Credentials
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create account and login
3. Create a new app
4. Get your credentials:
   - Consumer Key
   - Consumer Secret
   - Passkey
   - Shortcode

### 2. Configure M-Pesa
Add to your `.env` file:
```env
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_SECURITY_CREDENTIAL=your-security-credential
```

### 3. Test M-Pesa Payment
```bash
curl -X POST "http://localhost:3000/payments/mpesa" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "phoneNumber": "254712345678",
    "description": "Test payment"
  }'
```

## 💳 Stripe Setup (International)

### 1. Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create account and login
3. Get your keys:
   - Secret Key (sk_test_...)
   - Publishable Key (pk_test_...)
   - Webhook Secret (whsec_...)

### 2. Configure Stripe
Add to your `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 3. Test Stripe Payment
```bash
curl -X POST "http://localhost:3000/payments/stripe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 10.00,
    "currency": "usd",
    "email": "test@example.com",
    "description": "Test payment"
  }'
```

## 💰 Wallet System

### Features
- **In-app balance** - Users can add money to their wallet
- **Instant payments** - Pay with wallet balance
- **Transaction history** - Track all wallet transactions
- **Split payments** - Share costs with friends

### API Endpoints
```bash
# Get wallet balance
GET /payments/wallet/balance

# Get wallet transactions
GET /payments/wallet/transactions

# Add money to wallet
POST /payments/wallet/add
{
  "amount": 1000,
  "description": "Wallet top-up"
}

# Pay with wallet
POST /payments/wallet
{
  "amount": 500,
  "description": "Ride payment"
}
```

## 🧪 Testing Payments

### 1. Test M-Pesa (Sandbox)
- Use test phone numbers: `254712345678`
- Use test amounts: `1-1000 KES`
- Check callback handling

### 2. Test Stripe (Test Mode)
- Use test card numbers:
  - Success: `4242424242424242`
  - Decline: `4000000000000002`
  - 3D Secure: `4000002500003155`

### 3. Test Wallet
- Add money to wallet
- Make payments with wallet
- Check transaction history

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use different keys for development/production
- Rotate keys regularly

### 2. Webhook Security
- Verify webhook signatures
- Use HTTPS for callbacks
- Validate payment data

### 3. User Data
- Encrypt sensitive data
- Validate all inputs
- Log payment activities

## 📊 Payment Flow

### 1. M-Pesa Flow
```
User → App → Backend → M-Pesa API → User Phone
User → M-Pesa PIN → M-Pesa → Callback → Backend → App
```

### 2. Stripe Flow
```
User → App → Backend → Stripe → Payment Form
User → Card Details → Stripe → Webhook → Backend → App
```

### 3. Wallet Flow
```
User → App → Backend → Wallet Service → Database → App
```

## 🚀 Production Deployment

### 1. M-Pesa Production
- Switch to production URL: `https://api.safaricom.co.ke`
- Use production credentials
- Update callback URLs

### 2. Stripe Production
- Switch to live keys
- Update webhook endpoints
- Test with real cards

### 3. Database
- Use production PostgreSQL
- Set up backups
- Monitor performance

## 📱 Frontend Integration

### 1. Payment Selection
```typescript
// Payment method selection
const paymentMethods = [
  { id: 'mpesa', name: 'M-Pesa', icon: 'phone' },
  { id: 'stripe', name: 'Card', icon: 'credit-card' },
  { id: 'wallet', name: 'Wallet', icon: 'account-balance-wallet' },
];
```

### 2. M-Pesa Integration
```typescript
// M-Pesa payment
const mpesaPayment = await api.post('/payments/mpesa', {
  amount: 500,
  phoneNumber: '+254712345678',
  description: 'Ride payment'
});
```

### 3. Stripe Integration
```typescript
// Stripe payment
const stripePayment = await api.post('/payments/stripe', {
  amount: 10.00,
  currency: 'usd',
  email: 'user@example.com',
  description: 'Ride payment'
});
```

## 🔧 Troubleshooting

### Common Issues

1. **M-Pesa "Invalid credentials"**
   - Check consumer key/secret
   - Verify shortcode and passkey
   - Ensure callback URL is accessible

2. **Stripe "Invalid API key"**
   - Check secret key format
   - Verify test vs live keys
   - Check webhook configuration

3. **Wallet "Insufficient balance"**
   - Check user balance
   - Verify transaction history
   - Check for pending transactions

### Debug Steps

1. Check backend logs
2. Verify API responses
3. Test with small amounts
4. Check webhook delivery

## 📈 Monitoring

### 1. Payment Metrics
- Success rate by method
- Average transaction value
- Payment method usage

### 2. Error Tracking
- Failed payment reasons
- Webhook delivery issues
- User payment problems

### 3. Performance
- Payment processing time
- API response times
- Database query performance

## 🎉 Success!

Your MotoLink app now has:
- ✅ **M-Pesa integration** - For Kenya mobile payments
- ✅ **Stripe integration** - For international cards
- ✅ **Wallet system** - For in-app balance
- ✅ **Payment history** - Transaction tracking
- ✅ **Refund support** - Money back functionality
- ✅ **Security** - Secure payment processing

## 🚀 Next Steps

Now that payments are working, we can:
1. **Add real-time features** (WebSockets for live tracking)
2. **Connect frontend to backend** (API integration)
3. **Deploy to production** (Hosting setup)

---

**🎉 Congratulations! Your app now has complete payment processing!**

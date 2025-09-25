# Google Maps API Setup for MOTO RIDES

## Overview
The MOTO RIDES system now uses Google Maps Distance Matrix API to calculate **actual road distance** between pickup and destination points, ensuring accurate fare calculation based on real driving routes.

## Setup Instructions

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Distance Matrix API**
   - **Maps JavaScript API** (for frontend)
   - **Places API** (for location search)

### 2. Configure API Key
Add your Google Maps API key to the environment variables:

```bash
# In your .env file
GOOGLE_MAPS_API_KEY="your-actual-api-key-here"
```

### 3. API Restrictions (Recommended)
For security, restrict your API key:
- **Application restrictions**: HTTP referrers (for frontend) and IP addresses (for backend)
- **API restrictions**: Only enable Distance Matrix API, Maps JavaScript API, and Places API

## How It Works

### Distance Calculation
```typescript
// Before: Straight-line distance (inaccurate)
distance = haversineFormula(pickup, destination)

// Now: Actual road distance (accurate)
distance = googleMapsDistanceMatrixAPI(pickup, destination)
```

### Fare Calculation
```typescript
// Example: Nairobi CBD to Jomo Kenyatta Airport
// Straight-line: ~15km
// Actual road distance: ~18km

// Old calculation: 15km × KSH 60 = KSH 900
// New calculation: 18km × KSH 60 = KSH 1,080
```

### Fallback System
If Google Maps API fails, the system automatically falls back to the Haversine formula to ensure the app continues working.

## Pricing Examples

| Route | Straight-line | Actual Road | Difference | Fare Impact |
|-------|---------------|-------------|------------|-------------|
| CBD to Airport | 15km | 18km | +3km | +KSH 180 |
| CBD to Westlands | 5km | 7km | +2km | +KSH 120 |
| CBD to Karen | 12km | 15km | +3km | +KSH 180 |

## Benefits

1. **Accurate Pricing**: Customers pay for actual distance traveled
2. **Fair for Drivers**: Drivers get paid for real work done
3. **Transparent**: Clear distance and fare breakdown
4. **Reliable**: Fallback system ensures app always works

## Cost Considerations

- Google Maps Distance Matrix API: ~$5 per 1,000 requests
- Typical ride request: 1 API call
- 1,000 rides = ~$5 in API costs
- Very cost-effective for accurate pricing

## Testing

Test the distance calculation with known routes:
- Nairobi CBD to JKIA: Should be ~18km
- Westlands to Karen: Should be ~12km
- Compare with Google Maps app for verification
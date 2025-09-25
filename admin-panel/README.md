# MOTO Rides Admin Panel

A comprehensive admin panel for the MOTO Rides platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Admin Features
- **Dashboard Overview** - Key metrics, real-time stats, and quick actions
- **User Management** - Complete user and driver profile management
- **Driver Verification** - Document review and approval workflow
- **Ride Management** - Live ride monitoring and dispute resolution
- **Payment Management** - Transaction monitoring and refund processing
- **Emergency Handling** - Real-time emergency alerts and response
- **Analytics & Reporting** - Comprehensive platform analytics
- **Audit Logging** - Complete admin action tracking

### Security Features
- **JWT Authentication** - Secure admin login with token-based auth
- **Two-Factor Authentication** - Optional 2FA for high-privilege roles
- **Role-Based Access Control** - Granular permissions system
- **Audit Trail** - Complete logging of all admin actions
- **Rate Limiting** - Protection against brute force attacks

### UI/UX Features
- **Black & White Theme** - High contrast, professional design
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - WebSocket integration for live data
- **Accessibility** - WCAG AA compliant with keyboard navigation
- **Dark Mode Ready** - Easy theme switching capability

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state
- **Real-time**: Socket.IO for live updates
- **Icons**: Lucide React
- **Charts**: Recharts for analytics
- **Authentication**: JWT with refresh tokens

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MOTO Rides Backend API running

### Setup

1. **Clone and Install**
   ```bash
   cd admin-panel
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_ADMIN_DOMAIN=admin.motorides.com
   NEXT_PUBLIC_APP_NAME=MOTO Rides Admin
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## 🏗 Project Structure

```
admin-panel/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── login/             # Login page
│   │   ├── users/             # User management
│   │   ├── drivers/           # Driver management
│   │   ├── rides/             # Ride management
│   │   ├── payments/          # Payment management
│   │   ├── emergencies/       # Emergency handling
│   │   ├── reviews/           # Review management
│   │   ├── audit-logs/        # Audit logs
│   │   ├── analytics/         # Analytics dashboard
│   │   └── settings/          # Admin settings
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form components
│   │   ├── tables/           # Table components
│   │   └── charts/           # Chart components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities and API client
│   └── styles/               # Global styles
├── public/                   # Static assets
├── tests/                    # Test files
└── docs/                     # Documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_ADMIN_DOMAIN` | Admin panel domain | `admin.motorides.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `MOTO Rides Admin` |
| `NEXT_PUBLIC_JWT_SECRET` | JWT secret key | Required |
| `NEXT_PUBLIC_2FA_ISSUER` | 2FA issuer name | `MOTO Rides Admin` |

### API Integration

The admin panel connects to the MOTO Rides backend API. Ensure the backend is running and accessible at the configured URL.

Required backend endpoints:
- `POST /admin/auth/login` - Admin authentication
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/drivers` - Driver management
- `GET /admin/rides` - Ride management
- `GET /admin/emergencies` - Emergency handling
- `GET /admin/audit-logs` - Audit logs

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   Set all required environment variables in Vercel dashboard.

3. **Custom Domain**
   Configure your admin domain in Vercel settings.

### Other Platforms

The admin panel can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway
- Render

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Monitoring

### Error Tracking
- Sentry integration for error monitoring
- Real-time error alerts
- Performance monitoring

### Analytics
- User behavior tracking
- Performance metrics
- Custom event tracking

## 🔒 Security

### Authentication
- JWT-based authentication
- Refresh token rotation
- Session management

### Authorization
- Role-based access control
- Permission-based features
- Admin action logging

### Data Protection
- HTTPS enforcement
- CSRF protection
- XSS prevention
- Content Security Policy

## 🎨 Customization

### Theme Customization
The admin panel uses a black and white theme that can be customized in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Custom color palette
      }
    }
  }
}
```

### Component Customization
All components are built with Tailwind CSS and can be easily customized by modifying the class names.

## 📱 Mobile Support

The admin panel is fully responsive and works on:
- Desktop (1920x1080+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version 1.0.0
- Initial release
- Core admin features
- User and driver management
- Real-time emergency handling
- Analytics dashboard

### Planned Features
- Advanced analytics
- Bulk operations
- Custom reports
- Mobile app integration
- Advanced security features
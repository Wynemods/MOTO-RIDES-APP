import { io, Socket } from 'socket.io-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super-admin' | 'ops' | 'support' | 'finance'
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  roles: string[]
  activeRole: string
  isActive: boolean
  driverVerified: boolean
  driverVerificationStatus: string
  cancellationCount: number
  hasActiveFine: boolean
  fineAmount?: number
  createdAt: string
  lastLogin?: string
}

export interface Driver {
  id: string
  name: string
  phoneNumber: string
  profilePictureUrl?: string
  licenseNumber: string
  governmentId?: string
  rating: number
  totalRides: number
  totalEarnings: number
  status: 'online' | 'offline' | 'busy'
  isVerified: boolean
  isActive: boolean
  isAvailable: boolean
  currentLat?: number
  currentLng?: number
  lastLocationUpdate?: string
  vehicles: Vehicle[]
  createdAt: string
}

export interface Vehicle {
  id: string
  type: 'motorcycle' | 'car' | 'lorry'
  brand: string
  model: string
  color: string
  numberPlate: string
  year?: number
  insuranceDocUrl?: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

export interface Ride {
  id: string
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  destinationLat: number
  destinationLng: number
  destinationAddress: string
  currentLat?: number
  currentLng?: number
  fare: number
  status: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled'
  paymentMethod: 'mpesa' | 'stripe' | 'wallet' | 'cash'
  estimatedArrival?: number
  actualArrival?: number
  notes?: string
  rider: User
  driver?: Driver
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  userId: string
  rideId?: string
  amount: number
  currency: string
  method: 'mpesa' | 'stripe' | 'wallet' | 'cash'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  type: 'ride_payment' | 'fine_payment' | 'wallet_topup' | 'wallet_withdrawal' | 'refund'
  description?: string
  createdAt: string
}

export interface Emergency {
  id: string
  userId: string
  rideId?: string
  type: 'panic_button' | 'safety_concern' | 'accident' | 'other'
  status: 'open' | 'in_progress' | 'resolved'
  location: {
    lat: number
    lng: number
    address: string
  }
  description?: string
  user: User
  ride?: Ride
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface Review {
  id: string
  rideId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  type: 'rider_to_driver' | 'driver_to_rider'
  createdAt: string
}

export interface AuditLog {
  id: string
  adminId: string
  action: string
  targetType: 'user' | 'driver' | 'ride' | 'payment' | 'emergency'
  targetId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: string
}

export interface DashboardStats {
  activeUsers: number
  newSignups: number
  pendingApprovals: number
  openEmergencies: number
  totalRides: number
  totalRevenue: number
  cancellationRate: number
  driverAcceptanceRate: number
}

class ApiClient {
  private baseURL: string
  private token: string | null = null
  private socket: Socket | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: AdminUser; requires2FA: boolean }>> {
    return this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async verify2FA(token: string, code: string): Promise<ApiResponse<{ token: string; user: AdminUser }>> {
    return this.request('/admin/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ token, code }),
    })
  }

  async logout(): Promise<void> {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
    }
  }

  setToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token)
    }
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/admin/dashboard/stats')
  }

  // User management
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.role) searchParams.set('role', params.role)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.status) searchParams.set('status', params.status)

    return this.request(`/admin/users?${searchParams.toString()}`)
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/admin/users/${id}`)
  }

  async banUser(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unbanUser(id: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/unban`, {
      method: 'POST',
    })
  }

  async resetUserPassword(id: string): Promise<ApiResponse<{ newPassword: string }>> {
    return this.request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
    })
  }

  async clearUserFine(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/clear-fine`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Driver management
  async getDrivers(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<Driver>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.search) searchParams.set('search', params.search)

    return this.request(`/admin/drivers?${searchParams.toString()}`)
  }

  async getDriver(id: string): Promise<ApiResponse<Driver>> {
    return this.request(`/admin/drivers/${id}`)
  }

  async suspendDriver(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/drivers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unsuspendDriver(id: string): Promise<ApiResponse> {
    return this.request(`/admin/drivers/${id}/unsuspend`, {
      method: 'POST',
    })
  }

  // Approvals
  async getPendingApprovals(): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request('/admin/approvals?status=pending')
  }

  async approveDriver(id: string, notes?: string): Promise<ApiResponse> {
    return this.request(`/admin/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectDriver(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Rides
  async getRides(params?: {
    page?: number
    limit?: number
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<PaginatedResponse<Ride>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

    return this.request(`/admin/rides?${searchParams.toString()}`)
  }

  async getRide(id: string): Promise<ApiResponse<Ride>> {
    return this.request(`/admin/rides/${id}`)
  }

  async refundRide(id: string, amount: number, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/rides/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    })
  }

  // Payments
  async getPayments(params?: {
    page?: number
    limit?: number
    status?: string
    method?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.method) searchParams.set('method', params.method)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

    return this.request(`/admin/payments?${searchParams.toString()}`)
  }

  async refundPayment(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Emergencies
  async getEmergencies(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<Emergency>>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    return this.request(`/admin/emergencies?${searchParams.toString()}`)
  }

  async resolveEmergency(id: string, notes?: string): Promise<ApiResponse> {
    return this.request(`/admin/emergencies/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  // Reviews
  async getReviews(params?: {
    page?: number
    limit?: number
    rating?: number
    type?: string
  }): Promise<ApiResponse<PaginatedResponse<Review>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.rating) searchParams.set('rating', params.rating.toString())
    if (params?.type) searchParams.set('type', params.type)

    return this.request(`/admin/reviews?${searchParams.toString()}`)
  }

  async hideReview(id: string, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/reviews/${id}/hide`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Audit logs
  async getAuditLogs(params?: {
    page?: number
    limit?: number
    adminId?: string
    action?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.adminId) searchParams.set('adminId', params.adminId)
    if (params?.action) searchParams.set('action', params.action)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

    return this.request(`/admin/audit-logs?${searchParams.toString()}`)
  }

  // Analytics
  async getAnalytics(params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

    return this.request(`/admin/analytics?${searchParams.toString()}`)
  }

  // Socket connection for real-time updates
  connectSocket(): Socket {
    if (this.socket) {
      return this.socket
    }

    this.socket = io(`${this.baseURL}/admin`, {
      auth: {
        token: this.token,
      },
    })

    return this.socket
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const apiClient = new ApiClient()
export default apiClient

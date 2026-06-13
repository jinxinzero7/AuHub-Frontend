export const JWT_CLAIMS = {
  ID: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  EMAIL: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  NAME: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  ROLE: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
  LOTS: {
    LIST: '/api/lots',
    DETAIL: (id: string) => `/api/lots/${id}`,
    BIDS: (id: string) => `/api/lots/${id}/bids`,
    IMAGES: (id: string) => `/api/lots/${id}/images`,
    CREATE: '/api/lots',
    UPDATE: (id: string) => `/api/lots/${id}`,
    SUBMIT_FOR_MODERATION: (id: string) => `/api/lots/${id}/submit-for-moderation`,
    APPROVE: (id: string) => `/api/lots/${id}/approve`,
    REJECT: (id: string) => `/api/lots/${id}/reject`,
    UNFREEZE: (id: string) => `/api/lots/${id}/unfreeze`,
    RESOLVE_DISPUTE: (id: string) => `/api/lots/${id}/resolve-dispute`,
    REVIEWS: (id: string) => `/api/lots/${id}/reviews`,
  },
  SELLERS: {
    REVIEWS: (sellerId: string) => `/api/sellers/${sellerId}/reviews`,
    TRUST: (sellerId: string) => `/api/sellers/${sellerId}/trust`,
  },
  BIDS: {
    MY: '/api/bids/my',
  },
  PAYMENT: {
    BALANCE: '/api/payment/balance',
    TRANSACTIONS: '/api/payment/transactions',
    TOPUP: '/api/payment/topup',
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  },
  ADMIN: {
    PENDING_LOTS: '/api/admin/lots/pending',
    FROZEN_LOTS: '/api/admin/lots/frozen',
    DISPUTES: '/api/admin/disputes',
    BANNED_USERS: '/api/admin/users/banned',
    BAN: (userId: string) => `/api/admin/users/${userId}/ban`,
    UNBAN: (userId: string) => `/api/admin/users/${userId}/unban`,
  },
  IMAGES: {
    UPLOAD: (lotId: string) => `/api/lots/${lotId}/images`,
    DELETE: (lotId: string, imageId: string) => `/api/lots/${lotId}/images/${imageId}`,
  },
} as const;

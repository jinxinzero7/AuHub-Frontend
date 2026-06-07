export interface User {
  id: string;
  email: string;
  name: string;
  role: number;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: number;
}

export interface Lot {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  startTime: string;
  endTime: string;
  sellerId: string;
  winnerId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  bidsCount: number;
  coverImageUrl?: string;
  selectedDeliveryProvider?: string;
  deliveryRequestedAt?: string;
  deliveryRequestDeadlineAt?: string;
  supportedDeliveryProviders: string[];
}

export interface Bid {
  id: string;
  lotId: string;
  userId: string;
  amount: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  lots: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error: string | null;
}

export interface CreateLotRequest {
  title: string;
  description: string;
  startingPrice: number;
  durationHours: number;
  supportedDeliveryProviders: string[];
}

export interface PlaceBidRequest {
  amount: number;
}

export interface PlaceBidResponse {
  success: boolean;
  lotId: string;
  newCurrentPrice: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  error: string | null;
  data?: T;
}

export interface MyBidItem {
  id: string;
  amount: number;
  placedAt: string;
}

export interface MyBidsGroup {
  lotId: string;
  lotTitle: string;
  lotStatus: string;
  bids: MyBidItem[];
}

export interface GetMyBidsResponse {
  items: MyBidsGroup[];
}

export interface BalanceResponse {
  balance: number;
  frozenBalance: number;
}

export interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  description: string;
}

export interface TopUpRequest {
  amount: number;
}

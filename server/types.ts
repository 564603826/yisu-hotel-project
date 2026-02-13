type ApiResponse<T = null> = {
  code: number
  msg: string
  data: T
}

type UserRole = 'merchant' | 'admin'

type HotelStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'offline'

type UserLoginRequest = {
  username: string
  password: string
}

type UserRegisterRequest = {
  username: string
  password: string
  role: UserRole
}

type UserInfo = {
  userId: number
  username: string
  role: UserRole
}

type LoginResponseData = {
  token: string
  userInfo: UserInfo
}

type RegisterResponseData = {
  id: number
  username: string
  role: UserRole
  createdAt: string
}

type RoomType = {
  name: string
  price: number
  area?: number
  bedType?: string
  facilities?: string[]
}

type Discount = {
  type: 'percentage' | 'fixed'
  name: string
  value: number
  description?: string
  startDate?: string
  endDate?: string
}

type Hotel = {
  id: number
  nameZh: string
  nameEn: string
  address: string
  starRating: number
  roomTypes: RoomType[]
  price: string
  openDate: string
  nearbyAttractions?: string
  nearbyTransport?: string
  nearbyMalls?: string
  discounts?: Discount[]
  images?: string[]
  description?: string
  status: HotelStatus
  rejectReason?: string
  draftData?: DraftData
  creatorId: number
  createdAt: string
  updatedAt: string
}

type DraftData = {
  nameZh: string
  nameEn: string
  address: string
  starRating: number
  roomTypes: RoomType[]
  price: number
  openDate: string
  nearbyAttractions?: string
  nearbyTransport?: string
  nearbyMalls?: string
  discounts?: Discount[]
  images?: string[]
  description?: string
}

type HotelWithCreator = Hotel & {
  creator?: {
    id: number
    username: string
    role?: UserRole
  }
}

type UpdateHotelRequest = Partial<
  Omit<Hotel, 'id' | 'status' | 'rejectReason' | 'creatorId' | 'createdAt' | 'updatedAt' | 'price'>
>

type PaginationParams = {
  page?: number
  pageSize?: number
  status?: HotelStatus
  keyword?: string
  starRating?: number
}

type Pagination<T> = {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

type RejectRequest = {
  reason: string
}

type UploadResponse = {
  url: string
  filename: string
}

export type {
  ApiResponse,
  UserRole,
  HotelStatus,
  UserLoginRequest,
  UserRegisterRequest,
  UserInfo,
  LoginResponseData,
  RegisterResponseData,
  RoomType,
  Discount,
  Hotel,
  HotelWithCreator,
  DraftData,
  UpdateHotelRequest,
  PaginationParams,
  Pagination,
  RejectRequest,
  UploadResponse,
}

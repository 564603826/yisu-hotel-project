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

// 草稿数据类型（与 UpdateHotelRequest 一致，但包含 price）
type DraftData = {
  nameZh?: string
  nameEn?: string
  address?: string
  starRating?: number
  roomTypes?: RoomType[]
  price?: string
  openDate?: string
  nearbyAttractions?: string
  nearbyTransport?: string
  nearbyMalls?: string
  discounts?: Discount[]
  images?: string[]
  description?: string
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
  draftData?: DraftData | null // 版本控制：已发布/已下线酒店的草稿数据
  creatorId: number
  createdAt: string
  updatedAt: string
}

type HotelWithCreator = Hotel & {
  creator?: {
    id: number
    username: string
    role?: UserRole
  }
  image?: string // 酒店封面图（列表接口返回）
}

type UpdateHotelRequest = {
  nameZh: string
  nameEn: string
  address: string
  starRating: number
  roomTypes: RoomType[]
  openDate: string
  nearbyAttractions?: string
  nearbyTransport?: string
  nearbyMalls?: string
  discounts?: Discount[]
  images?: string[]
  description?: string
}
type SubmitAuditResponse = {
  id: number
  status: HotelStatus
}

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

type RejectAuditResponse = {
  id: number
  status: 'rejected'
  rejectReason: string
}

type PublishResponse = {
  id: number
  status: 'published'
}

type UploadResponse = {
  url: string
  filename: string
}

type OfflineResponse = {
  id: number
  status: 'offline'
}

type RestoreResponse = {
  id: number
  status: 'published'
}

type UploadImageResponse = {
  url: string
  filename: string
}
type CancelAuditResponse = {
  id: number
  status: 'draft'
}

type UploadImagesResponse = UploadImageResponse[]
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
  DraftData,
  Hotel,
  HotelWithCreator,
  UpdateHotelRequest,
  SubmitAuditResponse,
  PaginationParams,
  Pagination,
  RejectRequest,
  RejectAuditResponse,
  PublishResponse,
  UploadResponse,
  OfflineResponse,
  RestoreResponse,
  UploadImageResponse,
  UploadImagesResponse,
  CancelAuditResponse,
}

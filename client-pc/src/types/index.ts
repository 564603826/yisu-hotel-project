type ApiResponse<T = null> = {
  code: number
  msg: string
  data: T
}

type UserRole = 'merchant' | 'admin'

type HotelStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'offline'

type ImageType = 'hotel_main' | 'hotel_room' | 'hotel_banner' | 'user_avatar'

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
  images?: string[] // 房型图片列表
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
  facilities?: string[]
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
  facilities?: string[]
  discounts?: Discount[]
  images?: string[]
  description?: string
  status: HotelStatus
  rejectReason?: string
  auditInfo?: string // 商户提交的审核信息
  draftData?: DraftData | null // 版本控制：已发布/已下线酒店的草稿数据

  // Banner 相关字段
  isBanner?: boolean
  bannerSort?: number
  bannerTitle?: string
  bannerDesc?: string

  creatorId: number
  createdAt: string
  updatedAt: string
  longitude?: number // 经度
  latitude?: number // 纬度

  // 管理员审核时使用的额外字段
  _draftImages?: string[] // 草稿图片
  _publishedImages?: string[] // 已发布图片
  _draftRoomTypes?: RoomType[] // 草稿房型数据
  _publishedRoomTypes?: RoomType[] // 已发布房型数据
}

type HotelWithCreator = Hotel & {
  user?: {
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
  facilities?: string[]
  discounts?: Discount[]
  images?: string[]
  description?: string
}
type SubmitAuditRequest = {
  auditInfo?: string // 商户提交的审核信息
}

type SubmitAuditResponse = {
  id: number
  status: HotelStatus
}

// Banner 相关类型
type SetBannerRequest = {
  isBanner: boolean
  bannerSort?: number
  bannerTitle?: string
  bannerDesc?: string
}

type SetBannerResponse = {
  id: number
  nameZh: string
  status: HotelStatus
  isBanner: boolean
  bannerSort: number
  bannerTitle?: string
  bannerDesc?: string
}

type UpdateBannerInfoRequest = {
  bannerSort?: number
  bannerTitle?: string
  bannerDesc?: string
}

type BannerItem = {
  id: number
  nameZh: string
  nameEn?: string
  status: HotelStatus
  bannerSort: number
  bannerTitle?: string
  bannerDesc?: string
  imageUrl: string
  price: string
  starRating: number
  updatedAt: string
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
  id?: number // 图片ID，用于排序和版本控制
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
  ImageType,
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
  SubmitAuditRequest,
  // Banner 相关
  SetBannerRequest,
  SetBannerResponse,
  UpdateBannerInfoRequest,
  BannerItem,
}

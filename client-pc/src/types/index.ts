// 全局统一响应体泛型
type ApiResponse<T = null> = {
  code: number
  msg: string
  data: T
}

type UserLoginRequest = {
  username: string
  password: string
}

type UserRegisterRequest = {
  username: string
  password: string
  role: UserRole
}
// 用户基础信息
type UserInfo = {
  userId: string
  username: string
  role: UserRole
}

type UserRole = 'merchant' | 'admin'

type HotelIdResponse = {
  code: number
  msg: string
  data: {
    hotelId: string
  }
}

// 独立对象类型：仅包含token字段
type TokenField = {
  token: string
}

type LoginResponseData = {
  token: string // 登录生成的JWT令牌
  userInfo: UserInfo // 用户基础信息
}

type RegisterResponseData = {
  userId: string
  username: string
  role: UserRole
}

// 单条酒店数据类型
type HotelItem = {
  id: string
  nameCn: string
  nameEn: string
  address: string
  star: number
  roomType: string[]
  price: number
  openTime: string
  attractions: string[]
  traffic: string
  discount?: { type: string; value: number }
  status: 'pending' | 'passed' | 'rejected' | 'offline'
  rejectReason?: string
  merchantId: string
  createTime: string
  updateTime: string
}

type HotelListResponse = {
  // 固定外层响应结构
  code: number
  msg: string // 核心数据：HotelItem对象数组
  data: HotelItem[]
}

// 与ApiResponse<{ hotelId: string }>完全等效
type HotelOperateResponse = {
  code: number
  msg: string
  data: {
    hotelId: string
  }
}

// 分页公共结构泛型
type PageResult<T> = {
  list: T[] // 分页数据列表，类型为传入的T数组
  total: number // 符合条件的总条数
  page: number // 当前页码
  pageSize: number // 每页条数
}

export type {
  ApiResponse,
  UserLoginRequest,
  LoginResponseData,
  UserRegisterRequest,
  RegisterResponseData,
  UserInfo,
  UserRole,
  HotelIdResponse,
  TokenField,
  HotelItem,
  HotelListResponse,
  HotelOperateResponse,
  PageResult,
}

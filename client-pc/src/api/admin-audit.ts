import type {
  Hotel,
  SubmitAuditResponse,
  PaginationParams,
  Pagination,
  RejectRequest,
  RejectAuditResponse,
  PublishResponse,
  OfflineResponse,
  RestoreResponse,
  SetBannerRequest,
  SetBannerResponse,
  UpdateBannerInfoRequest,
  BannerItem,
} from '@/types'
import service from '@/utils/request.ts'

const URL = {
  GET_HOTELS: '/admin/hotels',
  GET_HOTEL_DETAIL: '/admin/hotels/:id',
  APPROVE_AUDIT: '/admin/hotels/:id/approve',
  REJECT_AUDIT: '/admin/hotels/:id/reject',
  PUBLISH_HOTEL: '/admin/hotels/:id/publish',
  OFFLINE_HOTEL: '/admin/hotels/:id/offline',
  RESTORE_HOTEL: '/admin/hotels/:id/restore',
  SET_BANNER: '/admin/hotels/:id/banner',
  UPDATE_BANNER_INFO: '/admin/hotels/:id/banner-info',
  GET_BANNERS: '/admin/banners',
  GET_DASHBOARD_STATS: '/admin/dashboard/stats',
}

export default {
  getHotels: (params: PaginationParams) =>
    service.get<any, Pagination<Hotel>>(URL.GET_HOTELS, { params }),
  getHotelDetail: (id: number) =>
    service.get<any, Hotel>(URL.GET_HOTEL_DETAIL.replace(':id', id.toString())),
  approveAudit: (id: number) =>
    service.put<any, SubmitAuditResponse>(URL.APPROVE_AUDIT.replace(':id', id.toString())),
  rejectAudit: (id: number, data: RejectRequest) =>
    service.put<any, RejectAuditResponse>(URL.REJECT_AUDIT.replace(':id', id.toString()), data),
  publishHotel: (id: number) =>
    service.put<any, PublishResponse>(URL.PUBLISH_HOTEL.replace(':id', id.toString())),
  offlineHotel: (id: number) =>
    service.put<any, OfflineResponse>(URL.OFFLINE_HOTEL.replace(':id', id.toString())),
  restoreHotel: (id: number) =>
    service.put<any, RestoreResponse>(URL.RESTORE_HOTEL.replace(':id', id.toString())),

  // Banner 管理
  setBanner: (id: number, data: SetBannerRequest) =>
    service.put<any, SetBannerResponse>(URL.SET_BANNER.replace(':id', id.toString()), data),
  updateBannerInfo: (id: number, data: UpdateBannerInfoRequest) =>
    service.put<any, SetBannerResponse>(URL.UPDATE_BANNER_INFO.replace(':id', id.toString()), data),
  getBanners: (params?: { page?: number; pageSize?: number }) =>
    service.get<any, { list: BannerItem[]; total: number; page: number; pageSize: number }>(
      URL.GET_BANNERS,
      { params }
    ),

  // Dashboard 统计数据
  getDashboardStats: () =>
    service.get<
      any,
      {
        pendingCount: number
        todayApprovedCount: number
        totalHotels: number
        lastUpdateTime: string
      }
    >(URL.GET_DASHBOARD_STATS),
}

import type {
  Hotel,
  SubmitAuditResponse,
  PaginationParams,
  Pagination,
  RejectRequest,
  RejectAuditResponse,
  PublishResponse,
  OfflineResponse,
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
    service.put<any, PublishResponse>(URL.RESTORE_HOTEL.replace(':id', id.toString())),
}

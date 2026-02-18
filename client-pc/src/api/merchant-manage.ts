import type {
  Hotel,
  UpdateHotelRequest,
  SubmitAuditRequest,
  SubmitAuditResponse,
  CancelAuditResponse,
} from '@/types'
import service from '@/utils/request.ts'

const URL = {
  GET_HOTEL: '/hotels/my',
  UPDATE_HOTEL: '/hotels/my',
  SUBMIT_AUDIT: '/hotels/my/submit',
  CANCEL_AUDIT: '/hotels/my/cancel',
}

export default {
  getHotel: (viewMode?: 'draft' | 'published') =>
    service.get<any, Hotel>(URL.GET_HOTEL, { params: { viewMode } }),
  updateHotel: (data: UpdateHotelRequest) => service.put<any, Hotel>(URL.UPDATE_HOTEL, data),
  submitAudit: (data?: SubmitAuditRequest) =>
    service.put<any, SubmitAuditResponse>(URL.SUBMIT_AUDIT, data),
  cancelAudit: () => service.put<any, CancelAuditResponse>(URL.CANCEL_AUDIT),
}

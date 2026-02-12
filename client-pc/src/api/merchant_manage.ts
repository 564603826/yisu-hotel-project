import type { Hotel, UpdateHotelRequest, SubmitAuditResponse } from '@/types'
import service from '@/utils/request.ts'

const URL = {
  GET_HOTEL: '/hotels/my',
  UPDATE_HOTEL: '/hotels/my',
  SUBMIT_AUDIT: '/hotels/submit',
}

export default {
  getHotel: () => service.get<any, Hotel>(URL.GET_HOTEL),
  updateHotel: (data: UpdateHotelRequest) => service.put<any, Hotel>(URL.UPDATE_HOTEL, data),
  submitAudit: () => service.put<any, SubmitAuditResponse>(URL.SUBMIT_AUDIT),
}

import { create } from 'zustand'
import useMerchantAPI from '@/api/merchant-manage'
import type {
  Hotel,
  UpdateHotelRequest,
  SubmitAuditResponse,
  RoomType,
  CancelAuditResponse,
} from '@/types' // 引入你的类型定义

const { getHotel, updateHotel, submitAudit, cancelAudit } = useMerchantAPI
// 1. 定义数据 (State)
interface MerchantState {
  hotelInfo: Hotel | null
}

// 2. 定义动作 (Action)
interface MerchantActions {
  setHotelInfo: (hotelInfo: Hotel) => void
  getHotelInfo: () => Promise<Hotel>
  updateHotelInfo: (data: UpdateHotelRequest) => Promise<Hotel>
  submitAudit: () => Promise<SubmitAuditResponse>
  cancelAudit: () => Promise<CancelAuditResponse>
  addRoomType: (room: RoomType) => void
  updateRoomType: (index: number, room: RoomType) => void
  deleteRoomType: (index: number) => void
}

// 3. 创建 Store
export const useMerchantStore = create<MerchantState & MerchantActions>()((set) => ({
  hotelInfo: null,
  // --- 同步方法 ---
  setHotelInfo: (hotelInfo) => {
    set({ hotelInfo })
  },

  getHotelInfo: async () => {
    // 1. 调用 API (你封装好的)
    const hotelInfo = await getHotel()
    // 2. 拿到数据，更新 Store (Zustand 会自动同步到 LocalStorage)
    set({
      hotelInfo,
    })
    console.log('获取酒店信息成功', hotelInfo)
    return hotelInfo
  },
  updateHotelInfo: async (data) => {
    console.log('更新酒店信息请求参数', data)
    const hotelInfo = await updateHotel(data)
    return hotelInfo
  },
  submitAudit: async () => {
    const auditRes = await submitAudit()
    return auditRes
  },
  cancelAudit: async () => {
    const cancelRes = await cancelAudit()
    return cancelRes
  },

  // --- 房型管理方法 ---
  addRoomType: (room) => {
    set((state) => {
      if (!state.hotelInfo) return state
      const currentRoomTypes = state.hotelInfo.roomTypes || []
      return {
        hotelInfo: {
          ...state.hotelInfo,
          roomTypes: [...currentRoomTypes, room],
        },
      }
    })
  },

  updateRoomType: (index, room) => {
    set((state) => {
      if (!state.hotelInfo) return state
      const currentRoomTypes = [...(state.hotelInfo.roomTypes || [])]
      currentRoomTypes[index] = room
      return {
        hotelInfo: {
          ...state.hotelInfo,
          roomTypes: currentRoomTypes,
        },
      }
    })
  },

  deleteRoomType: (index) => {
    set((state) => {
      if (!state.hotelInfo) return state
      const currentRoomTypes = [...(state.hotelInfo.roomTypes || [])]
      currentRoomTypes.splice(index, 1)
      return {
        hotelInfo: {
          ...state.hotelInfo,
          roomTypes: currentRoomTypes,
        },
      }
    })
  },
}))

import { create } from 'zustand'
import adminAuditApi from '@/api/admin-audit'
import type { Hotel, HotelWithCreator, PaginationParams, RejectRequest, HotelStatus } from '@/types'

interface AdminState {
  hotelList: HotelWithCreator[]
  currentHotel: Hotel | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  loading: boolean
}

interface AdminActions {
  getHotels: (params: PaginationParams) => Promise<void>
  getHotelDetail: (id: number) => Promise<Hotel>
  approveAudit: (id: number) => Promise<void>
  rejectAudit: (id: number, data: RejectRequest) => Promise<void>
  publishHotel: (id: number) => Promise<void>
  offlineHotel: (id: number) => Promise<void>
  restoreHotel: (id: number) => Promise<void>
  setCurrentHotel: (hotel: Hotel | null) => void
  clearHotelList: () => void
}

export const useAdminStore = create<AdminState & AdminActions>()((set, get) => ({
  hotelList: [],
  currentHotel: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,

  getHotels: async (params: PaginationParams) => {
    set({ loading: true })
    try {
      const result = await adminAuditApi.getHotels(params)
      set({
        hotelList: result.list,
        pagination: result.pagination,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  getHotelDetail: async (id: number) => {
    const hotel = await adminAuditApi.getHotelDetail(id)
    set({ currentHotel: hotel })
    return hotel
  },

  approveAudit: async (id: number) => {
    await adminAuditApi.approveAudit(id)
    const { hotelList } = get()
    set({
      hotelList: hotelList.map((h) =>
        h.id === id ? { ...h, status: 'approved' as HotelStatus } : h
      ),
    })
  },

  rejectAudit: async (id: number, data: RejectRequest) => {
    const result = await adminAuditApi.rejectAudit(id, data)
    const { hotelList } = get()
    set({
      hotelList: hotelList.map((h) =>
        h.id === id
          ? { ...h, status: 'rejected' as HotelStatus, rejectReason: result.rejectReason }
          : h
      ),
    })
  },

  publishHotel: async (id: number) => {
    await adminAuditApi.publishHotel(id)
    const { hotelList } = get()
    set({
      hotelList: hotelList.map((h) =>
        h.id === id ? { ...h, status: 'published' as HotelStatus } : h
      ),
    })
  },

  offlineHotel: async (id: number) => {
    await adminAuditApi.offlineHotel(id)
    const { hotelList } = get()
    set({
      hotelList: hotelList.map((h) =>
        h.id === id ? { ...h, status: 'offline' as HotelStatus } : h
      ),
    })
  },

  restoreHotel: async (id: number) => {
    await adminAuditApi.restoreHotel(id)
    const { hotelList } = get()
    set({
      hotelList: hotelList.map((h) =>
        h.id === id ? { ...h, status: 'published' as HotelStatus } : h
      ),
    })
  },

  setCurrentHotel: (hotel: Hotel | null) => {
    set({ currentHotel: hotel })
  },

  clearHotelList: () => {
    set({ hotelList: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } })
  },
}))

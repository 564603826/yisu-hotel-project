import { create } from 'zustand'
import useMerchantAPI from '@/api/merchant-manage'
import hotelImageApi, { type HotelImage } from '@/api/hotel-image'
import type { ImageItem } from '@/components/MerchantForm/MultiImageUpload'
import type {
  Hotel,
  UpdateHotelRequest,
  SubmitAuditRequest,
  SubmitAuditResponse,
  RoomType,
  CancelAuditResponse,
} from '@/types'

const { getHotel, updateHotel, submitAudit, cancelAudit } = useMerchantAPI

// 扩展 RoomType 支持 ImageItem（用于本地编辑状态）
interface RoomTypeWithImageItems extends Omit<RoomType, 'images'> {
  images?: (string | ImageItem)[]
}

// 将 RoomTypeWithImageItems 转换为 RoomType（提取 URL string）
const convertToRoomType = (room: RoomTypeWithImageItems): RoomType => {
  const images: string[] = []
  if (room.images) {
    for (const img of room.images) {
      if (typeof img === 'string') {
        images.push(img)
      } else if (img.url && !img.url.startsWith('blob:')) {
        // ImageItem 且不是 blob URL
        images.push(img.url)
      }
    }
  }
  return {
    ...room,
    images,
  }
}

// 1. 定义数据 (State)
interface MerchantState {
  hotelInfo: Hotel | null
  draftImages: HotelImage[]
  publishedImages: HotelImage[]
}

// 2. 定义动作 (Action)
interface MerchantActions {
  setHotelInfo: (hotelInfo: Hotel) => void
  getHotelInfo: (viewMode?: 'draft' | 'published') => Promise<Hotel>
  updateHotelInfo: (data: UpdateHotelRequest) => Promise<Hotel>
  submitAudit: (data?: SubmitAuditRequest) => Promise<SubmitAuditResponse>
  cancelAudit: () => Promise<CancelAuditResponse>
  addRoomType: (room: RoomTypeWithImageItems) => void
  updateRoomType: (index: number, room: RoomTypeWithImageItems) => void
  deleteRoomType: (index: number) => void
  getDraftImages: () => Promise<HotelImage[]>
  getPublishedImages: () => Promise<HotelImage[]>
  copyToDraft: () => Promise<HotelImage[]>
  publishImages: () => Promise<void>
  updateImageSort: (imageIds: number[]) => Promise<void>
  setDraftImages: (images: HotelImage[]) => void
  setPublishedImages: (images: HotelImage[]) => void
}

// 3. 创建 Store
export const useMerchantStore = create<MerchantState & MerchantActions>()((set, get) => ({
  hotelInfo: null,
  draftImages: [],
  publishedImages: [],

  setHotelInfo: (hotelInfo) => {
    set({ hotelInfo })
  },

  getHotelInfo: async (viewMode?: 'draft' | 'published') => {
    const hotelInfo = await getHotel(viewMode)
    set({ hotelInfo })

    // 获取酒店信息后，根据 viewMode 获取相应图片
    if (hotelInfo?.id) {
      if (viewMode === 'published') {
        // 查看线上版本：获取已发布图片
        const publishedImages = await hotelImageApi.getImages(hotelInfo.id, {
          status: 'published',
          type: 'hotel_main',
        })
        set({ publishedImages })
      } else {
        // 编辑草稿模式：获取草稿图片
        const draftImages = await hotelImageApi.getImages(hotelInfo.id, {
          status: 'draft',
          type: 'hotel_main',
        })
        set({ draftImages })
      }
    }

    return hotelInfo
  },

  updateHotelInfo: async (data) => {
    const hotelInfo = await updateHotel(data)

    // 更新成功后，刷新草稿图片
    if (hotelInfo?.id) {
      const draftImages = await hotelImageApi.getImages(hotelInfo.id, {
        status: 'draft',
        type: 'hotel_main',
      })
      set({ draftImages, hotelInfo })
    }

    return hotelInfo
  },

  submitAudit: async (data) => {
    // 提交审核时不应该发布图片，图片应该在审核通过时发布
    // publishImages 应该在管理员审核通过时调用
    const auditRes = await submitAudit(data)
    return auditRes
  },

  cancelAudit: async () => {
    const cancelRes = await cancelAudit()
    return cancelRes
  },

  addRoomType: (room) => {
    set((state) => {
      if (!state.hotelInfo) return state
      const currentRoomTypes = state.hotelInfo.roomTypes || []
      // 转换为 RoomType（提取 URL string）
      const roomType = convertToRoomType(room)
      return {
        hotelInfo: {
          ...state.hotelInfo,
          roomTypes: [...currentRoomTypes, roomType],
        },
      }
    })
  },

  updateRoomType: (index, room) => {
    set((state) => {
      if (!state.hotelInfo) return state
      const currentRoomTypes = [...(state.hotelInfo.roomTypes || [])]
      // 转换为 RoomType（提取 URL string）
      currentRoomTypes[index] = convertToRoomType(room)
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

  getDraftImages: async () => {
    const hotelInfo = get().hotelInfo
    if (!hotelInfo) return []

    const images = await hotelImageApi.getImages(hotelInfo.id, {
      status: 'draft',
      type: 'hotel_main',
    })
    set({ draftImages: images })
    return images
  },

  getPublishedImages: async () => {
    const hotelInfo = get().hotelInfo
    if (!hotelInfo) return []

    const images = await hotelImageApi.getImages(hotelInfo.id, {
      status: 'published',
      type: 'hotel_main',
    })
    set({ publishedImages: images })
    return images
  },

  copyToDraft: async () => {
    const hotelInfo = get().hotelInfo
    if (!hotelInfo) return []

    const images = await hotelImageApi.copyToDraft(hotelInfo.id)
    // 只过滤出酒店主图，不包含房型图片
    const hotelMainImages = images.filter((img) => img.type === 'hotel_main')
    set({ draftImages: hotelMainImages })
    return hotelMainImages
  },

  publishImages: async () => {
    const hotelInfo = get().hotelInfo
    if (!hotelInfo) return

    await hotelImageApi.publish(hotelInfo.id)
  },

  updateImageSort: async (imageIds: number[]) => {
    await hotelImageApi.updateSort(imageIds)
  },

  setDraftImages: (images) => {
    set({ draftImages: images })
  },

  setPublishedImages: (images) => {
    set({ publishedImages: images })
  },
}))

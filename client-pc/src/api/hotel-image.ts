import service from '@/utils/request.ts'

export interface HotelImage {
  id: number
  hotelId: number
  url: string
  type: 'hotel_main' | 'hotel_room' | 'hotel_banner'
  roomType: string | null
  version: number
  status: 'draft' | 'published' | 'archived'
  sortOrder: number
  filename: string | null
  fileSize: number | null
  mimeType: string | null
  createdBy: number
  updatedBy: number
  createdAt: string
  updatedAt: string
}

export interface GetImagesParams {
  status?: 'draft' | 'published' | 'archived'
  type?: 'hotel_main' | 'hotel_room' | 'hotel_banner'
  roomType?: string
}

const URL = {
  GET_IMAGES: '/upload/hotels',
  COPY_TO_DRAFT: '/upload/hotels',
  PUBLISH: '/upload/hotels',
  UPDATE_SORT: '/upload/images/sort',
}

export default {
  /**
   * 获取酒店图片列表
   * @param hotelId 酒店ID
   * @param params 查询参数
   */
  getImages: (hotelId: number, params?: GetImagesParams) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.roomType) queryParams.append('roomType', params.roomType)

    const queryString = queryParams.toString()
    const url = `${URL.GET_IMAGES}/${hotelId}/images${queryString ? `?${queryString}` : ''}`

    return service.get<any, HotelImage[]>(url)
  },

  /**
   * 复制已发布图片为草稿（进入编辑时调用）
   * @param hotelId 酒店ID
   */
  copyToDraft: (hotelId: number) => {
    return service.post<any, HotelImage[]>(`${URL.COPY_TO_DRAFT}/${hotelId}/images/copy-to-draft`)
  },

  /**
   * 发布图片（提交审核时调用）
   * @param hotelId 酒店ID
   */
  publish: (hotelId: number) => {
    return service.post<any, null>(`${URL.PUBLISH}/${hotelId}/images/publish`)
  },

  /**
   * 更新图片排序
   * @param imageIds 图片ID数组（按排序顺序）
   */
  updateSort: (imageIds: number[]) => {
    return service.put<any, null>(URL.UPDATE_SORT, { imageIds })
  },

  /**
   * 同步酒店图片（保存时调用）
   * @param hotelId 酒店ID
   * @param images 图片URL列表（按排序顺序）
   * @param type 图片类型
   * @param roomType 房型（可选）
   */
  syncImages: (
    hotelId: number,
    images: string[],
    type: string = 'hotel_main',
    roomType?: string
  ) => {
    return service.post<any, null>(`${URL.GET_IMAGES}/${hotelId}/images/sync`, {
      images,
      type,
      roomType,
    })
  },

  /**
   * 删除所有草稿图片（放弃草稿时调用）
   * @param hotelId 酒店ID
   * @param type 图片类型
   * @param roomType 房型（可选）
   */
  deleteAllDraftImages: (hotelId: number, type: string = 'hotel_main', roomType?: string) => {
    return service.delete<any, null>(`${URL.GET_IMAGES}/${hotelId}/images/draft`, {
      data: { type, roomType },
    })
  },
}

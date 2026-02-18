import service from '@/utils/request.ts'
import type { UploadImageResponse, UploadImagesResponse, ImageType } from '@/types'

const URL = {
  UPLOAD_IMAGE: '/upload/hotels',
  DELETE_IMAGE: '/upload/images',
}

export interface UploadOptions {
  type?: ImageType
  hotelId?: number
  roomType?: string
}

export default {
  /**
   * 单图上传（支持分类路径）
   * @param file 图片文件
   * @param options 上传选项
   * @returns 上传结果
   */
  uploadImage: (file: File, options: UploadOptions = {}) => {
    const formData = new FormData()
    formData.append('image', file)

    // 构建查询参数
    const params = new URLSearchParams()
    if (options.type) params.append('type', options.type)
    if (options.roomType) params.append('roomType', options.roomType || '')

    const queryString = params.toString()
    const baseUrl = options.hotelId
      ? `${URL.UPLOAD_IMAGE}/${options.hotelId}/images`
      : `${URL.UPLOAD_IMAGE}/0/images` // 如果没有hotelId，使用0作为占位符
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    return service.post<any, UploadImageResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * 多图上传（支持分类路径）
   * @param files 图片文件数组
   * @param options 上传选项
   * @returns 上传结果数组
   */
  uploadImages: (files: File[], options: UploadOptions = {}) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    // 构建查询参数
    const params = new URLSearchParams()
    if (options.type) params.append('type', options.type)
    if (options.roomType) params.append('roomType', options.roomType || '')

    const queryString = params.toString()
    const baseUrl = options.hotelId
      ? `${URL.UPLOAD_IMAGE}/${options.hotelId}/images`
      : `${URL.UPLOAD_IMAGE}/0/images`
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    return service.post<any, UploadImagesResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * 删除图片
   * @param imageId 图片ID
   * @returns 删除结果
   */
  deleteImage: (imageId: number) => {
    return service.delete<any, { success: boolean }>(`${URL.DELETE_IMAGE}/${imageId}`)
  },
}

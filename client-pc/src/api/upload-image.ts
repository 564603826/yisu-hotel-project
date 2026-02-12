import service from '@/utils/request.ts'
import type { UploadImageResponse, UploadImagesResponse } from '@/types'

const URL = {
  UPLOAD_IMAGE: '/upload/image',
  UPLOAD_IMAGES: '/upload/images',
}

export default {
  /**
   * 单图上传
   * @param file 图片文件
   * @returns 上传结果
   */
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return service.post<any, UploadImageResponse>(URL.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * 多图上传
   * @param files 图片文件数组
   * @returns 上传结果数组
   */
  uploadImages: (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    return service.post<any, UploadImagesResponse>(URL.UPLOAD_IMAGES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

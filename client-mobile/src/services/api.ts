import axios from 'axios'
import type {
  ApiResponse,
  Banner,
  HotelDetail,
  HotelListResponse,
  HotelSearchParams,
  HotelListParams,
  FilterOptions,
  QuickTagsResponse,
  CitiesResponse,
} from '../types/api'

const BASE_URL = 'http://112.124.2.205/api/v1'
const IMAGE_BASE_URL = 'http://112.124.2.205'

export const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${IMAGE_BASE_URL}${url}`
}

export const processHotelImages = (hotel: any): any => {
  return {
    ...hotel,
    mainImage: getFullImageUrl(hotel.mainImage),
    images: hotel.images?.map((img: string) => getFullImageUrl(img)),
  }
}

export const processHotelDetail = (hotel: HotelDetail): HotelDetail => {
  return {
    ...hotel,
    mainImage: getFullImageUrl(hotel.mainImage),
    images: hotel.images?.map((img) => getFullImageUrl(img)),
    roomTypes: hotel.roomTypes?.map((room) => ({
      ...room,
      images: room.images?.map((img) => getFullImageUrl(img)),
    })),
  }
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const bannerApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await apiClient.get<ApiResponse<{ banners: Banner[] }>>('/mobile/banners')
    const banners = response.data.data.banners
    return banners.map((banner) => ({
      ...banner,
      imageUrl: getFullImageUrl(banner.imageUrl),
    }))
  },
}

export const hotelApi = {
  searchHotels: async (params: HotelSearchParams): Promise<HotelListResponse> => {
    const response = await apiClient.get<ApiResponse<HotelListResponse>>('/mobile/hotels/search', {
      params,
    })
    const data = response.data.data
    return {
      ...data,
      list: data.list.map((hotel) => processHotelImages(hotel)),
    }
  },

  getHotelList: async (params: HotelListParams): Promise<HotelListResponse> => {
    const response = await apiClient.get<ApiResponse<HotelListResponse>>('/mobile/hotels', {
      params,
    })
    const data = response.data.data
    return {
      ...data,
      list: data.list.map((hotel) => processHotelImages(hotel)),
    }
  },

  getHotelDetail: async (id: number): Promise<HotelDetail> => {
    const response = await apiClient.get<ApiResponse<HotelDetail>>(`/mobile/hotels/${id}`)
    return processHotelDetail(response.data.data)
  },
}

export const filterApi = {
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await apiClient.get<ApiResponse<FilterOptions>>('/mobile/filters/options')
    return response.data.data
  },

  getQuickTags: async (): Promise<QuickTagsResponse> => {
    const response = await apiClient.get<ApiResponse<QuickTagsResponse>>('/mobile/filters/tags')
    return response.data.data
  },
}

export const cityApi = {
  getCities: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<CitiesResponse>>('/mobile/cities')
    return response.data.data.cities
  },
}

export default apiClient

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  hotelId: number;
}

export interface DiscountInfo {
  type: string;
  name: string;
  value: number;
  description?: string;
}

export interface Hotel {
  id: number;
  nameZh: string;
  nameEn: string;
  address: string;
  starRating: number;
  price: number;
  originalPrice?: number;
  discountInfo?: DiscountInfo;
  mainImage: string;
  images?: string[];
  tags?: string[];
  facilities?: string[];
}

export interface HotelDetail extends Hotel {
  openDate?: string;
  description?: string;
  nearby?: {
    attractions: Array<{ name: string; distance: string }>;
    transport: Array<{ name: string; distance: string }>;
    malls: Array<{ name: string; distance: string }>;
  };
  roomTypes?: RoomType[];
}

export interface RoomType {
  name: string;
  price: number;
  originalPrice?: number;
  area: number;
  bedType: string;
  facilities: string[];
  images: string[];
  breakfast: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SearchParams {
  city?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface HotelListResponse {
  list: Hotel[];
  pagination: Pagination;
  queryInfo?: {
    city?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
}

export interface HotelSearchParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface HotelListParams {
  keyword?: string;
  city?: string;
  province?: string;
  district?: string;
  starRating?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  facilities?: string;
  roomTypes?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface FilterOptions {
  starRatings: Array<{ value: number; label: string }>;
  priceRanges: Array<{ min: number; max: number | null; label: string }>;
  sortOptions: Array<{ value: string; label: string }>;
  locations: {
    provinces: Array<{ value: string; label: string }>;
    cities: Array<{ value: string; label: string }>;
    districts: Array<{ value: string; label: string }>;
  };
  facilities: Array<{ value: string; label: string }>;
  roomTypes: Array<{ value: string; label: string }>;
}

export interface QuickTag {
  id: number;
  name: string;
  icon: string;
}

export interface QuickTagsResponse {
  tags: QuickTag[];
}



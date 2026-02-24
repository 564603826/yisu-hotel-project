import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HotelCard from "../../components/hotelList/HotelCard";
import FilterPanel from "../../components/hotelList/FilterPanel";
import SortPanel from "../../components/hotelList/SortPanel";
import { hotelApi, filterApi } from "../../services/api";
import type { Hotel, HotelListParams, FilterOptions } from "../../types/api";
import "./HotelListPage.scss";

const HotelListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "default");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );

  const loadMoreHotels = async () => {
    if (loadingMore || loading || pagination.page >= pagination.totalPages) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const params = {
        ...getFilterParams(),
        page: nextPage
      };

      let data;
      if (params.keyword) {
        data = await hotelApi.searchHotels({
          keyword: params.keyword,
          page: nextPage,
          limit: params.limit
        });
      } else {
        data = await hotelApi.getHotelList(params);
      }

      setHotels(prevHotels => [...prevHotels, ...data.list]);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load more hotels:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getFilterParams = useCallback((): HotelListParams => {
    const keyword = searchParams.get("keyword");
    const city = searchParams.get("city");
    const starRating = searchParams.get("starRating");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const tags = searchParams.get("tags");
    const page = parseInt(searchParams.get("page") || "1");
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");

    return {
      keyword: keyword || undefined,
      city: city || undefined,
      starRating: starRating || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      tags: tags || undefined,
      sortBy: sortBy || "default",
      page,
      limit: 10,
      checkInDate: checkInDate || undefined,
      checkOutDate: checkOutDate || undefined,
    };
  }, [searchParams, sortBy]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const data = await filterApi.getFilterOptions();
        setFilterOptions(data);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      
      // 当滚动到距离底部100px时触发加载更多
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreHotels();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, loading, pagination.page, pagination.totalPages, loadMoreHotels]);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const params = getFilterParams();

        if (params.keyword) {
          const data = await hotelApi.searchHotels({
            keyword: params.keyword,
            page: 1, // 重置为第一页
            limit: params.limit,
          });
          setHotels(data.list);
          setPagination(data.pagination);
        } else {
          const data = await hotelApi.getHotelList({
            ...params,
            page: 1, // 重置为第一页
          });
          setHotels(data.list);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [getFilterParams]);

  const handleHotelClick = (hotelId: number) => {
    navigate(`/hotels/${hotelId}`);
  };

  const handleFilterChange = (filters: {
    priceRange?: [number, number];
    starRating?: number[];
    facilities?: string[];
    city?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);

    if (filters.city) {
      newParams.set("city", filters.city);
    } else {
      newParams.delete("city");
    }

    if (filters.starRating && filters.starRating.length > 0) {
      newParams.set("starRating", filters.starRating.join(","));
    } else {
      newParams.delete("starRating");
    }

    if (filters.priceRange) {
      if (filters.priceRange[0] > 0) {
        newParams.set("minPrice", filters.priceRange[0].toString());
      } else {
        newParams.delete("minPrice");
      }
      if (filters.priceRange[1] < 10000) {
        newParams.set("maxPrice", filters.priceRange[1].toString());
      } else {
        newParams.delete("maxPrice");
      }
    }

    newParams.set("page", "1");
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    const newParams = new URLSearchParams(searchParams);
    if (newSortBy && newSortBy !== "default") {
      newParams.set("sortBy", newSortBy);
    } else {
      newParams.delete("sortBy");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const getCurrentFilters = () => {
    const starRating = searchParams.get("starRating");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    return {
      priceRange: [
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : 10000,
      ] as [number, number],
      starRating: starRating ? starRating.split(",").map(Number) : [],
      facilities: [],
    };
  };

  const handleDateChange = (type: "checkIn" | "checkOut", date: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (date) {
      newParams.set(type === "checkIn" ? "checkInDate" : "checkOutDate", date);
    } else {
      newParams.delete(type === "checkIn" ? "checkInDate" : "checkOutDate");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="hotel-list-page">
      <div className="search-header">
        <div className="date-selector">
          <div className="date-input-group">
            <label>入住</label>
            <input
              type="date"
              value={searchParams.get("checkInDate") || getToday()}
              min={getToday()}
              onChange={(e) => handleDateChange("checkIn", e.target.value)}
            />
          </div>
          <div className="date-separator">→</div>
          <div className="date-input-group">
            <label>离店</label>
            <input
              type="date"
              value={searchParams.get("checkOutDate") || getTomorrow()}
              min={searchParams.get("checkInDate") || getToday()}
              onChange={(e) => handleDateChange("checkOut", e.target.value)}
            />
          </div>
        </div>

        <div className="list-controls">
          <button
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 筛选
          </button>
          <SortPanel
            sortBy={sortBy}
            onSortChange={handleSortChange}
            options={filterOptions?.sortOptions?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>
      </div>

      {showFilters && filterOptions && (
        <div className="filter-overlay">
          <FilterPanel
            onFilterChange={handleFilterChange}
            initialFilters={getCurrentFilters()}
            options={filterOptions}
          />
        </div>
      )}

      <div className="hotel-list">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : hotels.length > 0 ? (
          <>
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onClick={() => handleHotelClick(hotel.id)}
              />
            ))}

            {loadingMore && (
              <div className="loading-more">
                <div className="loading-spinner"></div>
                <span>加载更多...</span>
              </div>
            )}
            
            {!loadingMore && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-button"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  上一页
                </button>
                <span className="page-info">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="page-button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <p className="empty-text">暂无符合条件的结果</p>
            <button
              className="empty-action"
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setSortBy("default");
              }}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelListPage;

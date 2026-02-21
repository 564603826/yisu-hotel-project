import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../../components/home/Banner';
import SearchBar from '../../components/home/SearchBar';
import QuickFilters from '../../components/home/QuickFilters';
import { hotelApi } from '../../services/api';
import type { Hotel } from '../../types/api';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await hotelApi.getHotelList({ page: 1, limit: 6 });
        setHotels(data.list);
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const handleSearch = (searchParams: { keyword: string; address?: string; lng?: number; lat?: number }) => {
    const params = new URLSearchParams();
    if (searchParams.keyword) {
      params.set('keyword', searchParams.keyword);
    }
    if (searchParams.address) {
      params.set('address', searchParams.address);
    }
    if (searchParams.lng) {
      params.set('lng', searchParams.lng.toString());
    }
    if (searchParams.lat) {
      params.set('lat', searchParams.lat.toString());
    }
    navigate(`/hotels?${params.toString()}`);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="home-page">
      <div className="home-page-content">
        <Banner />
        
        <div className="search-section">
          <SearchBar onSearch={handleSearch} />
          <QuickFilters />
        </div>
        
        <div className="hot-recommendation">
          <h2 className="section-title">热门推荐</h2>
          <div className="hot-hotels">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="hotel-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-desc"></div>
                    <div className="skeleton-price"></div>
                  </div>
                </div>
              ))
            ) : hotels.length > 0 ? (
              hotels.map((hotel) => (
                <div 
                  key={hotel.id} 
                  className="hotel-card" 
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                >
                  <div 
                    className="hotel-image"
                    style={{ 
                      backgroundImage: hotel.mainImage ? `url(${hotel.mainImage})` : undefined 
                    }}
                  >
                    {!hotel.mainImage && <span className="image-placeholder">🏨</span>}
                  </div>
                  <div className="hotel-info">
                    <h3 className="hotel-name">{hotel.nameZh}</h3>
                    <p className="hotel-location">📍 {hotel.address}</p>
                    <div className="hotel-rating">
                      <span className="stars">{renderStars(hotel.starRating)}</span>
                      <span className="rating">{hotel.starRating}星</span>
                    </div>
                    <div className="hotel-tags">
                      {hotel.tags?.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="hotel-price">
                      {hotel.discountInfo && (
                        <span className="discount-tag">{hotel.discountInfo.name}</span>
                      )}
                      <span className="price">¥{hotel.price}</span>
                      {hotel.originalPrice && (
                        <span className="original-price">¥{hotel.originalPrice}</span>
                      )}
                      <span className="unit">起/晚</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏨</div>
                <p className="empty-text">暂无酒店数据</p>
                <button 
                  className="empty-action"
                  onClick={() => navigate('/hotels')}
                >
                  查看全部酒店
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

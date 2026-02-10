import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import HotelCard from '../../components/hotelList/HotelCard';
import FilterPanel from '../../components/hotelList/FilterPanel';
import SortPanel from '../../components/hotelList/SortPanel';
import './HotelListPage.scss';

const HotelListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  
  // 模拟酒店数据
  const mockHotels = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `示例酒店 ${i + 1}`,
    location: '北京市朝阳区',
    rating: 4 + Math.random() * 1,
    price: 300 + Math.floor(Math.random() * 200),
    image: '',
    facilities: ['免费WiFi', '停车场', '早餐'],
    star: Math.floor(Math.random() * 5) + 1,
  }));
  
  useEffect(() => {
    // 模拟加载数据
    setLoading(true);
    setTimeout(() => {
      const sortedHotels = [...mockHotels].sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'rating_desc') return b.rating - a.rating;
        return 0;
      });
      setHotels(sortedHotels);
      setLoading(false);
    }, 500);
  }, [sortBy]);
  
  const handleHotelClick = (hotelId: number) => {
    navigate(`/hotels/${hotelId}`);
  };
  
  const handleFilterChange = (filters: any) => {
    console.log('筛选条件:', filters);
    setShowFilters(false);
  };
  
  return (
    <div className="hotel-list-page">
      <Header title="酒店列表" showBack={true} />
      
      <div className="list-controls">
        <button 
          className="filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 筛选
        </button>
        <SortPanel sortBy={sortBy} onSortChange={setSortBy} />
      </div>
      
      {showFilters && (
        <div className="filter-overlay">
          <FilterPanel onFilterChange={handleFilterChange} />
        </div>
      )}
      
      <div className="hotel-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : hotels.length > 0 ? (
          hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onClick={() => handleHotelClick(hotel.id)}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <p className="empty-text">暂无符合条件的结果</p>
            <button 
              className="empty-action"
              onClick={() => setShowFilters(true)}
            >
              重新筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelListPage;
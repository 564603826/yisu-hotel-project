import React from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../../components/home/Banner';
import SearchBar from '../../components/home/SearchBar';
import QuickFilters from '../../components/home/QuickFilters';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSearch = (searchParams: any) => {
    navigate(`/hotels?${new URLSearchParams(searchParams).toString()}`);
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="hotel-card" onClick={() => navigate(`/hotels/${i}`)}>
                <div className="hotel-image"></div>
                <div className="hotel-info">
                  <h3>示例酒店 {i}</h3>
                  <p className="hotel-location">📍 北京市朝阳区</p>
                  <div className="hotel-rating">
                    <span className="stars">★★★★☆</span>
                    <span className="rating">4.{i}</span>
                  </div>
                  <div className="hotel-price">
                    <span className="price">¥{300 + i * 50}</span>
                    <span className="unit">起/晚</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
import React, { useState } from 'react';
import './SearchBar.scss';

interface SearchBarProps {
  onSearch: (params: any) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('北京');
  const [checkIn, setCheckIn] = useState('2024-01-15');
  const [checkOut, setCheckOut] = useState('2024-01-16');
  
  const handleSearch = () => {
    onSearch({
      location,
      checkIn,
      checkOut,
      guests: 2,
    });
  };
  
  return (
    <div className="search-bar">
      <div className="search-fields">
        <div className="search-field">
          <label>📍 地点</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="输入城市或酒店名"
          />
        </div>
        
        <div className="search-field">
          <label>📅 入住</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        
        <div className="search-field">
          <label>📅 离店</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
      </div>
      
      <button className="search-button" onClick={handleSearch}>
        🔍 搜索酒店
      </button>
    </div>
  );
};

export default SearchBar;
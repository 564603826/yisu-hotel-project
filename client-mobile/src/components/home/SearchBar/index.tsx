import React, { useState } from 'react';
import './SearchBar.scss';
import LocationPicker from '../../common/LocationPicker';

interface SearchBarProps {
  onSearch: (params: { keyword: string; address?: string; lng?: number; lat?: number }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const handleSearch = () => {
    onSearch({
      keyword,
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleLocationSelect = (location: { address: string; lng: number; lat: number }) => {
    setKeyword(location.address);
    onSearch({
      keyword: location.address,
      address: location.address,
      lng: location.lng,
      lat: location.lat,
    });
  };
  
  return (
    <div className="search-bar">
      <div className="search-fields">
        <div className="search-field search-field-full">
          <div className="destination-input-wrapper">
            <label>📍 目的地/酒店</label>
            <div className="input-with-locate">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="搜索城市或酒店名称"
              />
              <button 
                className="locate-button" 
                onClick={() => setShowLocationPicker(true)}
                title="定位"
              >
                📍
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <button className="search-button" onClick={handleSearch}>
        🔍 搜索酒店
      </button>
      
      <LocationPicker
        show={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationSelect}
      />
    </div>
  );
};

export default SearchBar;

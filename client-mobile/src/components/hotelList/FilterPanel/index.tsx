import React, { useState } from 'react';
import './FilterPanel.scss';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    starRating: [] as number[],
    facilities: [] as string[],
  });
  
  const handleApply = () => {
    onFilterChange(filters);
  };
  
  const handleReset = () => {
    const resetFilters = {
      priceRange: [0, 1000] as [number, number],
      starRating: [] as number[],
      facilities: [] as string[],
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>价格范围</h3>
        <div className="price-range">
          <span className="price-min">¥{filters.priceRange[0]}</span>
          <span className="price-separator">-</span>
          <span className="price-max">¥{filters.priceRange[1]}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          step="50"
          value={filters.priceRange[1]}
          onChange={(e) => setFilters({
            ...filters,
            priceRange: [filters.priceRange[0], parseInt(e.target.value)]
          })}
          className="price-slider"
        />
      </div>
      
      <div className="filter-section">
        <h3>酒店星级</h3>
        <div className="star-rating">
          {[5, 4, 3].map((star) => (
            <button
              key={star}
              className={`star-button ${filters.starRating.includes(star) ? 'active' : ''}`}
              onClick={() => {
                const newStars = filters.starRating.includes(star)
                  ? filters.starRating.filter(s => s !== star)
                  : [...filters.starRating, star];
                setFilters({ ...filters, starRating: newStars });
              }}
            >
              {'★'.repeat(star)}
              <span className="star-label">{star}星</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="filter-section">
        <h3>设施服务</h3>
        <div className="facilities">
          {['免费WiFi', '停车场', '早餐', '健身房', '游泳池'].map((facility) => (
            <button
              key={facility}
              className={`facility-button ${filters.facilities.includes(facility) ? 'active' : ''}`}
              onClick={() => {
                const newFacilities = filters.facilities.includes(facility)
                  ? filters.facilities.filter(f => f !== facility)
                  : [...filters.facilities, facility];
                setFilters({ ...filters, facilities: newFacilities });
              }}
            >
              {facility}
            </button>
          ))}
        </div>
      </div>
      
      <div className="filter-actions">
        <button className="reset-button" onClick={handleReset}>重置</button>
        <button className="apply-button" onClick={handleApply}>应用筛选</button>
      </div>
    </div>
  );
};

export default FilterPanel;
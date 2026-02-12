import React from 'react';
import './QuickFilters.scss';

const QuickFilters: React.FC = () => {
  const filters = [
    { id: 'family', label: '亲子', icon: '👨‍👩‍👧' },
    { id: 'luxury', label: '豪华', icon: '✨' },
    { id: 'parking', label: '停车', icon: '🅿️' },
    { id: 'breakfast', label: '早餐', icon: '🍳' },
    { id: 'wifi', label: 'WiFi', icon: '📶' },
    { id: 'pool', label: '泳池', icon: '🏊' },
  ];
  
  return (
    <div className="quick-filters">
      <h3 className="filters-title">快捷筛选</h3>
      <div className="filters-list">
        {filters.map((filter) => (
          <button key={filter.id} className="filter-button">
            <span className="filter-icon">{filter.icon}</span>
            <span className="filter-label">{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickFilters;
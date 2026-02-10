import React from 'react';
import './SortPanel.scss';

interface SortPanelProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const SortPanel: React.FC<SortPanelProps> = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    { value: 'default', label: '默认排序' },
    { value: 'price_asc', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'rating_desc', label: '评分从高到低' },
  ];
  
  return (
    <div className="sort-panel">
      <select 
        className="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortPanel;
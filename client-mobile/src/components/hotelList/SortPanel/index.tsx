import React from 'react';
import './SortPanel.scss';

interface SortPanelProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  options?: Array<{ value: string; label: string }>;
}

const SortPanel: React.FC<SortPanelProps> = ({ 
  sortBy, 
  onSortChange,
  options 
}) => {
  const defaultOptions = [
    { value: 'default', label: '综合推荐' },
    { value: 'price-asc', label: '价格从低到高' },
    { value: 'price-desc', label: '价格从高到低' },
  ];
  
  const sortOptions = options || defaultOptions;
  
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

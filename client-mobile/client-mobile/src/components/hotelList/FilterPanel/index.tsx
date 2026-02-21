import React, { useState, useEffect } from "react";
import type { FilterOptions } from "../../../types/api";
import "./FilterPanel.scss";

interface FilterPanelProps {
  onFilterChange: (filters: {
    priceRange?: [number, number];
    starRating?: number[];
    facilities?: string[];
    city?: string;
  }) => void;
  initialFilters?: {
    priceRange: [number, number];
    starRating: number[];
    facilities: string[];
  };
  options?: FilterOptions;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  initialFilters,
  options,
}) => {
  const [filters, setFilters] = useState({
    priceRange: initialFilters?.priceRange || [0, 5000],
    starRating: initialFilters?.starRating || [],
    facilities: initialFilters?.facilities || [],
    city: "",
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters((prev) => ({
        ...prev,
        priceRange: initialFilters.priceRange,
        starRating: initialFilters.starRating,
        facilities: initialFilters.facilities,
      }));
    }
  }, [initialFilters]);

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      priceRange: [0, 5000] as [number, number],
      starRating: [] as number[],
      facilities: [] as string[],
      city: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const starRatings = options?.starRatings || [
    { value: 5, label: "五星级" },
    { value: 4, label: "四星级" },
    { value: 3, label: "三星级" },
    { value: 2, label: "二星级" },
    { value: 1, label: "一星级" },
  ];

  const priceRanges = options?.priceRanges || [
    { min: 0, max: 200, label: "¥200以下" },
    { min: 200, max: 500, label: "¥200-500" },
    { min: 500, max: 1000, label: "¥500-1000" },
    { min: 1000, max: 2000, label: "¥1000-2000" },
    { min: 2000, max: null, label: "¥2000以上" },
  ];

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>价格范围</h3>
        <div className="price-range">
          <span className="price-min">¥{filters.priceRange[0]}</span>
          <span className="price-separator">-</span>
          <span className="price-max">
            ¥{filters.priceRange[1] === 5000 ? "5000+" : filters.priceRange[1]}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5000"
          step="100"
          value={filters.priceRange[1]}
          onChange={(e) =>
            setFilters({
              ...filters,
              priceRange: [filters.priceRange[0], parseInt(e.target.value)],
            })
          }
          className="price-slider"
        />
        <div className="price-quick-select">
          {priceRanges.slice(0, 4).map((range, index) => (
            <button
              key={index}
              className={`price-button ${
                filters.priceRange[0] === range.min &&
                (filters.priceRange[1] === range.max ||
                  (range.max === null && filters.priceRange[1] >= 5000))
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setFilters({
                  ...filters,
                  priceRange: [range.min, range.max || 5000],
                })
              }
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>酒店星级</h3>
        <div className="star-rating">
          {starRatings.map((star) => (
            <button
              key={star.value}
              className={`star-button ${filters.starRating.includes(star.value) ? "active" : ""}`}
              onClick={() => {
                const newStars = filters.starRating.includes(star.value)
                  ? filters.starRating.filter((s) => s !== star.value)
                  : [...filters.starRating, star.value];
                setFilters({ ...filters, starRating: newStars });
              }}
            >
              {"★".repeat(star.value)}
              <span className="star-label">{star.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-actions">
        <button className="reset-button" onClick={handleReset}>
          重置
        </button>
        <button className="apply-button" onClick={handleApply}>
          应用筛选
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;

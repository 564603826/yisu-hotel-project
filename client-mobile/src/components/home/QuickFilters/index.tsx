import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterApi } from "../../../services/api";
import type { QuickTag } from "../../../types/api";
import "./QuickFilters.scss";

const QuickFilters: React.FC = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<QuickTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await filterApi.getQuickTags();
        setTags(data.tags);
      } catch (error) {
        console.error("Failed to fetch quick tags:", error);
        setTags([
          { id: 1, name: "亲子", icon: "baby" },
          { id: 2, name: "豪华", icon: "crown" },
          { id: 3, name: "湖景", icon: "waves" },
          { id: 4, name: "山景", icon: "mountain" },
          { id: 5, name: "免费停车", icon: "car" },
          { id: 6, name: "商务", icon: "briefcase" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tag: QuickTag) => {
    navigate(`/hotels?tags=${tag.name}`);
  };

  const iconMap: Record<string, string> = {
    baby: "👨‍👩‍👧",
    crown: "✨",
    waves: "🌊",
    mountain: "⛰️",
    car: "🅿️",
    briefcase: "💼",
    umbrella: "🏖️",
    camera: "📸",
  };

  if (loading) {
    return (
      <div className="quick-filters">
        <h3 className="filters-title">快捷筛选</h3>
        <div className="filters-list">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="filter-skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quick-filters">
      <h3 className="filters-title">快捷筛选</h3>
      <div className="filters-list">
        {tags.map((tag) => (
          <button
            key={tag.id}
            className="filter-button"
            onClick={() => handleTagClick(tag)}
          >
            <span className="filter-icon">{iconMap[tag.icon] || "🏨"}</span>
            <span className="filter-label">{tag.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickFilters;

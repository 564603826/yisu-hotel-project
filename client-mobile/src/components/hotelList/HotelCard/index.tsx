import React from "react";
import type { Hotel } from "../../../types/api";
import "./HotelCard.scss";

interface HotelCardProps {
  hotel: Hotel;
  onClick: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onClick }) => {
  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="hotel-card" onClick={onClick}>
      <div
        className="hotel-image"
        style={{
          backgroundImage: hotel.mainImage
            ? `url(${hotel.mainImage})`
            : undefined,
        }}
      >
        {!hotel.mainImage && <span className="image-placeholder">🏨</span>}
        {hotel.discountInfo && (
          <span className="discount-badge">{hotel.discountInfo.name}</span>
        )}
      </div>
      <div className="hotel-content">
        <div className="hotel-header">
          <h3 className="hotel-name">{hotel.nameZh}</h3>
          <div className="hotel-rating">
            <span className="stars">{renderStars(hotel.starRating)}</span>
            <span className="rating">{hotel.starRating}星</span>
          </div>
        </div>

        <div className="hotel-location">
          <span className="location-icon">📍</span>
          <span className="location-text">{hotel.address}</span>
        </div>

        <div className="hotel-tags">
          {hotel.tags?.slice(0, 4).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="hotel-footer">
          <div className="hotel-price">
            {hotel.originalPrice && (
              <span className="original-price">¥{hotel.originalPrice}</span>
            )}
            <div className="price-amount">
              <span className="currency">¥</span>
              <span className="amount">{hotel.price}</span>
              <span className="unit">起/晚</span>
            </div>
          </div>
          <button className="book-button">查看</button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;

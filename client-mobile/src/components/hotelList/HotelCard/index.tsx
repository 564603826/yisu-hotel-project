import React from 'react';
import './HotelCard.scss';

interface HotelCardProps {
  hotel: {
    id: number;
    name: string;
    location: string;
    rating: number;
    price: number;
    facilities: string[];
    star: number;
  };
  onClick: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onClick }) => {
  return (
    <div className="hotel-card" onClick={onClick}>
      <div className="hotel-image"></div>
      <div className="hotel-content">
        <div className="hotel-header">
          <h3 className="hotel-name">{hotel.name}</h3>
          <div className="hotel-rating">
            <span className="stars">★</span>
            <span className="rating">{hotel.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="hotel-location">
          <span className="location-icon">📍</span>
          {hotel.location}
        </div>
        
        <div className="hotel-facilities">
          {hotel.facilities.slice(0, 3).map((facility, index) => (
            <span key={index} className="facility-tag">
              {facility}
            </span>
          ))}
          {hotel.facilities.length > 3 && (
            <span className="more-facilities">+{hotel.facilities.length - 3}</span>
          )}
        </div>
        
        <div className="hotel-footer">
          <div className="hotel-price">
            <span className="price-label">最低价</span>
            <div className="price-amount">
              <span className="currency">¥</span>
              <span className="amount">{hotel.price}</span>
              <span className="unit">起/晚</span>
            </div>
          </div>
          <button className="book-button">预订</button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
import React, { useState } from "react";
import type { RoomType } from "../../../types/api";
import "./RoomList.scss";

interface RoomImageCarouselProps {
  images: string[];
  alt: string;
}

const RoomImageCarousel: React.FC<RoomImageCarouselProps> = ({
  images,
  alt,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="room-image-carousel">
      <div className="carousel-main">
        {images.length > 1 && (
          <button className="carousel-button prev" onClick={handlePrev}>
            ‹
          </button>
        )}
        <img src={images[currentIndex]} alt={alt} className="carousel-image" />
        {images.length > 1 && (
          <button className="carousel-button next" onClick={handleNext}>
            ›
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="carousel-indicator">
          {images.map((_, index) => (
            <div
              key={index}
              className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface RoomListProps {
  rooms: RoomType[];
  onBook: (roomName: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onBook }) => {
  return (
    <div className="room-list">
      {rooms.map((room, index) => (
        <div key={index} className="room-card">
          {room.images && room.images.length > 0 && (
            <RoomImageCarousel images={room.images} alt={room.name} />
          )}

          <div className="room-header">
            <h3 className="room-name">{room.name}</h3>
            <div className="room-price">
              {room.originalPrice && (
                <span className="original-price">¥{room.originalPrice}</span>
              )}
              <span className="price-amount">¥{room.price}</span>
              <span className="price-unit">/晚</span>
            </div>
          </div>

          <div className="room-details">
            <span className="room-area">{room.area}㎡</span>
            <span className="room-bed">|</span>
            <span className="room-bed-type">{room.bedType}</span>
          </div>

          <div className="room-amenities">
            {room.facilities?.map((facility, idx) => (
              <span key={idx} className="amenity-tag">
                {facility}
              </span>
            ))}
            {room.breakfast && (
              <span className="amenity-tag breakfast">含早餐</span>
            )}
          </div>

          <div className="room-footer">
            <button className="book-button" onClick={() => onBook(room.name)}>
              立即预订
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomList;

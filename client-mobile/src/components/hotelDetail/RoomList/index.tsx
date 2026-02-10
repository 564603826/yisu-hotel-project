import React from 'react';
import './RoomList.scss';

interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  amenities: string[];
  available: boolean;
}

interface RoomListProps {
  rooms: Room[];
  onBook: (roomId: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onBook }) => {
  return (
    <div className="room-list">
      {rooms.map((room) => (
        <div key={room.id} className="room-card">
          <div className="room-header">
            <h3 className="room-name">{room.name}</h3>
            <div className="room-price">
              <span className="price-amount">¥{room.price}</span>
              <span className="price-unit">/晚</span>
            </div>
          </div>
          
          <p className="room-description">{room.description}</p>
          
          <div className="room-amenities">
            {room.amenities.map((amenity, index) => (
              <span key={index} className="amenity-tag">
                {amenity}
              </span>
            ))}
          </div>
          
          <div className="room-footer">
            {room.available ? (
              <button 
                className="book-button"
                onClick={() => onBook(room.id)}
              >
                立即预订
              </button>
            ) : (
              <button className="book-button disabled" disabled>
                已售罄
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomList;
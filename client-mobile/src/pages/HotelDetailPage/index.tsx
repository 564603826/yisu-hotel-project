import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import ImageGallery from '../../components/hotelDetail/ImageGallery';
import RoomList from '../../components/hotelDetail/RoomList';
import './HotelDetailPage.scss';

const HotelDetailPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-01');
  
  // 模拟酒店数据
  const hotelData = {
    id: hotelId,
    name: `示例酒店 ${hotelId}`,
    rating: 4.5,
    location: '北京市朝阳区建国门外大街1号',
    description: '这是一家地理位置优越、服务周到的五星级酒店。',
    facilities: ['免费WiFi', '停车场', '游泳池', '健身房', '餐厅', '会议室'],
    images: Array.from({ length: 5 }, (_, i) => `hotel-image-${i + 1}`),
  };
  
  // 模拟房型数据
  const roomTypes = [
    {
      id: '1',
      name: '标准大床房',
      description: '25平米，大床，免费WiFi，早餐',
      price: 388,
      amenities: ['WiFi', '电视', '空调', '早餐'],
      available: true,
    },
    {
      id: '2',
      name: '豪华双床房',
      description: '35平米，双床，海景，早餐',
      price: 588,
      amenities: ['WiFi', '电视', '空调', '早餐', '海景'],
      available: true,
    },
    {
      id: '3',
      name: '行政套房',
      description: '60平米，独立客厅，行政酒廊',
      price: 888,
      amenities: ['WiFi', '电视', '空调', '早餐', '酒廊', '行政待遇'],
      available: true,
    },
  ];
  
  const handleBookRoom = (roomId: string) => {
    alert(`预订房型 ${roomId}，入住日期：${selectedDate}`);
  };
  
  return (
    <div className="hotel-detail-page">
      <Header title={hotelData.name} showBack={true} />
      
      <div className="detail-content">
        <ImageGallery images={hotelData.images} />
        
        <div className="hotel-info">
          <div className="hotel-header">
            <h1 className="hotel-name">{hotelData.name}</h1>
            <div className="hotel-rating">
              <span className="stars">★★★★☆</span>
              <span className="rating">{hotelData.rating}</span>
            </div>
          </div>
          
          <div className="hotel-location">
            <span className="location-icon">📍</span>
            {hotelData.location}
          </div>
          
          <div className="hotel-description">
            {hotelData.description}
          </div>
          
          <div className="hotel-facilities">
            <h3>酒店设施</h3>
            <div className="facilities-list">
              {hotelData.facilities.map((facility, index) => (
                <span key={index} className="facility-tag">
                  {facility}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="date-selection">
          <div className="date-header">
            <h3>选择入住日期</h3>
            <span className="date-display">{selectedDate}</span>
          </div>
          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        
        <div className="rooms-section">
          <h2 className="rooms-title">选择房型</h2>
          <RoomList rooms={roomTypes} onBook={handleBookRoom} />
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
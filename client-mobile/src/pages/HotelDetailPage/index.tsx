import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageGallery from '../../components/hotelDetail/ImageGallery';
import RoomList from '../../components/hotelDetail/RoomList';
import { hotelApi } from '../../services/api';
import type { HotelDetail } from '../../types/api';
import './HotelDetailPage.scss';

const HotelDetailPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotelDetail = async () => {
      if (!hotelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await hotelApi.getHotelDetail(parseInt(hotelId));
        setHotel(data);
      } catch (err) {
        console.error('Failed to fetch hotel detail:', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetail();
  }, [hotelId]);

  const handleBookRoom = (roomName: string) => {
    alert(`预订房型：${roomName}`);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="hotel-detail-page">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-detail-page">
        <div className="detail-error">
          <div className="error-icon">😞</div>
          <p className="error-text">{error || '酒店不存在'}</p>
          <button className="error-action" onClick={() => navigate(-1)}>
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-detail-page">
      
      <div className="detail-content">
        <ImageGallery images={hotel.images || []} />
        
        <div className="hotel-info">
          <div className="hotel-header">
            <h1 className="hotel-name">{hotel.nameZh}</h1>
            <div className="hotel-rating">
              <span className="stars">{renderStars(hotel.starRating)}</span>
              <span className="rating">{hotel.starRating}星</span>
            </div>
          </div>
          
          <div className="hotel-location">
            <span className="location-icon">📍</span>
            {hotel.address}
          </div>

          {hotel.nameEn && (
            <div className="hotel-name-en">
              {hotel.nameEn}
            </div>
          )}

          {hotel.openDate && (
            <div className="hotel-open-date">
              📅 开业时间：{hotel.openDate}
            </div>
          )}

          {hotel.discountInfo && (
            <div className="hotel-discount">
              <div className="discount-badge">{hotel.discountInfo.name}</div>
              <div className="discount-content">
                <div className="discount-price">
                  <span className="price">¥{hotel.price}</span>
                  {hotel.originalPrice && (
                    <span className="original-price">¥{hotel.originalPrice}</span>
                  )}
                  <span className="price-unit">/晚起</span>
                </div>
                {hotel.discountInfo.type && (
                  <div className="discount-detail">
                    {hotel.discountInfo.type === 'percentage' && hotel.discountInfo.value && (
                      <span className="discount-tag">
                        {hotel.discountInfo.value}折优惠
                      </span>
                    )}
                    {hotel.discountInfo.type === 'fixed' && hotel.discountInfo.value && (
                      <span className="discount-tag">
                        立减¥{hotel.discountInfo.value}
                      </span>
                    )}
                  </div>
                )}
                {hotel.discountInfo.description && (
                  <div className="discount-description">
                    {hotel.discountInfo.description}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {hotel.description && (
            <div className="hotel-description">
              <h3>酒店介绍</h3>
              <p>{hotel.description}</p>
            </div>
          )}
          
          <div className="hotel-facilities">
            <h3>酒店设施</h3>
            <div className="facilities-list">
              {hotel.facilities?.map((facility, index) => (
                <span key={index} className="facility-tag">
                  {facility}
                </span>
              ))}
            </div>
          </div>

          {hotel.tags && hotel.tags.length > 0 && (
            <div className="hotel-tags">
              <h3>特色标签</h3>
              <div className="tags-list">
                {hotel.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hotel.nearby && (
            <div className="hotel-nearby">
              <h3>周边信息</h3>
              
              {hotel.nearby.attractions && hotel.nearby.attractions.length > 0 && (
                <div className="nearby-section">
                  <h4>🏞️ 附近景点</h4>
                  <div className="nearby-list">
                    {hotel.nearby.attractions.map((item, index) => (
                      <div key={index} className="nearby-item">
                        <span className="nearby-name">{item.name}</span>
                        <span className="nearby-distance">{item.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {hotel.nearby.transport && hotel.nearby.transport.length > 0 && (
                <div className="nearby-section">
                  <h4>🚇 交通</h4>
                  <div className="nearby-list">
                    {hotel.nearby.transport.map((item, index) => (
                      <div key={index} className="nearby-item">
                        <span className="nearby-name">{item.name}</span>
                        <span className="nearby-distance">{item.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {hotel.nearby.malls && hotel.nearby.malls.length > 0 && (
                <div className="nearby-section">
                  <h4>🛍️ 附近商场</h4>
                  <div className="nearby-list">
                    {hotel.nearby.malls.map((item, index) => (
                      <div key={index} className="nearby-item">
                        <span className="nearby-name">{item.name}</span>
                        <span className="nearby-distance">{item.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {hotel.roomTypes && hotel.roomTypes.length > 0 && (
          <div className="rooms-section">
            <h2 className="rooms-title">房型信息</h2>
            <RoomList rooms={hotel.roomTypes} onBook={handleBookRoom} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailPage;

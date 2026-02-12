import React, { useState } from 'react';
import './ImageGallery.scss';

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="image-gallery">
      <div className="gallery-main">
        <button className="gallery-button prev" onClick={handlePrev}>‹</button>
        <div className="gallery-image">
          {/* 这里是图片区域，实际项目中应该显示真实图片 */}
          <div className="image-placeholder">
            酒店图片 {currentIndex + 1}
          </div>
        </div>
        <button className="gallery-button next" onClick={handleNext}>›</button>
      </div>
      <div className="gallery-indicator">
        {images.map((_, index) => (
          <div
            key={index}
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
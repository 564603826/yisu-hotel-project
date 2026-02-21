import React, { useState } from "react";
import "./ImageGallery.scss";

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

  const validImages = images && images.length > 0 ? images : [];

  return (
    <div className="image-gallery">
      <div className="gallery-main">
        {validImages.length > 1 && (
          <button className="gallery-button prev" onClick={handlePrev}>
            ‹
          </button>
        )}
        <div
          className="gallery-image"
          style={{
            backgroundImage: validImages[currentIndex]
              ? `url(${validImages[currentIndex]})`
              : undefined,
          }}
        >
          {!validImages[currentIndex] && (
            <div className="image-placeholder">🏨</div>
          )}
        </div>
        {validImages.length > 1 && (
          <button className="gallery-button next" onClick={handleNext}>
            ›
          </button>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="gallery-indicator">
          {validImages.map((_, index) => (
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

export default ImageGallery;

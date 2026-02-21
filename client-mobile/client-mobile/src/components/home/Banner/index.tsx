import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { bannerApi } from "../../../services/api";
import type { Banner } from "../../../types/api";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Banner.scss";

const Banner: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerApi.getBanners();
        setBanners(data);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (hotelId: number) => {
    navigate(`/hotels/${hotelId}`);
  };

  if (loading) {
    return (
      <div className="banner banner-loading">
        <div className="skeleton-banner"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="banner" onClick={() => handleBannerClick(1)}>
        <div className="banner-content">
          <h2 className="banner-title">限时特惠</h2>
          <p className="banner-subtitle">五星级酒店低至5折</p>
          <button className="banner-button">立即查看</button>
        </div>
      </div>
    );
  }

  return (
    <div className="banner-wrapper">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="banner"
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
              onClick={() => handleBannerClick(banner.hotelId)}
            >
              <div className="banner-overlay"></div>
              <div className="banner-content">
                <h2 className="banner-title">{banner.title}</h2>
                <p className="banner-subtitle">{banner.subtitle}</p>
                <button className="banner-button">立即查看</button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Banner;

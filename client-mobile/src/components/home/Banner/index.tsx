import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.scss';

const Banner: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBannerClick = () => {
    // 跳转到指定的酒店详情页
    navigate('/hotels/1');
  };
  
  return (
    <div className="banner" onClick={handleBannerClick}>
      <div className="banner-content">
        <h2 className="banner-title">限时特惠</h2>
        <p className="banner-subtitle">五星级酒店低至5折</p>
        <button className="banner-button">立即查看</button>
      </div>
    </div>
  );
};

export default Banner;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.scss';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title = '酒店预订', showBack = false }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <header className="header">
      <div className="header-left">
        {showBack ? (
          <button className="header-back" onClick={handleBack}>
            <span className="header-back-icon">←</span>
            返回
          </button>
        ) : (
          <div className="header-logo" onClick={handleGoHome}>
            🏨 酒店预订
          </div>
        )}
      </div>
      
      <div className="header-center">
        <h1 className="header-title">{title}</h1>
      </div>
      
      <div className="header-right">
        <button className="header-user" onClick={() => navigate('/login')}>
          👤
        </button>
      </div>
    </header>
  );
};

export default Header;
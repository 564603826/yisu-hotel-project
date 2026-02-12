import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Footer.scss';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'home', label: '首页', icon: '🏠', path: '/' },
    { id: 'search', label: '搜索', icon: '🔍', path: '/hotels' },
    { id: 'order', label: '订单', icon: '📋', path: '/orders' },
    { id: 'profile', label: '我的', icon: '👤', path: '/profile' },
  ];
  
  return (
    <footer className="footer">
      <nav className="footer-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              className={`footer-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="footer-nav-icon">{item.icon}</span>
              <span className="footer-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default Footer;
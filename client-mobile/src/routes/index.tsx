import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import HotelListPage from '../pages/HotelListPage';
import HotelDetailPage from '../pages/HotelDetailPage';
import Layout from '../components/common/Layout';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="hotels" element={<HotelListPage />} />
          <Route path="hotels/:hotelId" element={<HotelDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
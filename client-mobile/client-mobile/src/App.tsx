import React from 'react';
import AppRoutes from './routes';
import './styles/global.scss';

const App: React.FC = () => {
  return (
    <div className="app">
      <AppRoutes />
    </div>
  );
};

export default App;

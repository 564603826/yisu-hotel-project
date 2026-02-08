import React from 'react';
// 暂时移除 Redux 相关代码
// import { Provider } from 'react-redux';
// import { store } from './store';
// import AppRoutes from './routes';

// 创建一个简单的 App 组件
const App: React.FC = () => {
  return (
    // <Provider store={store}>
    //   <div className="app">
    //     <AppRoutes />
    //   </div>
    // </Provider>
    <div className="app">
      <h1>酒店预订移动端</h1>
      <p>开发环境运行成功！</p>
      <div style={{ marginTop: '20px' }}>
        <h2>即将开发的功能：</h2>
        <ul>
          <li>酒店查询页面</li>
          <li>酒店列表页面</li>
          <li>酒店详情页面</li>
          <li>用户认证功能</li>
          <li>移动端适配</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
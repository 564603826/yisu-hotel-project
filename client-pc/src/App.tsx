import React from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { RouterProvider } from 'react-router-dom'
import router from '@/router' // 引入路由配置

const App: React.FC = () => {
  return (
    // 第一层：Ant Design 全局配置
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      {/* 第二层：路由提供者 */}
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App

import React from 'react'
import { ConfigProvider, App as AntdApp } from 'antd'
import { antdTheme } from '@/theme/antdTheme'
import zhCN from 'antd/locale/zh_CN'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import AntdGlobal from './utils/AntdGlobal'

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <AntdGlobal />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App

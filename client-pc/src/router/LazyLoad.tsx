// src/router/LazyLoad.tsx
import React, { Suspense } from 'react'
import { Spin } from 'antd'

// 定义 Props 类型
interface LazyLoadProps {
  component: React.LazyExoticComponent<any>
}

// 把它改成一个真正的组件
const LazyLoad: React.FC<LazyLoadProps> = ({ component: Component }) => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: '200px',
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <Component />
    </Suspense>
  )
}

export default LazyLoad

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfigProvider } from 'antd'
import { HomeOutlined, CompassOutlined } from '@ant-design/icons'
import { useUserStore } from '@/store/userStore'
import styles from './404.module.scss'

// 引入之前设计的 Logo 组件（如果路径不对请自行调整）
// 如果不想引入 Logo，也可以去掉这一块
// import Logo from '@/components/Logo';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const { token, userInfo } = useUserStore()
  const role = userInfo?.role

  // 计算“返回首页”应该去哪里
  const handleGoHome = () => {
    if (!token) {
      navigate('/login')
    } else if (role === 'merchant') {
      navigate('/merchant/dashboard')
    } else if (role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate('/')
    }
  }

  return (
    // 临时覆盖 Antd 按钮样式，使其符合金色主题
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#c58e53', // gold-500
        },
      }}
    >
      <div className={styles.container}>
        {/* 背景装饰元素：一个巨大的、淡淡的金色光晕 */}
        <div className={styles.bgGlow}></div>

        <div className={styles.glassCard}>
          {/* 可选：顶部放一个小 Logo 增强品牌感 */}
          {/* <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
           <Logo style={{ height: 40 }} /> 
        </div> */}

          {/* 巨大的 404 数字 */}
          <h1 className={styles.errorCode}>404</h1>

          {/* 优雅的标题 */}
          <h2 className={styles.title}>Page Not Found</h2>

          {/* 礼貌的说明文案 */}
          <p className={styles.description}>
            抱歉，您似乎来到了一个尚未开放的区域。
            <br />
            这间“套房”可能已被移动或并不存在。
          </p>

          {/* 操作按钮组 */}
          <div className={styles.actions}>
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              shape="round"
              onClick={handleGoHome}
              className={styles.mainButton}
            >
              返回首页
            </Button>
            <Button
              size="large"
              icon={<CompassOutlined />}
              shape="round"
              onClick={() => navigate(-1)} // 返回上一页
              className={styles.secondaryButton}
            >
              返回上一页
            </Button>
          </div>
        </div>

        {/* 底部版权信息 */}
        <footer className={styles.footer}>© {new Date().getFullYear()} 易宿酒店管理系统</footer>
      </div>
    </ConfigProvider>
  )
}

export default NotFoundPage

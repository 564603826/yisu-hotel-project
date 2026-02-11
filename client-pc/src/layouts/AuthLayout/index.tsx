import React from 'react'
import { Outlet } from 'react-router-dom'
import { SafetyCertificateOutlined, SyncOutlined } from '@ant-design/icons'
import styles from './AuthLayout.module.scss'
// 假设这是你的 Logo 图片，如果没有就先用 Icon 代替
import logo from '@/assets/logo.svg'

const AuthLayout: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* 1. 动态背景 */}
      <div className={styles.background} />
      <div className={styles.overlay} />

      {/* 2. 磨砂玻璃卡片 */}
      <div className={styles.authCard}>
        {/* 左侧：品牌展示 */}
        <div className={styles.brandSection}>
          <div className={`${styles.glow} ${styles.glowTop}`} />
          <div className={`${styles.glow} ${styles.glowBottom}`} />

          <div className={styles.brandHeader}>
            <img
              src={logo}
              alt="YISU"
              style={{ width: 80, height: 80, marginRight: 8, marginTop: 16 }}
            />
            <h1 className={styles.title}>YISU</h1>
            <p className={styles.desc}>
              赋能世界级酒店管理，
              <br />
              提供无缝的信息审核与后台管理体验。
            </p>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <SafetyCertificateOutlined style={{ fontSize: 24, color: '#c58e53' }} />
              <div>
                <h3>安全审核</h3>
                <p>企业级数据安全与风控保障</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <SyncOutlined style={{ fontSize: 24, color: '#c58e53' }} />
              <div>
                <h3>实时同步</h3>
                <p>多终端状态即时更新零延迟</p>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, opacity: 0.6 }}>© 2026 易宿酒店管理系统</div>
        </div>

        {/* 右侧：表单区域 (Login/Register 将渲染在这里) */}
        <div className={styles.formSection}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

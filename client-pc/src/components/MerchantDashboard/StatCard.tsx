import React from 'react'
import { Typography } from 'antd'
import '@/components/MerchantDashboard/index.scss'

const { Text } = Typography

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  isUp?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isUp }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {title}
          </Text>
          <h2 style={{ margin: '4px 0 0 0', fontFamily: 'Playfair Display' }}>{value}</h2>
        </div>
        <div className="icon-box">{icon}</div>
      </div>

      {trend && (
        <div className="trend">
          <span className={`trend-value ${isUp ? 'up' : 'down'}`}>{trend}</span>
          <span className="trend-label"> 较昨日</span>
        </div>
      )}
    </div>
  )
}

export default StatCard

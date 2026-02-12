import React from 'react'
import { Typography } from 'antd'
import { TrendingUp, TrendingDown } from 'lucide-react'
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
          <h2 className="stat-value">{value}</h2>
          {trend && (
            <div className="trend">
              {isUp ? (
                <TrendingUp size={14} className="trend-icon up" />
              ) : (
                <TrendingDown size={14} className="trend-icon down" />
              )}
              <span className={`trend-value ${isUp ? 'up' : 'down'}`}>{trend}</span>
              <span className="trend-label"> 较昨日</span>
            </div>
          )}
        </div>
        <div className="icon-box">{icon}</div>
      </div>
    </div>
  )
}

export default StatCard

import React from 'react'
import { Typography } from 'antd'
import '@/components/AdminDashboard/index.scss'

const { Text } = Typography

interface StatCardGreenProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

const StatCardGreen: React.FC<StatCardGreenProps> = ({ title, value, icon }) => {
  return (
    <div className="stat-card-green">
      <div className="stat-card-content">
        <div className="icon-circle green">{icon}</div>
        <div>
          <Text>{title}</Text>
          <h2 style={{ margin: 0, fontFamily: 'Playfair Display' }}>{value}</h2>
        </div>
      </div>
    </div>
  )
}

export default StatCardGreen

import React from 'react'
import '@/components/MerchantDashboard/index.scss'

interface WhiteCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

const WhiteCard: React.FC<WhiteCardProps> = ({ children, style }) => {
  return (
    <div className="white-card" style={style}>
      {children}
    </div>
  )
}

export default WhiteCard

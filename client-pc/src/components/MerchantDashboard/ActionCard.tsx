import React from 'react'
import { ChevronRight } from 'lucide-react'
import '@/components/MerchantDashboard/index.scss'

interface ActionCardProps {
  title: string
  desc: string
  icon: React.ReactNode
  primary?: boolean
  onClick?: () => void
}

const ActionCard: React.FC<ActionCardProps> = ({ title, desc, icon, primary, onClick }) => {
  return (
    <div className={`action-card ${primary ? 'primary' : ''}`} onClick={onClick}>
      <div className="action-content">
        <div className="action-icon">{icon}</div>
        <div>
          <div className="action-title">{title}</div>
          <div className="action-desc">{desc}</div>
        </div>
      </div>
      <ChevronRight className="arrow" size={20} />
    </div>
  )
}

export default ActionCard

import React from 'react'
import '@/components/AdminDashboard/index.scss'

interface TableCardProps {
  title?: string
  titleExtra?: React.ReactNode
  children: React.ReactNode
  onTitleClick?: () => void
}

const TableCard: React.FC<TableCardProps> = ({ title, titleExtra, children }) => {
  return (
    <div className="table-card">
      {(title || titleExtra) && (
        <div className="section-header">
          {title && (
            <div className="section-title">
              <span className="red-dot" />
              {title}
            </div>
          )}
          {titleExtra && <div className="title-extra">{titleExtra}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default TableCard

import React from 'react'
import '@/components/AdminList/index.scss'

interface TabSwitcherProps {
  activeTab: 'audit' | 'management'
  onTabChange: (tab: 'audit' | 'management') => void
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-switcher">
      <button
        className={activeTab === 'audit' ? 'active' : ''}
        onClick={() => onTabChange('audit')}
      >
        审核队列
      </button>
      <button
        className={activeTab === 'management' ? 'active' : ''}
        onClick={() => onTabChange('management')}
      >
        酒店管理
      </button>
    </div>
  )
}

export default TabSwitcher

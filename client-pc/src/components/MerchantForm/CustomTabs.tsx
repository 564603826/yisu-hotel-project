import React from 'react'
import { Tabs } from 'antd'
import '@/components/MerchantForm/index.scss'

interface CustomTabsProps {
  activeKey: string
  onChange: (key: string) => void
  items: Array<{ key: string; label: string }>
}

const CustomTabs: React.FC<CustomTabsProps> = ({ activeKey, onChange, items }) => {
  return <Tabs activeKey={activeKey} onChange={onChange} className="custom-tabs" items={items} />
}

export default CustomTabs

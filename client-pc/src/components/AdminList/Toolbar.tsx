import React from 'react'
import { Input, Button } from 'antd'
import { Search, Filter } from 'lucide-react'
import '@/components/AdminList/index.scss'

interface ToolbarProps {
  onSearch?: (value: string) => void
  onFilter?: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ onSearch, onFilter }) => {
  return (
    <div className="toolbar">
      <Input
        prefix={<Search size={16} style={{ color: '#a8a29e' }} />}
        placeholder="搜索酒店名称、ID或提交人..."
        style={{ width: 300, borderRadius: 8 }}
        size="large"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <Button icon={<Filter size={16} />} size="large" onClick={onFilter}>
        筛选
      </Button>
    </div>
  )
}

export default Toolbar

import React from 'react'
import { Input, Button, Space, Typography, Spin } from 'antd'
import { Search, Filter, RefreshCw } from 'lucide-react'
import '@/components/AdminList/index.scss'

const { Text } = Typography

interface ToolbarProps {
  onSearch?: (value: string) => void
  onFilter?: () => void
  onRefresh?: () => void
  lastUpdateTime?: string
  loading?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSearch,
  onFilter,
  onRefresh,
  lastUpdateTime,
  loading,
}) => {
  return (
    <div
      className="toolbar"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Space>
        <Input
          prefix={<Search size={16} style={{ color: '#a8a29e' }} />}
          placeholder="搜索酒店名称"
          style={{ width: 300, borderRadius: 8 }}
          size="large"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <Button icon={<Filter size={16} />} size="large" onClick={onFilter}>
          筛选
        </Button>
      </Space>
      <Space>
        {loading && <Spin size="small" />}
        {lastUpdateTime && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            上次更新: {lastUpdateTime}
          </Text>
        )}
        <Button
          icon={<RefreshCw size={16} className={loading ? 'spinning' : ''} />}
          size="large"
          onClick={onRefresh}
          loading={loading}
        >
          刷新
        </Button>
      </Space>
    </div>
  )
}

export default Toolbar

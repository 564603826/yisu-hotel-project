import React, { useEffect, useState } from 'react'
import { Row, Col, Typography, Table, Tag, Button, Space, Spin } from 'antd'
import { FileClock, CheckCircle2, Building, RefreshCw } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import styles from './AdminDashboard.module.scss'
import { useNavigate } from 'react-router-dom'
import StatCardRed from '@/components/AdminDashboard/StatCardRed'
import StatCardGreen from '@/components/AdminDashboard/StatCardGreen'
import StatCardStone from '@/components/AdminDashboard/StatCardStone'
import TableCard from '@/components/AdminDashboard/TableCard'
import adminAuditApi from '@/api/admin-audit'
import { useAdminStore } from '@/store'
import type { HotelWithCreator } from '@/types'

const { Title, Text } = Typography

interface DashboardStats {
  pendingCount: number
  todayApprovedCount: number
  totalHotels: number
  lastUpdateTime: string
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { hotelList, getHotels } = useAdminStore()

  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    todayApprovedCount: 0,
    totalHotels: 0,
    lastUpdateTime: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(false)
  const [pendingHotels, setPendingHotels] = useState<HotelWithCreator[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // 初始加载
  useEffect(() => {
    // 获取 Dashboard 统计数据
    const fetchDashboardStats = async () => {
      try {
        const data = await adminAuditApi.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }

    // 获取待审核酒店列表（前5条）
    const fetchPendingHotels = async () => {
      setLoading(true)
      try {
        await getHotels({ page: 1, pageSize: 5, status: 'pending' })
      } catch (error) {
        console.error('获取待审核列表失败:', error)
      } finally {
        setLoading(false)
        setLastUpdateTime(new Date())
      }
    }

    fetchDashboardStats()
    fetchPendingHotels()
  }, [getHotels])

  // 当 hotelList 更新时，更新待审核列表
  useEffect(() => {
    setPendingHotels(hotelList)
  }, [hotelList])

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const data = await adminAuditApi.getDashboardStats()
      setStats(data)
      await getHotels({ page: 1, pageSize: 5, status: 'pending' })
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<HotelWithCreator> = [
    {
      title: '酒店名称',
      dataIndex: 'nameZh',
      key: 'nameZh',
      render: (text) => (
        <span style={{ fontWeight: 'bold', fontFamily: 'Playfair Display', color: '#292524' }}>
          {text}
        </span>
      ),
    },
    {
      title: '提交人',
      key: 'submitter',
      render: (_, record) => (
        <span style={{ color: '#57534e' }}>{record.user?.username || '未知'}</span>
      ),
    },
    {
      title: '提交时间',
      key: 'submitTime',
      render: (_, record) => (
        <span className="font-mono text-stone-400" style={{ fontSize: 12 }}>
          {record.updatedAt ? formatTime(record.updatedAt) : '-'}
        </span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: () => (
        <Tag
          style={{
            backgroundColor: '#fef3c7',
            color: '#d97706',
            borderRadius: 12,
            border: 'none',
            padding: '2px 12px',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          待审核
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            ghost
            style={{ borderColor: '#c58e53', color: '#c58e53' }}
            onClick={() => navigate(`/admin/audit?hotelId=${record.id}`)}
          >
            审核
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2}>平台概览</Title>
            <Text type="secondary">管理平台资源与审核队列。</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {loading && <Spin size="small" />}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              上次更新: {formatTime(lastUpdateTime.toISOString())}
            </Text>
            <RefreshCw
              size={18}
              style={{ cursor: 'pointer', color: '#c58e53' }}
              onClick={handleRefresh}
              className={loading ? styles.spinning : ''}
            />
          </div>
        </div>
      </div>

      {/* 统计卡片区 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* 1. 待审核 - 红色卡片 */}
        <Col xs={24} md={8}>
          <StatCardRed
            title="待审核酒店"
            value={stats.pendingCount}
            icon={<FileClock size={28} />}
          />
        </Col>

        {/* 2. 今日通过 - 绿色卡片 */}
        <Col xs={24} md={8}>
          <StatCardGreen
            title="今日通过"
            value={stats.todayApprovedCount}
            icon={<CheckCircle2 size={28} />}
          />
        </Col>

        {/* 3. 平台总数 - 暖灰色卡片 */}
        <Col xs={24} md={8}>
          <StatCardStone
            title="平台收录总数"
            value={stats.totalHotels.toLocaleString()}
            icon={<Building size={28} />}
          />
        </Col>
      </Row>

      {/* 底部表格区 */}
      <div className={styles.section}>
        <Title level={4} className={styles.sectionTitle}>
          审核队列预览
        </Title>
        <Spin spinning={loading}>
          <TableCard
            titleExtra={
              <Button
                type="link"
                style={{ color: '#c58e53', border: '1px solid #c58e53' }}
                onClick={() => navigate('/admin/audit')}
              >
                查看全部 &rarr;
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={pendingHotels}
              pagination={false}
              rowKey="id"
              locale={{ emptyText: '暂无待审核酒店' }}
            />
          </TableCard>
        </Spin>
      </div>
    </div>
  )
}

export default AdminDashboard

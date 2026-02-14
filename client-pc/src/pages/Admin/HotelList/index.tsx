import React, { useState, useEffect, useCallback } from 'react'
import { Button, Tag, Space, Modal, Tooltip, Input, message, Spin } from 'antd'
import { CheckCircle, XCircle, RefreshCw, Power, Eye } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import styles from './AdminHotelList.module.scss'
import TabSwitcher from '@/components/AdminList/TabSwitcher'
import Toolbar from '@/components/AdminList/Toolbar'
import HotelInfoCell from '@/components/AdminList/HotelInfoCell'
import PriceCell from '@/components/AdminList/PriceCell'
import TableCard from '@/components/AdminList/TableCard'
import HotelDetailModal from '@/components/AdminList/HotelDetailModal'
import { useAdminStore } from '@/store/adminStore'
import type { HotelWithCreator, HotelStatus, Hotel } from '@/types'
import adminAuditApi from '@/api/admin-audit'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

const { TextArea } = Input

const AdminHotelList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'management'>('audit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentHotelDetail, setCurrentHotelDetail] = useState<Hotel | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  const {
    hotelList,
    pagination,
    loading,
    getHotels,
    approveAudit,
    rejectAudit,
    publishHotel,
    offlineHotel,
    restoreHotel,
  } = useAdminStore()

  const fetchHotels = useCallback(() => {
    const params: {
      page: number
      pageSize: number
      keyword?: string
      status?: HotelStatus
    } = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    if (searchKeyword) {
      params.keyword = searchKeyword
    }

    if (activeTab === 'audit') {
      params.status = 'pending'
    }

    getHotels(params)
    setLastUpdateTime(new Date())
  }, [activeTab, pagination.page, pagination.pageSize, searchKeyword, getHotels])

  // 使用自动刷新 Hook，每 30 秒刷新一次
  const { refresh } = useAutoRefresh(
    async () => {
      await fetchHotels()
    },
    {
      interval: 30000, // 30秒
      refreshOnVisible: true, // 页面可见时立即刷新
      enabled: true,
    }
  )

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  useEffect(() => {
    fetchHotels()
  }, [activeTab, fetchHotels])

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
  }

  const handleFilter = () => {
    fetchHotels()
  }

  const handleApprove = async (id: number) => {
    try {
      await approveAudit(id)
      message.success('审核通过')
    } catch {
      message.error('操作失败')
    }
  }

  const handleReject = (id: number) => {
    setCurrentHotelId(id)
    setRejectReason('')
    setIsModalOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因')
      return
    }
    if (!currentHotelId) return

    try {
      await rejectAudit(currentHotelId, { reason: rejectReason })
      message.success('已驳回')
      setIsModalOpen(false)
      setRejectReason('')
    } catch {
      message.error('操作失败')
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await publishHotel(id)
      message.success('发布成功')
    } catch {
      message.error('操作失败')
    }
  }

  const handleOffline = async (id: number) => {
    Modal.confirm({
      title: '确认下线',
      content: '确定要下线该酒店吗？下线后可以恢复。',
      okText: '确认下线',
      cancelText: '取消',
      onOk: async () => {
        try {
          await offlineHotel(id)
          message.success('已下线')
        } catch {
          message.error('操作失败')
        }
      },
    })
  }

  const handleRestore = async (id: number) => {
    try {
      await restoreHotel(id)
      message.success('已恢复上线')
    } catch {
      message.error('操作失败')
    }
  }

  // 查看酒店详情
  const handleViewDetail = async (id: number) => {
    setDetailLoading(true)
    setDetailModalOpen(true)
    try {
      const res = await adminAuditApi.getHotelDetail(id)
      setCurrentHotelDetail(res)
    } catch {
      message.error('获取酒店详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setCurrentHotelDetail(null)
  }

  const columns: ColumnsType<HotelWithCreator> = [
    {
      title: '酒店信息',
      key: 'info',
      render: (_, record) => (
        <HotelInfoCell
          id={record.id.toString()}
          hotelName={record.nameZh}
          submitter={record.creator?.username || '-'}
          imageUrl={record.image}
          onClick={() => handleViewDetail(record.id)}
        />
      ),
    },
    {
      title: '位置/价格',
      key: 'location',
      render: (_, record) => (
        <PriceCell
          location={record.address.split('市')[0] || record.address}
          price={Number(record.price) || 0}
        />
      ),
    },
    {
      title: activeTab === 'audit' ? '提交时间' : '更新时间',
      dataIndex: 'createdAt',
      key: 'time',
      render: (text) => {
        const date = new Date(text)
        return (
          <span style={{ fontFamily: 'monospace', color: '#999' }}>
            {date.toLocaleDateString()} {date.toLocaleTimeString().slice(0, 5)}
          </span>
        )
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const statusMap: Record<HotelStatus, { bgColor: string; textColor: string; text: string }> =
          {
            pending: { bgColor: '#fef3c7', textColor: '#d97706', text: '待审核' },
            approved: { bgColor: '#dcfce7', textColor: '#16a34a', text: '已通过' },
            rejected: { bgColor: '#fee2e2', textColor: '#dc2626', text: '已驳回' },
            draft: { bgColor: '#f5f5f4', textColor: '#78716c', text: '草稿' },
            published: { bgColor: '#dcfce7', textColor: '#16a34a', text: '已发布' },
            offline: { bgColor: '#f5f5f4', textColor: '#78716c', text: '已下线' },
          }
        const s = statusMap[record.status] || {
          bgColor: '#f5f5f4',
          textColor: '#78716c',
          text: record.status,
        }
        return (
          <Tag
            style={{
              borderRadius: 12,
              background: s.bgColor,
              color: s.textColor,
              border: 'none',
              padding: '4px 12px',
            }}
          >
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          {/* 查看详情 - 所有状态都显示 */}
          <Tooltip title="查看详情">
            <Button
              type="text"
              shape="circle"
              icon={<Eye size={18} style={{ color: '#c58e53' }} />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>

          {activeTab === 'audit' && record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button
                  type="text"
                  shape="circle"
                  icon={<CheckCircle size={18} style={{ color: '#52c41a' }} />}
                  onClick={() => handleApprove(record.id)}
                />
              </Tooltip>
              <Tooltip title="驳回">
                <Button
                  type="text"
                  shape="circle"
                  danger
                  icon={<XCircle size={18} />}
                  onClick={() => handleReject(record.id)}
                />
              </Tooltip>
            </>
          )}

          {activeTab === 'audit' && record.status === 'approved' && (
            <Tooltip title="发布">
              <Button
                type="text"
                shape="circle"
                icon={<Power size={18} style={{ color: '#52c41a' }} />}
                onClick={() => handlePublish(record.id)}
              />
            </Tooltip>
          )}

          {activeTab === 'management' && (
            <>
              {record.status === 'approved' && (
                <Button
                  type="link"
                  size="small"
                  style={{ color: '#52c41a' }}
                  icon={<Power size={14} />}
                  onClick={() => handlePublish(record.id)}
                >
                  发布
                </Button>
              )}
              {record.status === 'published' && (
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<Power size={14} />}
                  onClick={() => handleOffline(record.id)}
                >
                  下线
                </Button>
              )}
              {record.status === 'offline' && (
                <Button
                  type="link"
                  size="small"
                  style={{ color: '#52c41a' }}
                  icon={<RefreshCw size={14} />}
                  onClick={() => handleRestore(record.id)}
                >
                  恢复
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className="pageHeader">
        <div>
          <h2>{activeTab === 'audit' ? '酒店信息审核' : '平台酒店管理'}</h2>
          <p>
            {activeTab === 'audit'
              ? '审批商户提交的酒店资料，确保信息真实有效。'
              : '管理已发布酒店的上下线状态及运营数据。'}
          </p>
        </div>

        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <Toolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onRefresh={refresh}
        lastUpdateTime={formatUpdateTime(lastUpdateTime)}
        loading={loading}
      />

      <Spin spinning={loading}>
        <TableCard
          columns={columns}
          dataSource={hotelList}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条`,
            onChange: (page: number, pageSize: number) => {
              getHotels({ page, pageSize })
            },
          }}
        />
      </Spin>

      <Modal
        title="审核不通过"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleRejectConfirm}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 12, color: '#666' }}>请填写驳回原因，该信息将反馈给商户。</p>
        <TextArea
          rows={4}
          placeholder="例如：营业执照模糊，请重新上传..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* 酒店详情模态框 */}
      <HotelDetailModal
        open={detailModalOpen}
        hotel={currentHotelDetail}
        onClose={handleCloseDetail}
        loading={detailLoading}
      />
    </div>
  )
}

export default AdminHotelList

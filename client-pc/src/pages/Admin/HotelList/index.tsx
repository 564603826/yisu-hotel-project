import React, { useState, useEffect, useCallback } from 'react'
import { Button, Tag, Modal, Tooltip, Input, message, Spin, Typography } from 'antd'
import { CheckCircle, XCircle, RefreshCw, Power, Eye, ImageIcon } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import styles from './AdminHotelList.module.scss'
import TabSwitcher from '@/components/AdminList/TabSwitcher'
import Toolbar from '@/components/AdminList/Toolbar'
import HotelInfoCell from '@/components/AdminList/HotelInfoCell'
import PriceCell from '@/components/AdminList/PriceCell'
import TableCard from '@/components/AdminList/TableCard'
import HotelDetailModal from '@/components/AdminList/HotelDetailModal'
import BannerModal from '@/components/BannerModal'
import { useAdminStore } from '@/store/adminStore'
import type { HotelWithCreator, HotelStatus, Hotel } from '@/types'
import adminAuditApi from '@/api/admin-audit'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

const { Title, Text } = Typography

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

  // 为每个 tab 维护独立的分页状态
  const [auditPagination, setAuditPagination] = useState({ page: 1, pageSize: 5 })
  const [managementPagination, setManagementPagination] = useState({ page: 1, pageSize: 5 })

  // Banner 相关状态
  const [bannerModalOpen, setBannerModalOpen] = useState(false)
  const [currentBannerHotel, setCurrentBannerHotel] = useState<HotelWithCreator | null>(null)
  const [bannerLoading, setBannerLoading] = useState(false)

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
      page: activeTab === 'audit' ? auditPagination.page : managementPagination.page,
      pageSize: activeTab === 'audit' ? auditPagination.pageSize : managementPagination.pageSize,
    }

    if (searchKeyword) {
      params.keyword = searchKeyword
    }

    if (activeTab === 'audit') {
      params.status = 'pending'
    }

    getHotels(params)
    setLastUpdateTime(new Date())
  }, [activeTab, auditPagination, managementPagination, searchKeyword, getHotels])

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
      fetchHotels() // 刷新列表
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
          fetchHotels() // 刷新列表
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
      fetchHotels() // 刷新列表
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

  // Banner 相关处理函数
  const handleOpenBannerModal = (hotel: HotelWithCreator) => {
    setCurrentBannerHotel(hotel)
    setBannerModalOpen(true)
  }

  const handleCloseBannerModal = () => {
    setBannerModalOpen(false)
    setCurrentBannerHotel(null)
  }

  const handleBannerSubmit = async (values: {
    isBanner: boolean
    bannerSort: number
    bannerTitle: string
    bannerDesc: string
  }) => {
    if (!currentBannerHotel) return

    setBannerLoading(true)
    try {
      await adminAuditApi.setBanner(currentBannerHotel.id, values)
      message.success(values.isBanner ? '已设为 Banner' : '已取消 Banner')
      setBannerModalOpen(false)
      setCurrentBannerHotel(null)
      // 刷新列表
      fetchHotels()
    } catch (error: any) {
      message.error(error.response?.data?.msg || '操作失败')
    } finally {
      setBannerLoading(false)
    }
  }

  const columns: ColumnsType<HotelWithCreator> = [
    {
      title: '酒店信息',
      key: 'info',
      width: 260,
      render: (_, record) => {
        // 审核中或已驳回状态且有草稿数据：展示草稿数据（被审核/被驳回的版本）
        const displayHotel =
          (record.status === 'pending' || record.status === 'rejected') && record.draftData
            ? { ...record, ...record.draftData }
            : record
        return (
          <HotelInfoCell
            id={record.id.toString()}
            hotelName={displayHotel.nameZh}
            submitter={record.user?.username || '-'}
            imageUrl={displayHotel.image}
            onClick={() => handleViewDetail(record.id)}
          />
        )
      },
    },
    {
      title: '位置/价格',
      key: 'location',
      width: 120,
      render: (_, record) => (
        <PriceCell
          location={record.address.split('市')[0] || record.address}
          price={Number(record.price) || 0}
        />
      ),
    },
    {
      title: '审核信息',
      key: 'auditInfo',
      width: 180,
      render: (_, record) => {
        if (record.status === 'pending' && record.auditInfo) {
          return (
            <Tooltip title={record.auditInfo}>
              <div
                style={{
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#666',
                  fontSize: 13,
                }}
              >
                {record.auditInfo}
              </div>
            </Tooltip>
          )
        }
        return <span style={{ color: '#999' }}>-</span>
      },
    },
    {
      title: activeTab === 'audit' ? '提交时间' : '更新时间',
      width: 150,
      dataIndex: 'createdAt',
      key: 'time',
      render: (text) => {
        const date = new Date(text)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', color: '#57534e', fontWeight: 500 }}>
              {date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
            </span>
            <span style={{ fontSize: '13px', color: '#a8a29e', fontFamily: 'monospace' }}>
              {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const statusMap: Record<
          HotelStatus,
          { bgColor: string; textColor: string; text: string; borderColor: string }
        > = {
          pending: {
            bgColor: '#fffbeb',
            textColor: '#d97706',
            text: '待审核',
            borderColor: '#fcd34d',
          },
          approved: {
            bgColor: '#eff6ff',
            textColor: '#2563eb',
            text: '已通过',
            borderColor: '#93c5fd',
          },
          rejected: {
            bgColor: '#fef2f2',
            textColor: '#dc2626',
            text: '已驳回',
            borderColor: '#fca5a5',
          },
          draft: { bgColor: '#f5f5f4', textColor: '#78716c', text: '草稿', borderColor: '#d6d3d1' },
          published: {
            bgColor: '#f0fdf4',
            textColor: '#16a34a',
            text: '已发布',
            borderColor: '#86efac',
          },
          offline: {
            bgColor: '#f5f5f4',
            textColor: '#78716c',
            text: '已下线',
            borderColor: '#d6d3d1',
          },
        }
        const s = statusMap[record.status] || {
          bgColor: '#f5f5f4',
          textColor: '#78716c',
          text: record.status,
          borderColor: '#d6d3d1',
        }
        return (
          <Tag
            style={{
              borderRadius: 20,
              background: s.bgColor,
              color: s.textColor,
              border: `1px solid ${s.borderColor}`,
              padding: '4px 14px',
              fontSize: '13px',
              fontWeight: 500,
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
      align: 'left',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <div className="action-buttons">
          {/* 查看详情 - 所有状态都显示 */}
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              icon={<Eye size={16} style={{ color: '#c58e53' }} />}
              onClick={() => handleViewDetail(record.id)}
            >
              详情
            </Button>
          </Tooltip>

          {activeTab === 'audit' && record.status === 'pending' && (
            <>
              <span className="action-divider" />
              <Tooltip title="通过">
                <Button
                  type="text"
                  size="small"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a' }}
                  icon={<CheckCircle size={16} />}
                  onClick={() => handleApprove(record.id)}
                >
                  通过
                </Button>
              </Tooltip>
              <span className="action-divider" />
              <Tooltip title="驳回">
                <Button
                  type="text"
                  size="small"
                  danger
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  icon={<XCircle size={16} />}
                  onClick={() => handleReject(record.id)}
                >
                  驳回
                </Button>
              </Tooltip>
            </>
          )}

          {activeTab === 'audit' && record.status === 'approved' && (
            <>
              <span className="action-divider" />
              <Tooltip title="发布">
                <Button
                  type="text"
                  size="small"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a' }}
                  icon={<Power size={16} />}
                  onClick={() => handlePublish(record.id)}
                >
                  发布
                </Button>
              </Tooltip>
            </>
          )}

          {activeTab === 'management' && (
            <>
              {/* Banner 设置按钮 - 仅已发布酒店显示 */}
              {record.status === 'published' && (
                <>
                  <span className="action-divider" />
                  <Tooltip title={record.isBanner ? '编辑 Banner' : '设为 Banner'}>
                    <Button
                      type="text"
                      size="small"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: record.isBanner ? '#c58e53' : '#666',
                      }}
                      icon={<ImageIcon size={16} />}
                      onClick={() => handleOpenBannerModal(record)}
                    >
                      {record.isBanner ? '编辑Banner' : '设为Banner'}
                    </Button>
                  </Tooltip>
                </>
              )}
              {record.status === 'approved' && (
                <>
                  <span className="action-divider" />
                  <Button
                    type="text"
                    size="small"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a' }}
                    icon={<Power size={16} />}
                    onClick={() => handlePublish(record.id)}
                  >
                    发布
                  </Button>
                </>
              )}
              {record.status === 'published' && (
                <>
                  <span className="action-divider" />
                  <Button
                    type="text"
                    size="small"
                    danger
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    icon={<Power size={16} />}
                    onClick={() => handleOffline(record.id)}
                  >
                    下线
                  </Button>
                </>
              )}
              {record.status === 'offline' && (
                <>
                  <span className="action-divider" />
                  <Button
                    type="text"
                    size="small"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a' }}
                    icon={<RefreshCw size={16} />}
                    onClick={() => handleRestore(record.id)}
                  >
                    恢复
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              {activeTab === 'audit' ? '酒店信息审核' : '平台酒店管理'}
            </Title>
            <Text type="secondary" className={styles.pageDesc}>
              {activeTab === 'audit'
                ? '审批商户提交的酒店资料，确保信息真实有效。'
                : '管理已发布酒店的上下线状态及运营数据。'}
            </Text>
          </div>

          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
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
            current: activeTab === 'audit' ? auditPagination.page : managementPagination.page,
            pageSize:
              activeTab === 'audit' ? auditPagination.pageSize : managementPagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total: number) => `共 ${total} 条 `,
            onChange: (page: number, pageSize: number) => {
              if (activeTab === 'audit') {
                setAuditPagination({ page, pageSize })
              } else {
                setManagementPagination({ page, pageSize })
              }
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

      {/* Banner 设置模态框 */}
      <BannerModal
        open={bannerModalOpen}
        hotel={currentBannerHotel}
        onCancel={handleCloseBannerModal}
        onSubmit={handleBannerSubmit}
        loading={bannerLoading}
      />
    </div>
  )
}

export default AdminHotelList

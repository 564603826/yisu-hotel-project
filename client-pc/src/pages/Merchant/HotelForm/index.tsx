import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Form, Button, Space, message, Modal, Tag, Alert } from 'antd'
import {
  Save,
  Undo2,
  Loader2,
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import styles from './MerchantHotelForm.module.scss'
import dayjs from 'dayjs'
import CustomTabs from '@/components/MerchantForm/CustomTabs'
import FormCard from '@/components/MerchantForm/FormCard'
import BasicInfoForm from '@/components/MerchantForm/BasicInfoForm'
import RoomList from '@/components/MerchantForm/RoomList'
import RoomModal from '@/components/MerchantForm/RoomModal'
import MarketingForm from '@/components/MerchantForm/MarketingForm'
import { useMerchantStore } from '@/store'
import { type RoomType } from '@/types'
import uploadImageApi from '@/api/upload-image'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

// 判断是否为已发布/已下线状态（有版本控制）
const hasVersionControl = (status: string) => {
  return status === 'published' || status === 'offline'
}

const MerchantHotelForm: React.FC = () => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  // 版本控制：是否查看当前线上版本（已发布/已下线酒店）
  const [viewingPublishedVersion, setViewingPublishedVersion] = useState(false)
  // 查看驳回原因弹窗
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false)
  // 自动刷新相关状态
  const [loading, setLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  const { hotelInfo } = useMerchantStore((state) => state)
  const getHotelInfo = useMerchantStore((state) => state.getHotelInfo)
  const updateHotelInfo = useMerchantStore((state) => state.updateHotelInfo)
  const submitAudit = useMerchantStore((state) => state.submitAudit)
  const cancelAudit = useMerchantStore((state) => state.cancelAudit)
  const addRoomType = useMerchantStore((state) => state.addRoomType)
  const updateRoomType = useMerchantStore((state) => state.updateRoomType)
  const deleteRoomType = useMerchantStore((state) => state.deleteRoomType)

  // 获取酒店信息的函数 - 使用 useCallback 避免无限循环
  const fetchHotelData = useCallback(async () => {
    setLoading(true)
    try {
      await getHotelInfo()
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('获取酒店信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [getHotelInfo])

  // 使用自动刷新 Hook，每 30 秒刷新一次
  const { refresh } = useAutoRefresh(fetchHotelData, {
    interval: 30000, // 30秒
    refreshOnVisible: true, // 页面可见时立即刷新
    enabled: true,
  })

  useEffect(() => {
    fetchHotelData()
  }, [fetchHotelData])

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // 获取当前展示的数据（主数据或草稿数据）
  const displayData = useMemo(() => {
    if (!hotelInfo) return null

    // 审核中状态且有草稿数据：展示草稿数据（最新修改）
    if (hotelInfo.status === 'pending' && hotelInfo.draftData) {
      return {
        ...hotelInfo,
        ...hotelInfo.draftData,
      }
    }

    // 已发布/已下线酒店且有草稿数据时
    if (hasVersionControl(hotelInfo.status) && hotelInfo.draftData) {
      // 查看线上版本：返回主数据
      if (viewingPublishedVersion) {
        return hotelInfo
      }
      // 编辑草稿版本：合并 draftData 到主数据
      return {
        ...hotelInfo,
        ...hotelInfo.draftData,
      }
    }

    // 其他情况直接返回主数据
    return hotelInfo
  }, [hotelInfo, viewingPublishedVersion])

  // 房型数据（根据当前展示的数据源）
  const roomData = useMemo<RoomType[]>(() => {
    return displayData?.roomTypes || []
  }, [displayData?.roomTypes])

  // 表单数据初始化
  useEffect(() => {
    if (displayData?.id) {
      const formData = {
        ...displayData,
        openDate: displayData.openDate ? dayjs(displayData.openDate) : null,
        coverImage: displayData.images?.[0] || '',
      }
      form.setFieldsValue(formData)
      setPendingCoverFile(null)
    }
  }, [displayData, form])

  // 切换查看模式时重置表单
  useEffect(() => {
    if (hotelInfo && hasVersionControl(hotelInfo.status)) {
      const data = viewingPublishedVersion ? hotelInfo : { ...hotelInfo, ...hotelInfo.draftData }
      const formData = {
        ...data,
        openDate: data?.openDate ? dayjs(data.openDate) : null,
        coverImage: data?.images?.[0] || '',
      }
      form.setFieldsValue(formData)
    }
  }, [viewingPublishedVersion, hotelInfo, form])

  const update = async () => {
    // 查看线上版本时不能保存
    if (viewingPublishedVersion) {
      message.warning('当前处于查看线上版本模式，请切换到编辑模式后再保存')
      return
    }

    setSaving(true)
    try {
      const formValues = form.getFieldsValue()
      let coverImageUrl = formValues.coverImage

      // 如果有待上传的封面图文件，先上传
      if (pendingCoverFile) {
        const uploadRes = await uploadImageApi.uploadImage(pendingCoverFile)
        if (uploadRes?.url) {
          coverImageUrl = uploadRes.url
        }
      }

      const updateForm = {
        ...formValues,
        openDate: form.getFieldValue('openDate')?.format('YYYY-MM-DD'),
        roomTypes: roomData,
        images: coverImageUrl ? [coverImageUrl] : [],
      }
      delete (updateForm as { coverImage?: string }).coverImage

      await updateHotelInfo(updateForm)
      setPendingCoverFile(null)
      getHotelInfo()
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    // 查看线上版本时不能提交
    if (viewingPublishedVersion) {
      message.warning('当前处于查看线上版本模式，请切换到编辑模式后再提交')
      return
    }

    // 已发布/已下线酒店需要检查是否有草稿数据
    if (hotelInfo && hasVersionControl(hotelInfo.status) && !hotelInfo.draftData) {
      message.warning('请先修改酒店信息后再提交审核')
      return
    }

    setSaving(true)
    try {
      await submitAudit()
      getHotelInfo()
      message.success('提交审核成功')
    } finally {
      setSaving(false)
    }
  }

  const cancel = async () => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销审核申请吗？撤销后可以继续修改酒店信息。',
      okText: '确认撤销',
      cancelText: '取消',
      onOk: async () => {
        await cancelAudit()
        getHotelInfo()
        message.success('撤销审核成功')
      },
    })
  }

  const handleAddRoom = () => {
    if (viewingPublishedVersion) {
      message.warning('查看模式下不能编辑房型')
      return
    }
    setEditingRoomIndex(null)
    setRoomModalOpen(true)
  }

  const handleEditRoom = (index: number) => {
    if (viewingPublishedVersion) {
      message.warning('查看模式下不能编辑房型')
      return
    }
    setEditingRoomIndex(index)
    setRoomModalOpen(true)
  }

  const handleDeleteRoom = (index: number) => {
    if (viewingPublishedVersion) {
      message.warning('查看模式下不能删除房型')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个房型吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deleteRoomType(index)
        message.success('删除成功')
      },
    })
  }

  const handleRoomSubmit = (room: RoomType) => {
    if (editingRoomIndex !== null) {
      updateRoomType(editingRoomIndex, room)
      message.success('房型更新成功')
    } else {
      addRoomType(room)
      message.success('房型添加成功')
    }
    setRoomModalOpen(false)
    setEditingRoomIndex(null)
  }

  const editingRoom = useMemo(() => {
    if (editingRoomIndex !== null && roomData[editingRoomIndex]) {
      return roomData[editingRoomIndex]
    }
    return undefined
  }, [editingRoomIndex, roomData])

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: React.ReactNode; className: string }
  > = {
    draft: {
      label: '草稿',
      color: 'default',
      icon: <FileEdit size={14} />,
      className: styles.statusDraft,
    },
    pending: {
      label: '审核中',
      color: 'processing',
      icon: <Clock size={14} />,
      className: styles.statusPending,
    },
    approved: {
      label: '审核通过',
      color: 'warning',
      icon: <CheckCircle size={14} />,
      className: styles.statusApproved,
    },
    published: {
      label: '已发布',
      color: 'success',
      icon: <CheckCircle size={14} />,
      className: styles.statusPublished,
    },
    rejected: {
      label: '已驳回',
      color: 'error',
      icon: <XCircle size={14} />,
      className: styles.statusRejected,
    },
    offline: {
      label: '已下线',
      color: 'default',
      icon: <XCircle size={14} />,
      className: styles.statusOffline,
    },
  }

  const currentStatus = statusConfig[hotelInfo?.status || 'draft'] || statusConfig.draft

  // 是否有待审核的草稿
  const hasPendingDraft = hotelInfo && hasVersionControl(hotelInfo.status) && !!hotelInfo.draftData

  return (
    <div className={styles.container}>
      <div className="pageHeader">
        <h2>酒店信息管理</h2>
        <div className={styles.headerSub}>
          <Tag
            className={`${styles.statusTag} ${currentStatus.className}`}
            icon={currentStatus.icon}
          >
            {currentStatus.label}
          </Tag>
          <span className={styles.headerDesc}>
            {hotelInfo?.status === 'published'
              ? '酒店已发布，客户端展示的是最近一次已上线的版本。'
              : hotelInfo?.status === 'offline'
                ? '酒店已下线，客户端不再展示。'
                : '请完善您的酒店资料，审核通过后将展示在客户端。'}
          </span>
          {/* 查看驳回原因按钮 */}
          {hotelInfo?.rejectReason &&
            (hotelInfo.status === 'rejected' ||
              hotelInfo.status === 'draft' ||
              hotelInfo.status === 'pending') && (
              <Button
                type="link"
                icon={<AlertCircle size={16} />}
                onClick={() => setRejectReasonModalOpen(true)}
                style={{ color: '#dc2626', padding: '0 8px' }}
              >
                查看驳回原因
              </Button>
            )}
        </div>

        <Space className={styles.optionButton}>
          {/* 刷新按钮和状态 */}
          <span style={{ fontSize: 12, color: '#78716c', marginRight: 8 }}>
            {loading ? '更新中...' : `上次更新: ${formatUpdateTime(lastUpdateTime)}`}
          </span>
          <Button
            type="text"
            icon={<RefreshCw size={16} className={loading ? 'spin' : ''} />}
            onClick={refresh}
            disabled={loading}
            title="立即刷新"
          />
          {hotelInfo?.status === 'draft' && (
            <>
              <Button size="large" onClick={update} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存草稿'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving}
              >
                提交审核
              </Button>
            </>
          )}
          {hotelInfo?.status === 'pending' && (
            <Button size="large" icon={<Undo2 size={18} />} onClick={cancel}>
              撤销审核
            </Button>
          )}
          {(hotelInfo?.status === 'published' || hotelInfo?.status === 'offline') && (
            <>
              <Button size="large" onClick={update} disabled={saving || viewingPublishedVersion}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存修改'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving || viewingPublishedVersion || !hasPendingDraft}
              >
                提交审核
              </Button>
            </>
          )}
          {hotelInfo?.status === 'rejected' && (
            <>
              <Button size="large" onClick={update} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存草稿'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving}
              >
                重新提交
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 版本控制切换按钮（仅已发布/已下线酒店显示） */}
      {hotelInfo && hasVersionControl(hotelInfo.status) && (
        <div className={styles.versionToggle}>
          <Space size="middle" align="center">
            {/* 版本控制提示 */}
            {hasPendingDraft && (
              <Alert
                title="您有未提交的修改"
                type="info"
                showIcon
                style={{ padding: '4px 8px', fontSize: 13 }}
              />
            )}
            {/* 查看模式提示 */}
            {viewingPublishedVersion && (
              <Alert
                title="查看模式 - 不可编辑"
                type="warning"
                showIcon
                style={{ padding: '4px 8px', fontSize: 13 }}
              />
            )}
            <Button
              type={viewingPublishedVersion ? 'primary' : 'default'}
              icon={<Eye size={16} />}
              onClick={() => setViewingPublishedVersion(true)}
            >
              查看线上版本
            </Button>
            <Button
              type={!viewingPublishedVersion ? 'primary' : 'default'}
              icon={<Edit3 size={16} />}
              onClick={() => setViewingPublishedVersion(false)}
            >
              编辑草稿
            </Button>
          </Space>
        </div>
      )}

      {/* 驳回原因弹窗 */}
      <Modal
        title="驳回原因"
        open={rejectReasonModalOpen}
        onCancel={() => setRejectReasonModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setRejectReasonModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert title="审核不通过" description={hotelInfo?.rejectReason} type="error" showIcon />
          <p style={{ marginTop: 16, color: '#78716c', fontSize: 14 }}>
            请根据驳回原因修改酒店信息后重新提交审核。
          </p>
        </div>
      </Modal>

      <CustomTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'basic', label: '基本信息' },
          { key: 'rooms', label: '房型与价格' },
          { key: 'marketing', label: '营销与位置' },
        ]}
      />

      <FormCard>
        <Form form={form} layout="vertical">
          {activeTab === 'basic' && (
            <BasicInfoForm
              pendingCoverFile={pendingCoverFile}
              onPendingCoverFileChange={setPendingCoverFile}
              disabled={viewingPublishedVersion}
            />
          )}
          {activeTab === 'rooms' && (
            <RoomList
              rooms={roomData}
              onAddRoom={handleAddRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          )}
          {activeTab === 'marketing' && <MarketingForm disabled={viewingPublishedVersion} />}
        </Form>
      </FormCard>

      <RoomModal
        open={roomModalOpen}
        onCancel={() => {
          setRoomModalOpen(false)
          setEditingRoomIndex(null)
        }}
        onSubmit={handleRoomSubmit}
        initialValues={editingRoom}
        title={editingRoomIndex !== null ? '编辑房型' : '添加房型'}
      />
    </div>
  )
}

export default MerchantHotelForm

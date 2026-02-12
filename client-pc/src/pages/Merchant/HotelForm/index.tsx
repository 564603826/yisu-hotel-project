import React, { useState, useEffect, useMemo } from 'react'
import { Form, Button, Space, message, Modal, Tag } from 'antd'
import { Save, Undo2, Loader2, FileEdit, Clock, CheckCircle, XCircle } from 'lucide-react'
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

const MerchantHotelForm: React.FC = () => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const { hotelInfo } = useMerchantStore((state) => state)
  const getHotelInfo = useMerchantStore((state) => state.getHotelInfo)
  const updateHotelInfo = useMerchantStore((state) => state.updateHotelInfo)
  const submitAudit = useMerchantStore((state) => state.submitAudit)
  const cancelAudit = useMerchantStore((state) => state.cancelAudit)
  const addRoomType = useMerchantStore((state) => state.addRoomType)
  const updateRoomType = useMerchantStore((state) => state.updateRoomType)
  const deleteRoomType = useMerchantStore((state) => state.deleteRoomType)

  useEffect(() => {
    getHotelInfo()
  }, [getHotelInfo])

  const roomData = useMemo<RoomType[]>(() => {
    return hotelInfo?.roomTypes || []
  }, [hotelInfo?.roomTypes])

  useEffect(() => {
    if (hotelInfo?.id) {
      const formData = {
        ...hotelInfo,
        openDate: dayjs(hotelInfo?.openDate),
        coverImage: hotelInfo?.images?.[0] || '',
      }
      form.setFieldsValue(formData)
      setPendingCoverFile(null)
    }
  }, [hotelInfo, form])

  const update = async () => {
    if (hotelInfo?.status === 'pending') {
      message.warning('酒店正在审核中，暂不能修改信息')
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
        openDate: form.getFieldValue('openDate').format('YYYY-MM-DD'),
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
    setEditingRoomIndex(null)
    setRoomModalOpen(true)
  }

  const handleEditRoom = (index: number) => {
    setEditingRoomIndex(index)
    setRoomModalOpen(true)
  }

  const handleDeleteRoom = (index: number) => {
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

  const statusConfig = {
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
  }

  const currentStatus = statusConfig[(hotelInfo?.status as keyof typeof statusConfig) || 'draft']

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
          <span className={styles.headerDesc}>请完善您的酒店资料，审核通过后将展示在客户端。</span>
        </div>
        <Space className={styles.optionButton}>
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
          {hotelInfo?.status === 'published' && (
            <Button size="large" onClick={update} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : '保存修改'}
            </Button>
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
          {activeTab === 'marketing' && <MarketingForm />}
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

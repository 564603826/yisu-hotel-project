import React, { useEffect, useState, useMemo } from 'react'
import { Form, Input, InputNumber, Select, Button } from 'antd'
import { Plus, Star, X } from 'lucide-react'
import type { RoomType } from '@/types'
import MultiImageUpload from './MultiImageUpload'
import type { ImageItem } from './MultiImageUpload'
import '@/components/MerchantForm/index.scss'

// 扩展 RoomType 支持 ImageItem
interface RoomTypeWithImageItems extends Omit<RoomType, 'images'> {
  images?: (string | ImageItem)[]
}

interface RoomModalProps {
  open: boolean
  onCancel: () => void
  onSubmit?: (room: RoomTypeWithImageItems) => void
  initialValues?: RoomTypeWithImageItems
  title?: string
  disabled?: boolean // 只读模式
}

const RoomModal: React.FC<RoomModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  title = '添加房型',
  disabled = false,
}) => {
  const [form] = Form.useForm()
  const [facilities, setFacilities] = useState<string[]>([])
  const [newFacility, setNewFacility] = useState('')
  // 本地图片列表（包含文件对象）
  const [localImages, setLocalImages] = useState<ImageItem[]>([])

  // 使用 useMemo 计算初始 facilities，避免在 useEffect 中调用 setState
  const initialFacilities = useMemo(() => {
    return initialValues?.facilities || []
  }, [initialValues])

  // 只在 modal 打开时初始化表单值和设施列表
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues)
        // 使用 requestAnimationFrame 延迟 setState 到渲染完成后
        requestAnimationFrame(() => {
          setFacilities(initialValues.facilities || [])
          // 初始化房型图片 - 将 (string | ImageItem)[] 转换为 ImageItem[]
          const images = initialValues.images || []
          setLocalImages(
            images.map((img, index) => {
              if (typeof img === 'string') {
                // string URL
                return {
                  url: img,
                  uid: `room-${index}`,
                  status: 'done' as const,
                }
              } else {
                // ImageItem
                return img
              }
            })
          )
        })
      } else {
        form.resetFields()
        requestAnimationFrame(() => {
          setFacilities([])
          setLocalImages([])
        })
      }
    }
  }, [open, initialValues, form, initialFacilities])

  const handleSubmit = async () => {
    if (disabled) return

    try {
      const values = await form.validateFields()

      // 处理图片：已上传的（status: 'done'）转为 URL string
      // 新上传的（status: 'pending'）保持为 ImageItem
      const processedImages: (string | ImageItem)[] = localImages.map((img) => {
        if (img.status === 'done' && img.url && !img.url.startsWith('blob:')) {
          // 已上传的图片，返回 URL string
          return img.url
        }
        // 新上传的图片，返回 ImageItem
        return img
      })

      onSubmit?.({
        ...values,
        facilities,
        images: processedImages,
      })

      // 重置状态
      form.resetFields()
      setFacilities([])
      setLocalImages([])
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setFacilities([])
    setLocalImages([])
    onCancel()
  }

  const addFacility = () => {
    if (disabled) return
    if (newFacility.trim()) {
      setFacilities([...facilities, newFacility.trim()])
      setNewFacility('')
    }
  }

  const removeFacility = (index: number) => {
    if (disabled) return
    setFacilities(facilities.filter((_, i) => i !== index))
  }

  if (!open) return null

  return (
    <div className="room-modal-overlay">
      <div className="room-modal-backdrop" onClick={handleCancel} />
      <div className="room-modal-container" style={{ maxWidth: 600 }}>
        {/* Modal Header */}
        <div className="room-modal-header">
          <div className="header-decoration">
            <Star size={100} className="decoration-icon" />
          </div>
          <div>
            <h3 className="header-title">{disabled ? '查看房型' : title}</h3>
            <p className="header-subtitle">{disabled ? 'Room Details' : 'Room Configuration'}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="room-modal-body">
          <Form form={form} layout="vertical">
            {/* Room Name */}
            <Form.Item
              name="name"
              label={
                <span className="form-label">
                  <span className="required-star">*</span> 房型名称
                </span>
              }
              rules={[{ required: true, message: '请输入房型名称' }]}
            >
              <Input
                className="form-input"
                placeholder="如: 豪华海景大床房"
                disabled={disabled || !!initialValues}
                title={initialValues ? '已有房型不能修改名称' : ''}
              />
            </Form.Item>

            {/* Price & Area Grid */}
            <div className="form-grid">
              <Form.Item
                name="price"
                label={
                  <span className="form-label">
                    <span className="required-star">*</span> 价格 (元/晚)
                  </span>
                }
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber<number>
                  className="form-input"
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="1280"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => {
                    if (!value) return 0
                    const parsed = value.replace(/[^0-9]/g, '')
                    return parsed ? Number(parsed) : 0
                  }}
                  disabled={disabled}
                />
              </Form.Item>

              <Form.Item name="area" label={<span className="form-label">房间面积</span>}>
                <InputNumber
                  className="form-input"
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="50"
                  suffix="m²"
                  disabled={disabled}
                />
              </Form.Item>
            </div>

            {/* Bed Type */}
            <Form.Item name="bedType" label={<span className="form-label">床型配置</span>}>
              <Select
                className="form-input"
                placeholder="请选择床型"
                allowClear
                disabled={disabled}
              >
                <Select.Option value="大床">大床 (1.8m)</Select.Option>
                <Select.Option value="双床">双床 (1.2m × 2)</Select.Option>
                <Select.Option value="单床">单床 (1.2m)</Select.Option>
                <Select.Option value="特大床">特大床 (2.2m)</Select.Option>
              </Select>
            </Form.Item>

            {/* Room Images */}
            <div className="form-section" style={{ marginBottom: 24 }}>
              <label className="form-label">房型图片</label>
              <MultiImageUpload
                value={localImages}
                onChange={disabled ? () => {} : setLocalImages}
                maxCount={5}
                disabled={disabled}
              />
              <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 8 }}>
                {disabled ? '房型图片展示' : '最多上传5张图片，展示房型实景（保存时统一上传）'}
              </div>
            </div>

            {/* Facilities */}
            <div className="facilities-section">
              <label className="form-label">设施列表</label>
              <div className="facilities-tags">
                {facilities.map((fac, idx) => (
                  <span key={idx} className="facility-tag">
                    {fac}
                    {!disabled && (
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeFacility(idx)}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {!disabled && (
                  <div className="add-facility">
                    <Input
                      className="add-facility-input"
                      placeholder="添加设施"
                      value={newFacility}
                      onChange={(e) => setNewFacility(e.target.value)}
                      onPressEnter={addFacility}
                    />
                    <Button className="add-facility-btn" onClick={addFacility}>
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </div>

        {/* Modal Footer */}
        <div className="room-modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            {disabled ? '关闭' : '取消'}
          </button>
          {!disabled && (
            <button className="submit-btn" onClick={handleSubmit}>
              确认
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomModal

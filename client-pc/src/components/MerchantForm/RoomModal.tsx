import React, { useEffect, useState, useMemo } from 'react'
import { Form, Input, InputNumber, Select, Button } from 'antd'
import { Plus, Star } from 'lucide-react'
import type { RoomType } from '@/types'
import '@/components/MerchantForm/index.scss'

interface RoomModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (room: RoomType) => void
  initialValues?: RoomType
  title?: string
}

const RoomModal: React.FC<RoomModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  title = '添加房型',
}) => {
  const [form] = Form.useForm()
  const [facilities, setFacilities] = useState<string[]>([])
  const [newFacility, setNewFacility] = useState('')

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
        })
      } else {
        form.resetFields()
        requestAnimationFrame(() => {
          setFacilities([])
        })
      }
    }
  }, [open, initialValues, form, initialFacilities])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onSubmit({
        ...values,
        facilities,
      })
      form.resetFields()
      setFacilities([])
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setFacilities([])
    onCancel()
  }

  const addFacility = () => {
    if (newFacility.trim()) {
      setFacilities([...facilities, newFacility.trim()])
      setNewFacility('')
    }
  }

  const removeFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index))
  }

  if (!open) return null

  return (
    <div className="room-modal-overlay">
      <div className="room-modal-backdrop" onClick={handleCancel} />
      <div className="room-modal-container">
        {/* Modal Header */}
        <div className="room-modal-header">
          <div className="header-decoration">
            <Star size={100} className="decoration-icon" />
          </div>
          <div>
            <h3 className="header-title">{title}</h3>
            <p className="header-subtitle">Room Configuration</p>
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
              <Input className="form-input" placeholder="如: 豪华海景大床房" />
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
                />
              </Form.Item>

              <Form.Item name="area" label={<span className="form-label">房间面积</span>}>
                <InputNumber
                  className="form-input"
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="50"
                  suffix="m²"
                />
              </Form.Item>
            </div>

            {/* Bed Type */}
            <Form.Item name="bedType" label={<span className="form-label">床型配置</span>}>
              <Select className="form-input" placeholder="请选择床型" allowClear>
                <Select.Option value="大床">大床 (1.8m)</Select.Option>
                <Select.Option value="双床">双床 (1.2m × 2)</Select.Option>
                <Select.Option value="单床">单床 (1.2m)</Select.Option>
                <Select.Option value="特大床">特大床 (2.2m)</Select.Option>
              </Select>
            </Form.Item>

            {/* Facilities */}
            <div className="facilities-section">
              <label className="form-label">设施列表</label>
              <div className="facilities-tags">
                {facilities.map((fac, idx) => (
                  <span key={idx} className="facility-tag">
                    {fac}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => removeFacility(idx)}
                    ></button>
                  </span>
                ))}
                <div className="add-facility">
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                    placeholder="添加设施..."
                    className="add-facility-input"
                  />
                  <button type="button" className="add-facility-btn" onClick={addFacility}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Form>
        </div>

        {/* Modal Footer */}
        <div className="room-modal-footer">
          <Button className="cancel-btn" onClick={handleCancel}>
            取消
          </Button>
          <Button className="submit-btn" type="primary" onClick={handleSubmit}>
            {initialValues ? '确认修改' : '确认添加'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RoomModal

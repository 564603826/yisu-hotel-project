import React, { useState } from 'react'
import { Form, Input, Row, Col, Button, Typography, Select } from 'antd'
import { MapPin, Train, ShoppingBag, Plus, X, Check } from 'lucide-react'

const { Title } = Typography

interface DiscountItem {
  name: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
}

interface MarketingFormProps {
  disabled?: boolean
}

const MarketingForm: React.FC<MarketingFormProps> = ({ disabled = false }) => {
  const [editingDiscounts, setEditingDiscounts] = useState<Partial<DiscountItem>[]>([])
  const form = Form.useFormInstance()

  // 添加新的优惠活动
  const handleAdd = () => {
    setEditingDiscounts([...editingDiscounts, { type: 'percentage', value: undefined }])
  }

  // 删除编辑中的优惠活动
  const handleRemoveEditing = (index: number) => {
    const newEditing = [...editingDiscounts]
    newEditing.splice(index, 1)
    setEditingDiscounts(newEditing)
  }

  // 确认保存优惠活动
  const handleConfirm = (index: number) => {
    const item = editingDiscounts[index]
    if (!item.name?.trim() || item.value === undefined || item.value === null) {
      return
    }

    // 获取当前表单中的 discounts
    const currentDiscounts = form.getFieldValue('discounts') || []

    // 添加到表单
    form.setFieldValue('discounts', [...currentDiscounts, item as DiscountItem])

    // 从编辑列表中移除
    handleRemoveEditing(index)
  }

  // 删除已保存的优惠活动
  const handleRemoveSaved = (index: number) => {
    const currentDiscounts = form.getFieldValue('discounts') || []
    const newDiscounts = [...currentDiscounts]
    newDiscounts.splice(index, 1)
    form.setFieldValue('discounts', newDiscounts)
  }

  // 更新编辑中的值
  const handleChange = (index: number, field: keyof DiscountItem, value: any) => {
    const newEditing = [...editingDiscounts]
    newEditing[index] = { ...newEditing[index], [field]: value }
    setEditingDiscounts(newEditing)
  }

  return (
    <div>
      {/* 附近信息区域 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>
          周边信息
        </Title>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              label={
                <span style={{ fontSize: 13, color: '#57534e', fontWeight: 500 }}>
                  <MapPin
                    size={14}
                    style={{ marginRight: 6, color: '#c58e53', verticalAlign: 'middle' }}
                  />
                  附近景点
                </span>
              }
              name="nearbyAttractions"
            >
              <Input.TextArea
                rows={3}
                placeholder="如：距离故宫3.5km"
                style={{ borderRadius: 8, resize: 'none' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <span style={{ fontSize: 13, color: '#57534e', fontWeight: 500 }}>
                  <Train
                    size={14}
                    style={{ marginRight: 6, color: '#c58e53', verticalAlign: 'middle' }}
                  />
                  附近交通
                </span>
              }
              name="nearbyTransport"
            >
              <Input.TextArea
                rows={3}
                placeholder="如：距离地铁站500米"
                style={{ borderRadius: 8, resize: 'none' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <span style={{ fontSize: 13, color: '#57534e', fontWeight: 500 }}>
                  <ShoppingBag
                    size={14}
                    style={{ marginRight: 6, color: '#c58e53', verticalAlign: 'middle' }}
                  />
                  附近商圈
                </span>
              }
              name="nearbyMalls"
            >
              <Input.TextArea
                rows={3}
                placeholder="如：步行可达万达广场"
                style={{ borderRadius: 8, resize: 'none' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 优惠活动区域 */}
      <div>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>
          优惠活动
        </Title>

        {/* 已保存的优惠活动 */}
        <Form.Item name="discounts" style={{ marginBottom: 0 }}>
          <DiscountList disabled={disabled} onRemove={handleRemoveSaved} />
        </Form.Item>

        {/* 编辑中的优惠活动 */}
        {editingDiscounts.map((item, index) => (
          <div
            key={index}
            className="discount-item editing"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              marginBottom: 12,
              padding: '12px 16px',
              background: '#fffdfb',
              borderRadius: 8,
              border: '1px solid rgba(197, 142, 83, 0.6)',
              boxShadow: '0 2px 8px rgba(197, 142, 83, 0.08)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  placeholder="活动名称，如：夏季清凉特惠"
                  style={{ borderRadius: 6, flex: 1 }}
                  size="middle"
                  disabled={disabled}
                  value={item.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                />
                <Select
                  value={item.type}
                  onChange={(value) => handleChange(index, 'type', value)}
                  disabled={disabled}
                  style={{ width: 100 }}
                  options={[
                    { label: '百分比', value: 'percentage' },
                    { label: '固定金额', value: 'fixed' },
                  ]}
                />
                <Input
                  type="number"
                  placeholder={item.type === 'percentage' ? '如：80表示8折' : '如：100'}
                  style={{ borderRadius: 6, width: 120 }}
                  size="middle"
                  disabled={disabled}
                  value={item.value}
                  onChange={(e) =>
                    handleChange(index, 'value', parseFloat(e.target.value) || undefined)
                  }
                />
              </div>
              <Input.TextArea
                rows={2}
                placeholder="优惠描述，如：连住3晚享8折优惠"
                style={{ borderRadius: 6, resize: 'none' }}
                disabled={disabled}
                value={item.description}
                onChange={(e) => handleChange(index, 'description', e.target.value)}
              />
            </div>
            {!disabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Button
                  type="text"
                  icon={<Check size={16} />}
                  onClick={() => handleConfirm(index)}
                  disabled={!item.name?.trim() || item.value === undefined || item.value === null}
                  className="discount-confirm-btn"
                  title="确认添加"
                />
                <Button
                  type="text"
                  danger
                  icon={<X size={16} />}
                  onClick={() => handleRemoveEditing(index)}
                  className="discount-delete-btn"
                  title="取消"
                />
              </div>
            )}
          </div>
        ))}

        {/* 添加按钮 */}
        {!disabled && (
          <Button
            type="dashed"
            onClick={handleAdd}
            icon={<Plus size={16} />}
            className="discount-add-btn"
            style={{
              height: 40,
              borderRadius: 6,
              borderColor: '#c58e53',
              color: '#c58e53',
              background: 'transparent',
            }}
          >
            添加优惠活动
          </Button>
        )}
      </div>
    </div>
  )
}

// 已保存的优惠活动列表组件
interface DiscountListProps {
  value?: DiscountItem[]
  disabled?: boolean
  onRemove?: (index: number) => void
}

const DiscountList: React.FC<DiscountListProps> = ({ value = [], disabled, onRemove }) => {
  if (value.length === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      {value.map((item, index) => (
        <div
          key={index}
          className="discount-item saved"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            marginBottom: 12,
            padding: '12px 16px',
            background: '#fafaf9',
            borderRadius: 8,
            border: '1px solid #e7e5e4',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: '#292524', marginBottom: 4 }}>
              {item.name}
              <span style={{ color: '#c58e53', marginLeft: 8 }}>
                {item.type === 'percentage' ? `${item.value}折` : `减¥${item.value}`}
              </span>
            </div>
            {item.description && (
              <div style={{ color: '#78716c', fontSize: 13 }}>{item.description}</div>
            )}
          </div>
          {!disabled && (
            <Button
              type="text"
              danger
              icon={<X size={16} />}
              onClick={() => onRemove?.(index)}
              className="discount-delete-btn"
              title="删除"
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default MarketingForm

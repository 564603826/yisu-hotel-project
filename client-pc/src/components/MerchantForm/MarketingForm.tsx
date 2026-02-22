import React, { useState } from 'react'
import { Form, Input, Row, Col, Button, Typography, Tag, Space } from 'antd'
import {
  MapPin,
  Train,
  ShoppingBag,
  Plus,
  X,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  UtensilsCrossed,
  Presentation,
  Briefcase,
  Shirt,
  Sparkles,
  Wine,
  Bus,
  Baby,
  Accessibility,
  Luggage,
  Clock,
} from 'lucide-react'

const { Title } = Typography

interface MarketingFormProps {
  disabled?: boolean
}

// 预设的设施选项（带图标组件）
const FACILITY_OPTIONS = [
  { label: '免费WiFi', value: '免费WiFi', icon: Wifi },
  { label: '停车场', value: '停车场', icon: Car },
  { label: '健身房', value: '健身房', icon: Dumbbell },
  { label: '游泳池', value: '游泳池', icon: Waves },
  { label: '餐厅', value: '餐厅', icon: UtensilsCrossed },
  { label: '会议室', value: '会议室', icon: Presentation },
  { label: '商务中心', value: '商务中心', icon: Briefcase },
  { label: '洗衣服务', value: '洗衣服务', icon: Shirt },
  { label: 'SPA', value: 'SPA', icon: Sparkles },
  { label: '酒吧', value: '酒吧', icon: Wine },
  { label: '接送服务', value: '接送服务', icon: Bus },
  { label: '儿童设施', value: '儿童设施', icon: Baby },
  { label: '无障碍设施', value: '无障碍设施', icon: Accessibility },
  { label: '行李寄存', value: '行李寄存', icon: Luggage },
  { label: '24小时前台', value: '24小时前台', icon: Clock },
]

// 设施选择器组件
const FacilitySelector: React.FC<{
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
}> = ({ value = [], onChange, disabled = false }) => {
  const [customInput, setCustomInput] = useState('')

  const handleToggle = (facilityValue: string) => {
    if (disabled) return
    const newValue = value.includes(facilityValue)
      ? value.filter((v) => v !== facilityValue)
      : [...value, facilityValue]
    onChange?.(newValue)
  }

  const handleAddCustom = () => {
    if (disabled || !customInput.trim()) return
    const newFacility = customInput.trim()
    if (!value.includes(newFacility)) {
      onChange?.([...value, newFacility])
    }
    setCustomInput('')
  }

  const handleRemove = (facilityValue: string) => {
    if (disabled) return
    onChange?.(value.filter((v) => v !== facilityValue))
  }

  // 获取预设选项的图标组件
  const getFacilityIcon = (facilityValue: string) => {
    const option = FACILITY_OPTIONS.find((opt) => opt.value === facilityValue)
    return option?.icon || null
  }

  return (
    <div>
      {/* 预设选项 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: 16,
        }}
      >
        {FACILITY_OPTIONS.map((option) => {
          const isSelected = value.includes(option.value)
          const IconComponent = option.icon
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${isSelected ? '#c58e53' : '#e7e5e4'}`,
                background: isSelected ? '#fdf8f3' : '#fff',
                color: isSelected ? '#c58e53' : '#57534e',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <IconComponent size={16} />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      {/* 自定义添加 */}
      {!disabled && (
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="输入自定义设施"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onPressEnter={handleAddCustom}
            style={{ width: 180, borderRadius: 6 }}
            size="middle"
          />
          <Button
            type="dashed"
            onClick={handleAddCustom}
            icon={<Plus size={14} />}
            style={{ borderRadius: 6 }}
          >
            添加
          </Button>
        </Space>
      )}

      {/* 已选设施展示 */}
      {value.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              color: '#78716c',
              marginBottom: 8,
            }}
          >
            已选设施（{value.length}个）
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {value.map((facility) => {
              const IconComponent = getFacilityIcon(facility)
              return (
                <Tag
                  key={facility}
                  closable={!disabled}
                  onClose={() => handleRemove(facility)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    fontSize: 13,
                    background: '#fafaf9',
                    borderColor: '#e7e5e4',
                    color: '#44403c',
                  }}
                >
                  {IconComponent && <IconComponent size={14} />}
                  <span>{facility}</span>
                </Tag>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const MarketingForm: React.FC<MarketingFormProps> = ({ disabled = false }) => {
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

      {/* 酒店设施区域 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>
          酒店设施
        </Title>
        <Form.Item name="facilities">
          <FacilitySelector disabled={disabled} />
        </Form.Item>
      </div>

      {/* 优惠活动区域 */}
      <div>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>
          优惠活动
        </Title>

        <Form.List name="discounts">
          {(fields, { add, remove }) => (
            <div>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginBottom: 12,
                    padding: 16,
                    background: '#fafaf9',
                    borderRadius: 8,
                    border: '1px solid #e7e5e4',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'title']}
                      style={{ marginBottom: 8 }}
                      rules={[{ required: true, message: '请输入标题' }]}
                    >
                      <Input
                        placeholder="活动标题，如：夏季清凉特惠"
                        style={{ borderRadius: 6 }}
                        size="middle"
                        disabled={disabled}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: '请输入详情' }]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="优惠详情，如：连住3晚享8折优惠"
                        style={{ borderRadius: 6, resize: 'none' }}
                        disabled={disabled}
                      />
                    </Form.Item>
                  </div>
                  {!disabled && (
                    <Button
                      type="text"
                      danger
                      icon={<X size={16} />}
                      onClick={() => remove(name)}
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>
              ))}
              {!disabled && (
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<Plus size={16} />}
                  style={{
                    height: 40,
                    borderRadius: 6,
                    borderColor: '#d6d3d1',
                    color: '#78716c',
                  }}
                >
                  添加优惠活动
                </Button>
              )}
            </div>
          )}
        </Form.List>
      </div>
    </div>
  )
}

export default MarketingForm

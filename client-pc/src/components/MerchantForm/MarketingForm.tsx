import React, { useState } from 'react'
import { Form, Input, Row, Col, Button, Typography, Tag, Radio, DatePicker } from 'antd'
import dayjs from 'dayjs'
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const { Title } = Typography

interface MarketingFormProps {
  disabled?: boolean
  discounts?: any[]
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
}> = ({ value: valueProp, onChange, disabled = false }) => {
  const value = valueProp || []
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
      {/* 预设选项 + 自定义添加 */}
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
        {/* 自定义添加 - 放在最后，样式与其他选项一致 */}
        {!disabled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 8,
              border: '1px solid #e7e5e4',
              background: '#fff',
              height: 36,
              boxSizing: 'border-box',
            }}
          >
            <Input
              placeholder="自定义设施"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onPressEnter={handleAddCustom}
              style={{
                width: 93,
                border: 'none',
                padding: '0 0 0 9px',
                background: 'transparent',
                fontSize: 13,
                height: 36,
              }}
              size="small"
              variant="borderless"
            />
            <Button
              type="text"
              onClick={handleAddCustom}
              icon={<Plus size={16} style={{ color: '#c58e53' }} />}
              style={{
                padding: 0,
                width: 24,
                margin: '0 4px',
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </div>
        )}
      </div>

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
  // 记录每个优惠项的展开状态
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set())

  const toggleExpand = (name: number) => {
    const newSet = new Set(expandedKeys)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setExpandedKeys(newSet)
  }

  return (
    <div>
      {/* 附近信息区域 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: '0 0 12px 0' }}>
          周边信息
        </Title>

        <Row gutter={16}>
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
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
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
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
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
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
                placeholder="如：步行可达万达广场"
                style={{ borderRadius: 8, resize: 'none' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 酒店设施区域 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: '0 0 12px 0' }}>
          酒店设施
        </Title>
        <Form.Item name="facilities" style={{ marginBottom: 0 }}>
          <FacilitySelector disabled={disabled} />
        </Form.Item>
      </div>

      {/* 优惠活动区域 */}
      <div>
        <Title level={5} style={{ margin: '0 0 12px 0' }}>
          优惠活动
        </Title>

        <Form.List name="discounts">
          {(fields, { add, remove }) => (
            <Row gutter={12}>
              {fields.map(({ key, name, ...restField }) => {
                const isExpanded = expandedKeys.has(name)
                return (
                  <Col span={12} key={key}>
                    <div
                      style={{
                        marginBottom: 12,
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #e7e5e4',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 简略信息 - 始终显示 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          background: isExpanded ? '#fdf8f3' : '#fff',
                          borderBottom: isExpanded ? '1px solid #f5e6d3' : 'none',
                          height: 48,
                          boxSizing: 'border-box',
                        }}
                        onClick={() => toggleExpand(name)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {/* 序号 */}
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 5,
                              background: '#fdf8f3',
                              border: '1px solid #c58e53',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#c58e53',
                              fontSize: 11,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {name + 1}
                          </div>

                          {/* 简略信息 - 显示名称和类型 */}
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const discount = getFieldValue(['discounts', name]) || {}
                                const discountType = discount.type || 'percentage'
                                const discountName = discount.name || '未命名优惠'
                                const discountValue = discount.value || 0
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#1c1917',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {discountName}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color:
                                          discountType === 'percentage' ? '#d97706' : '#2563eb',
                                        background:
                                          discountType === 'percentage' ? '#fef3c7' : '#dbeafe',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {discountType === 'percentage'
                                        ? `${discountValue}%`
                                        : `¥${discountValue}`}
                                    </span>
                                  </div>
                                )
                              }}
                            </Form.Item>
                          </div>
                        </div>

                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                        >
                          {/* 展开/收起图标 */}
                          <span style={{ color: '#a8a29e' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                          {/* 删除按钮 */}
                          {!disabled && (
                            <Button
                              type="text"
                              size="small"
                              icon={<X size={14} />}
                              onClick={(e) => {
                                e.stopPropagation()
                                remove(name)
                              }}
                              style={{ color: '#a8a29e', padding: '2px' }}
                            />
                          )}
                        </div>
                      </div>

                      {/* 详细信息 - 使用 display:none 控制显示 */}
                      <div
                        style={{
                          display: isExpanded ? 'block' : 'none',
                          padding: '16px',
                        }}
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: '请输入活动名称' }]}
                          style={{ marginBottom: 12 }}
                        >
                          <Input placeholder="活动名称" disabled={disabled} />
                        </Form.Item>
                        <Row gutter={12} style={{ marginBottom: 0 }}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'type']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 12 }}
                            >
                              <Radio.Group
                                disabled={disabled}
                                style={{ display: 'flex' }}
                                className="discount-type-radio"
                              >
                                <Radio.Button
                                  value="percentage"
                                  style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    height: 40,
                                    lineHeight: '38px',
                                    padding: '0 8px',
                                  }}
                                >
                                  百分比
                                </Radio.Button>
                                <Radio.Button
                                  value="fixed"
                                  style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    height: 40,
                                    lineHeight: '38px',
                                    padding: '0 8px',
                                  }}
                                >
                                  固定金额
                                </Radio.Button>
                              </Radio.Group>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 12 }}
                            >
                              <Input
                                type="number"
                                placeholder="优惠值"
                                disabled={disabled}
                                suffix={
                                  <Form.Item noStyle shouldUpdate>
                                    {({ getFieldValue }) => {
                                      const type = getFieldValue(['discounts', name, 'type'])
                                      return (
                                        <span style={{ color: '#c58e53', fontWeight: 500 }}>
                                          {type === 'percentage' ? '%' : '元'}
                                        </span>
                                      )
                                    }}
                                  </Form.Item>
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={12} style={{ marginBottom: 0 }}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'startDate']}
                              getValueProps={(value) => ({
                                value: value ? dayjs(value) : null,
                              })}
                              style={{ marginBottom: 12 }}
                            >
                              <DatePicker
                                placeholder="开始日期"
                                style={{ width: '100%' }}
                                disabled={disabled}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'endDate']}
                              getValueProps={(value) => ({
                                value: value ? dayjs(value) : null,
                              })}
                              style={{ marginBottom: 12 }}
                            >
                              <DatePicker
                                placeholder="结束日期"
                                style={{ width: '100%' }}
                                disabled={disabled}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          style={{ marginBottom: 0 }}
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder="优惠描述（可选）"
                            disabled={disabled}
                            size="small"
                          />
                        </Form.Item>
                      </div>
                    </div>
                  </Col>
                )
              })}
              {!disabled && (
                <Col span={24}>
                  <Button
                    type="dashed"
                    onClick={() => {
                      add({ type: 'percentage', value: 20 })
                      // 自动展开新添加的项
                      setTimeout(() => {
                        setExpandedKeys((prev) => new Set([...prev, fields.length]))
                      }, 0)
                    }}
                    icon={<Plus size={16} />}
                    style={{ height: 40, width: '100%' }}
                  >
                    添加优惠活动
                  </Button>
                </Col>
              )}
            </Row>
          )}
        </Form.List>
      </div>
    </div>
  )
}

export default MarketingForm

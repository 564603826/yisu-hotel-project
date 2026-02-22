import React from 'react'
import { Form, Input, Row, Col, Button, Typography } from 'antd'
import { MapPin, Train, ShoppingBag, Plus, X } from 'lucide-react'

const { Title } = Typography

interface MarketingFormProps {
  disabled?: boolean
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

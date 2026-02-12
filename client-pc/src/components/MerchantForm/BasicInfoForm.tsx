import React from 'react'
import { Form, Input, Row, Col, Rate, DatePicker, Button } from 'antd'
import { MapPin } from 'lucide-react'
import UploadArea from './UploadArea'

interface BasicInfoFormProps {
  initialValues: {
    nameCn: string
    nameEn: string
    address: string
    starRating: number
    openDate: any
    description: string
  }
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ initialValues }) => {
  return (
    <Row gutter={48}>
      <Col xs={24} lg={12}>
        <Form.Item label="酒店中文名称" name="nameCn" rules={[{ required: true }]}>
          <Input size="large" placeholder="请输入酒店中文名称" />
        </Form.Item>
        <Form.Item label="酒店英文名称" name="nameEn" rules={[{ required: true }]}>
          <Input size="large" placeholder="请输入酒店英文名称" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="开业时间" name="openDate" rules={[{ required: true }]}>
              <DatePicker size="large" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="酒店星级" name="starRating">
              <Rate style={{ color: '#c58e53' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="酒店简介" name="description">
          <Input.TextArea rows={4} placeholder="请输入酒店描述..." />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item label="详细地址" name="address" rules={[{ required: true }]}>
          <Input
            size="large"
            prefix={<MapPin size={16} style={{ color: '#a8a29e' }} />}
            suffix={
              <Button size="small" type="text">
                定位
              </Button>
            }
          />
        </Form.Item>

        <Form.Item label="酒店封面图">
          <UploadArea />
        </Form.Item>
      </Col>
    </Row>
  )
}

export default BasicInfoForm

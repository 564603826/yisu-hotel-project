import React, { useState } from 'react'
import { Form, Input, Row, Col, Rate, DatePicker, Button } from 'antd'
import { MapPin } from 'lucide-react'
import UploadArea from './UploadArea'
import LocationPicker from '../Location/LocationPicker'

interface BasicInfoFormProps {
  pendingCoverFile?: File | null
  onPendingCoverFileChange?: (file: File | null) => void
}

interface LocationData {
  address: string
  lng: number
  lat: number
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  pendingCoverFile,
  onPendingCoverFileChange,
}) => {
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)

  const form = Form.useFormInstance()

  const handleLocationConfirm = (location: LocationData) => {
    setCurrentLocation(location)
    form.setFieldValue('address', location.address)
  }

  return (
    <>
      <Row gutter={48}>
        <Col xs={24} lg={12}>
          <Form.Item label="酒店中文名称" name="nameZh" rules={[{ required: true }]}>
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
              <Form.Item label="酒店星级" name="starRating" style={{ marginLeft: 24 }}>
                <Rate style={{ color: '#c58e53', fontSize: 24 }} />
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
                <Button
                  size="small"
                  type="text"
                  onClick={() => setLocationPickerOpen(true)}
                  style={{ color: '#c58e53' }}
                >
                  定位
                </Button>
              }
              placeholder="点击定位按钮选择地址"
            />
          </Form.Item>

          <Form.Item label="酒店封面图" name="coverImage">
            <UploadArea
              pendingFile={pendingCoverFile}
              onPendingFileChange={onPendingCoverFileChange}
            />
          </Form.Item>
        </Col>
      </Row>

      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onConfirm={handleLocationConfirm}
        defaultAddress={currentLocation?.address}
        defaultLng={currentLocation?.lng}
        defaultLat={currentLocation?.lat}
      />
    </>
  )
}

export default BasicInfoForm

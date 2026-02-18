import React, { useState, useCallback } from 'react'
import { Form, Input, Row, Col, Rate, DatePicker } from 'antd'
import { MapPin } from 'lucide-react'
import MultiImageUpload from './MultiImageUpload'
import LocationPicker from '../Location/LocationPicker'
import type { ImageItem } from './MultiImageUpload'

interface BasicInfoFormProps {
  disabled?: boolean
  initialImages?: ImageItem[]
  onImagesChange?: (images: ImageItem[]) => void
}

interface LocationData {
  address: string
  lng: number
  lat: number
}

// 内部组件，用于管理图片状态
const ImageUploadSection: React.FC<{
  initialImages: ImageItem[]
  disabled: boolean
  onChange: (images: ImageItem[]) => void
}> = ({ initialImages, disabled, onChange }) => {
  const [images, setImages] = useState<ImageItem[]>(initialImages)
  const form = Form.useFormInstance()

  // 使用回调函数来处理图片变化
  const handleChange = useCallback(
    (newImages: ImageItem[]) => {
      setImages(newImages)

      // 更新表单字段
      const imageUrls = newImages.map((img) => img.url)
      form.setFields([
        { name: 'images', value: imageUrls },
        { name: 'coverImage', value: imageUrls[0] || '' },
      ])

      onChange(newImages)
    },
    [form, onChange]
  )

  return (
    <MultiImageUpload value={images} onChange={handleChange} maxCount={10} disabled={disabled} />
  )
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  disabled = false,
  initialImages = [],
  onImagesChange,
}) => {
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const form = Form.useFormInstance()

  // 监听地址字段变化
  const addressValue = Form.useWatch('address', form)

  const handleLocationConfirm = (location: LocationData) => {
    setCurrentLocation(location)
    form.setFieldValue('address', location.address)
  }

  return (
    <>
      <Row gutter={48}>
        {/* 左侧：基本信息 */}
        <Col xs={24} lg={12}>
          <Form.Item label="酒店中文名称" name="nameZh" rules={[{ required: true }]}>
            <Input size="large" placeholder="请输入酒店中文名称" disabled={disabled} />
          </Form.Item>
          <Form.Item label="酒店英文名称" name="nameEn" rules={[{ required: true }]}>
            <Input size="large" placeholder="请输入酒店英文名称" disabled={disabled} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开业时间" name="openDate" rules={[{ required: true }]}>
                <DatePicker size="large" style={{ width: '100%' }} disabled={disabled} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="酒店星级" name="starRating" style={{ marginLeft: 24 }}>
                <Rate style={{ color: '#c58e53', fontSize: 24 }} disabled={disabled} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="酒店简介" name="description">
            <Input.TextArea rows={5} placeholder="请输入酒店描述..." disabled={disabled} />
          </Form.Item>
        </Col>

        {/* 右侧：详细地址、定位和图片上传 */}
        <Col xs={24} lg={12}>
          {/* 详细地址 */}
          <Form.Item label="详细地址" name="address" rules={[{ required: true }]}>
            <Input size="large" placeholder="请输入详细地址" disabled={disabled} />
          </Form.Item>

          {/* 地图定位区域 */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                height: 180,
                background: '#f5f5f5',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !disabled && setLocationPickerOpen(true)}
            >
              <div style={{ textAlign: 'center', color: '#999' }}>
                <MapPin size={32} style={{ marginBottom: 8, color: '#c58e53' }} />
                <div>点击选择酒店位置</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{addressValue || '未设置位置'}</div>
              </div>
            </div>
          </div>

          {/* 酒店图片上传 */}
          <Form.Item label="酒店图片" name="images" style={{ marginBottom: 0 }}>
            <ImageUploadSection
              key={initialImages.map((img) => img.url).join(',')}
              initialImages={initialImages}
              disabled={disabled}
              onChange={onImagesChange || (() => {})}
            />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 5 }}>
            最多上传10张图片，第一张将作为封面图
          </div>

          <Form.Item label="酒店封面图" name="coverImage" hidden>
            <Input />
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

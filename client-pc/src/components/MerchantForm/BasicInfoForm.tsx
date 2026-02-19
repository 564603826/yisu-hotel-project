import React, { useState, useCallback } from 'react'
import { Form, Input, Row, Col, Rate, DatePicker, Button } from 'antd'
import { LocateFixed } from 'lucide-react'
import MultiImageUpload from './MultiImageUpload'
import LocationPicker from '../Location/LocationPicker'
import MapPreview from '../Location/MapPreview'
import type { ImageItem } from './MultiImageUpload'

interface BasicInfoFormProps {
  disabled?: boolean
  initialImages?: ImageItem[]
  onImagesChange?: (images: ImageItem[]) => void
  onValuesChange?: (changedValues: any, allValues: any) => void
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
  onValuesChange,
}) => {
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const form = Form.useFormInstance()

  // 监听地址字段变化
  const addressValue = Form.useWatch('address', form)
  const lngValue = Form.useWatch('longitude', form)
  const latValue = Form.useWatch('latitude', form)

  const handleLocationConfirm = (location: LocationData) => {
    form.setFieldValue('address', location.address)
    form.setFieldValue('longitude', location.lng)
    form.setFieldValue('latitude', location.lat)
    // 通知父组件值已变化
    onValuesChange?.(
      { address: location.address, longitude: location.lng, latitude: location.lat },
      form.getFieldsValue()
    )
  }

  const handleLocateFromPreview = (location: LocationData) => {
    form.setFieldValue('address', location.address)
    form.setFieldValue('longitude', location.lng)
    form.setFieldValue('latitude', location.lat)
    // 通知父组件值已变化
    onValuesChange?.(
      { address: location.address, longitude: location.lng, latitude: location.lat },
      form.getFieldsValue()
    )
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
          {/* 详细地址 - 带定位按钮 */}
          <Form.Item label="详细地址" name="address" rules={[{ required: true }]}>
            <Input
              size="large"
              placeholder="请输入详细地址"
              disabled={disabled}
              suffix={
                <Button
                  type="link"
                  size="small"
                  icon={<LocateFixed size={16} />}
                  onClick={() => !disabled && setLocationPickerOpen(true)}
                  style={{ color: '#c58e53', padding: '0 4px' }}
                >
                  选择位置
                </Button>
              }
            />
          </Form.Item>

          {/* 隐藏字段存储坐标 */}
          <Form.Item name="longitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="latitude" hidden>
            <Input />
          </Form.Item>

          {/* 地图预览区域 */}
          <div style={{ marginBottom: 18 }}>
            <MapPreview
              address={addressValue}
              lng={lngValue}
              lat={latValue}
              disabled={disabled}
              showLocateButton={!disabled}
              onLocate={handleLocateFromPreview}
            />
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
        defaultAddress={addressValue}
        defaultLng={lngValue}
        defaultLat={latValue}
      />
    </>
  )
}

export default BasicInfoForm

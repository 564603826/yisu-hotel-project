import { useState, useCallback } from 'react'
import { Modal, Form, Input, InputNumber, Space, Image, Typography, Button } from 'antd'
import type { HotelWithCreator } from '@/types'

const { Text } = Typography

interface BannerModalProps {
  open: boolean
  hotel: HotelWithCreator | null
  onCancel: () => void
  onSubmit: (values: {
    isBanner: boolean
    bannerSort: number
    bannerTitle: string
    bannerDesc: string
  }) => void
  loading?: boolean
}

const BannerModal = ({ open, hotel, onCancel, onSubmit, loading }: BannerModalProps) => {
  const [form] = Form.useForm()
  const [imageError, setImageError] = useState(false)

  // 模态框打开时初始化表单值
  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && hotel) {
        setImageError(false)
        form.setFieldsValue({
          bannerSort: hotel.bannerSort || 1,
          bannerTitle: hotel.bannerTitle || hotel.nameZh,
          bannerDesc: hotel.bannerDesc || '',
        })
      }
    },
    [hotel, form]
  )

  const handleSubmit = async () => {
    const values = await form.validateFields()
    onSubmit({
      isBanner: true,
      bannerSort: values.bannerSort,
      bannerTitle: values.bannerTitle,
      bannerDesc: values.bannerDesc,
    })
  }

  const handleCancelBanner = () => {
    onSubmit({
      isBanner: false,
      bannerSort: 0,
      bannerTitle: '',
      bannerDesc: '',
    })
  }

  // 构建完整图片 URL
  const buildImageUrl = (url?: string): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    // 相对路径，添加后端地址
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  // 获取酒店封面图 - 使用列表返回的 image 字段
  const rawCoverImage = buildImageUrl(hotel?.image)
  // 如果图片加载失败，使用默认图片
  const coverImage =
    imageError || !rawCoverImage
      ? `https://picsum.photos/seed/${hotel?.id || 0}/80/60`
      : rawCoverImage

  return (
    <Modal
      title={hotel?.isBanner ? '编辑 Banner' : '设为 Banner'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={480}
      style={{ top: 60 }}
      okText="确认设置"
      cancelText="取消"
      afterOpenChange={handleAfterOpenChange}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          paddingRight: 4,
        },
      }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <Space>
          <CancelBtn />
          {hotel?.isBanner && (
            <Button onClick={handleCancelBanner} loading={loading} danger>
              取消 Banner
            </Button>
          )}
          <OkBtn />
        </Space>
      )}
    >
      {hotel && (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* 酒店信息展示 */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Space align="start">
              {coverImage && (
                <Image
                  src={coverImage}
                  alt={hotel.nameZh}
                  width={80}
                  height={60}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={false}
                  onError={() => setImageError(true)}
                />
              )}
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{hotel.nameZh}</div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {hotel.address}
                </Text>
              </div>
            </Space>
          </div>

          {/* Banner 标题 */}
          <Form.Item
            name="bannerTitle"
            label="Banner 标题"
            rules={[
              { required: true, message: '请输入Banner标题' },
              { max: 100, message: '标题最多100个字符' },
            ]}
            extra="默认使用酒店名称，可自定义"
          >
            <Input placeholder="请输入Banner标题" maxLength={100} showCount />
          </Form.Item>

          {/* Banner 描述 */}
          <Form.Item
            name="bannerDesc"
            label="描述/副标题"
            rules={[{ max: 200, message: '描述最多200个字符' }]}
            extra="可选，用于展示促销信息或卖点"
          >
            <Input.TextArea placeholder="例如：限时特惠 8折起" maxLength={200} showCount rows={2} />
          </Form.Item>

          {/* 排序位置 - 窄输入框 */}
          <Form.Item
            name="bannerSort"
            label="排序位置"
            rules={[{ required: true, message: '请输入排序位置' }]}
            extra="数字越小越靠前"
            style={{ marginBottom: 8 }}
          >
            <InputNumber min={1} max={10} style={{ width: 100 }} placeholder="1-10" />
          </Form.Item>

          {/* 预览 */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>预览效果</div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 140,
                borderRadius: 8,
                overflow: 'hidden',
                background: coverImage ? undefined : '#e0e0e0',
              }}
            >
              {coverImage ? (
                <>
                  <img
                    src={coverImage}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '20px 16px 16px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      color: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                      {form.getFieldValue('bannerTitle') || hotel.nameZh}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      {form.getFieldValue('bannerDesc') || '暂无描述'}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#999',
                  }}
                >
                  暂无图片
                </div>
              )}
            </div>
          </div>
        </Form>
      )}
    </Modal>
  )
}

export default BannerModal

import React from 'react'
import { Modal, Descriptions, Tag, Image, Row, Col, Rate, Divider, Alert } from 'antd'
import { MapPin, Train, ShoppingBag, Calendar, DollarSign, FileEdit } from 'lucide-react'
import type { Hotel } from '@/types'
import '@/components/AdminList/index.scss'

interface HotelDetailModalProps {
  open: boolean
  hotel: Hotel | null
  onClose: () => void
  loading?: boolean
}

const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  open,
  hotel,
  onClose,
  loading = false,
}) => {
  if (!hotel) return null

  // 审核中状态且有草稿数据：展示草稿数据（最新修改）
  const displayHotel =
    hotel.status === 'pending' && hotel.draftData ? { ...hotel, ...hotel.draftData } : hotel

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'gold', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
    draft: { color: 'default', text: '草稿' },
    published: { color: 'blue', text: '已发布' },
    offline: { color: 'default', text: '已下线' },
  }

  const status = statusMap[hotel.status] || { color: 'default', text: hotel.status }

  // 构建图片 URL
  const getImageUrl = (url: string) => {
    return url.startsWith('http') ? url : `${import.meta.env.VITE_BACKEND_URL}${url}`
  }

  return (
    <Modal
      title="酒店详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ maxHeight: '85vh' }}
      styles={{
        body: {
          maxHeight: 'calc(85vh - 110px)',
          overflow: 'auto',
          paddingRight: 8,
        },
      }}
      loading={loading}
    >
      <div className="hotel-detail-modal">
        {/* 审核中提示 */}
        {hotel.status === 'pending' && hotel.draftData && (
          <Alert
            message="待审核版本"
            description="当前展示的是商户提交的最新修改版本，审核通过后将替换线上版本。"
            type="info"
            showIcon
            icon={<FileEdit size={16} />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 基本信息 */}
        <Descriptions title="基本信息" column={2} bordered>
          <Descriptions.Item label="酒店中文名">{displayHotel.nameZh || '-'}</Descriptions.Item>
          <Descriptions.Item label="酒店英文名">{displayHotel.nameEn || '-'}</Descriptions.Item>
          <Descriptions.Item label="酒店星级">
            <Rate value={displayHotel.starRating} disabled style={{ color: '#c58e53' }} />
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="参考价格" span={2}>
            <span style={{ color: '#c58e53', fontSize: 18, fontWeight: 'bold' }}>
              ¥{displayHotel.price}
            </span>
            <span style={{ color: '#999', marginLeft: 4 }}>起</span>
          </Descriptions.Item>
          <Descriptions.Item label="详细地址" span={2}>
            <MapPin size={14} style={{ marginRight: 4, color: '#c58e53' }} />
            {displayHotel.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开业时间" span={2}>
            <Calendar size={14} style={{ marginRight: 4, color: '#c58e53' }} />
            {displayHotel.openDate || '-'}
          </Descriptions.Item>
          {hotel.rejectReason && (
            <Descriptions.Item label="驳回原因" span={2}>
              <span style={{ color: '#dc2626' }}>{hotel.rejectReason}</span>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        {/* 房型信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12 }}>房型信息</h4>
          {displayHotel.roomTypes && displayHotel.roomTypes.length > 0 ? (
            <Row gutter={[16, 16]}>
              {displayHotel.roomTypes.map((room, index) => (
                <Col span={12} key={index}>
                  <div
                    style={{
                      padding: 16,
                      background: '#fafaf9',
                      borderRadius: 8,
                      border: '1px solid #e7e5e4',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{room.name}</div>
                    <div style={{ color: '#c58e53', fontSize: 16, marginBottom: 8 }}>
                      <DollarSign size={14} style={{ verticalAlign: 'middle' }} />¥{room.price}
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>/晚</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      面积: {room.area ? `${room.area}㎡` : '未设置'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      床型: {room.bedType || '未设置'}
                    </div>
                    {room.facilities && room.facilities.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {room.facilities.map((facility, idx) => (
                          <Tag key={idx} style={{ margin: '0 4px 4px 0' }}>
                            {facility}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ color: '#999' }}>暂无房型信息</div>
          )}
        </div>

        <Divider />

        {/* 周边信息 */}
        <Descriptions title="周边信息" column={1} bordered>
          <Descriptions.Item label="附近景点">
            <MapPin size={14} style={{ marginRight: 4, color: '#c58e53' }} />
            {displayHotel.nearbyAttractions || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="附近交通">
            <Train size={14} style={{ marginRight: 4, color: '#c58e53' }} />
            {displayHotel.nearbyTransport || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="附近商圈">
            <ShoppingBag size={14} style={{ marginRight: 4, color: '#c58e53' }} />
            {displayHotel.nearbyMalls || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 酒店图片 */}
        {displayHotel.images && displayHotel.images.length > 0 && (
          <div>
            <h4 style={{ marginBottom: 12 }}>酒店图片</h4>
            <Image.PreviewGroup>
              <Row gutter={[8, 8]}>
                {displayHotel.images.map((img, index) => (
                  <Col key={index}>
                    <Image
                      src={getImageUrl(img)}
                      alt={`酒店图片 ${index + 1}`}
                      width={120}
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>
          </div>
        )}

        {/* 酒店描述 */}
        {displayHotel.description && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>酒店描述</h4>
              <div style={{ color: '#57534e', lineHeight: 1.8 }}>{displayHotel.description}</div>
            </div>
          </>
        )}

        {/* 优惠信息 */}
        {displayHotel.discounts && displayHotel.discounts.length > 0 && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>优惠活动</h4>
              <Row gutter={[16, 16]}>
                {displayHotel.discounts.map((discount, index) => (
                  <Col span={12} key={index}>
                    <div
                      style={{
                        padding: 12,
                        background: '#fef3c7',
                        borderRadius: 8,
                        border: '1px solid #fcd34d',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: 4 }}>
                        {discount.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#78350f' }}>
                        {discount.type === 'percentage'
                          ? `${discount.value}折`
                          : `减¥${discount.value}`}
                        {discount.description && ` · ${discount.description}`}
                      </div>
                      {discount.startDate && discount.endDate && (
                        <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>
                          有效期: {discount.startDate} 至 {discount.endDate}
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default HotelDetailModal

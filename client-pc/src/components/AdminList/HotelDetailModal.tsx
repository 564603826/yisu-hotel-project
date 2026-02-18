import React from 'react'
import { Modal, Descriptions, Tag, Image, Row, Col, Rate, Divider, Alert } from 'antd'
import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { MapPin, Train, ShoppingBag, Calendar } from 'lucide-react'
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

  // 审核中或已驳回状态且有草稿数据：展示草稿数据（被审核/被驳回的版本）
  const displayHotel =
    (hotel.status === 'pending' || hotel.status === 'rejected') && hotel.draftData
      ? { ...hotel, ...hotel.draftData }
      : hotel

  const statusMap: Record<string, { bgColor: string; textColor: string; text: string }> = {
    pending: { bgColor: '#fef3c7', textColor: '#d97706', text: '待审核' },
    approved: { bgColor: '#dbeafe', textColor: '#2563eb', text: '已通过' },
    rejected: { bgColor: '#fee2e2', textColor: '#dc2626', text: '已驳回' },
    draft: { bgColor: '#f5f5f4', textColor: '#78716c', text: '草稿' },
    published: { bgColor: '#dcfce7', textColor: '#16a34a', text: '已发布' },
    offline: { bgColor: '#f5f5f4', textColor: '#78716c', text: '已下线' },
  }

  const status = statusMap[hotel.status] || {
    bgColor: '#f5f5f4',
    textColor: '#78716c',
    text: hotel.status,
  }

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
            title="待审核版本"
            description="当前展示的是商户提交的最新修改版本，审核通过并发布后将替换线上版本。"
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 已驳回提示 */}
        {hotel.status === 'rejected' && hotel.draftData && (
          <Alert
            title="被驳回的版本"
            description="当前展示的是被驳回时的修改版本，商户可基于此版本继续修改后重新提交。"
            type="warning"
            showIcon
            icon={<CloseCircleOutlined />}
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
            <Tag
              style={{
                backgroundColor: status.bgColor,
                color: status.textColor,
                border: 'none',
                borderRadius: 12,
                padding: '2px 12px',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {status.text}
            </Tag>
          </Descriptions.Item>
          {/* 审核信息 - 只在待审核状态显示 */}
          {hotel.status === 'pending' && hotel.auditInfo && (
            <Descriptions.Item label="审核信息" span={2}>
              <div style={{ color: '#666', lineHeight: 1.6 }}>{hotel.auditInfo}</div>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="参考价格" span={2}>
            <span style={{ color: '#c58e53', fontSize: 18, fontWeight: 'bold' }}>
              ¥{displayHotel.price}
            </span>
            <span style={{ color: '#999', marginLeft: 4 }}>起</span>
          </Descriptions.Item>
          <Descriptions.Item label="详细地址" span={2}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <MapPin size={14} style={{ marginRight: 4, color: '#c58e53' }} />
              {displayHotel.address || '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="开业时间" span={2}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Calendar size={14} style={{ marginRight: 4, color: '#c58e53' }} />
              {displayHotel.openDate ? displayHotel.openDate.split('T')[0] : '-'}
            </span>
          </Descriptions.Item>
          {/* 只在已驳回状态下显示驳回原因 */}
          {hotel.status === 'rejected' && hotel.rejectReason && (
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
                    <Row gutter={[12, 0]}>
                      {/* 左侧图片区域 */}
                      {room.images && room.images.length > 0 && (
                        <Col span={10}>
                          <Image.PreviewGroup>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: room.images.length > 1 ? '1fr 1fr' : '1fr',
                                gap: 6,
                              }}
                            >
                              {room.images.slice(0, 4).map((imgUrl, imgIndex) => (
                                <Image
                                  key={imgIndex}
                                  src={getImageUrl(imgUrl)}
                                  alt={`${room.name} 图片 ${imgIndex + 1}`}
                                  style={{
                                    width: '100%',
                                    height: room.images?.length === 1 ? 140 : 67,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                  }}
                                  fallback="https://via.placeholder.com/100x80?text=No+Image"
                                  preview={{ mask: '查看' }}
                                />
                              ))}
                            </div>
                          </Image.PreviewGroup>
                        </Col>
                      )}
                      {/* 右侧信息区域 */}
                      <Col span={room.images && room.images.length > 0 ? 14 : 24}>
                        <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 10 }}>
                          {room.name}
                        </div>
                        <div style={{ color: '#c58e53', fontSize: 18, marginBottom: 10 }}>
                          ¥{room.price}
                          <span style={{ color: '#999', fontSize: 13, marginLeft: 4 }}>/晚</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                          面积: {room.area ? `${room.area}㎡` : '未设置'}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                          床型: {room.bedType || '未设置'}
                        </div>
                        {room.facilities && room.facilities.length > 0 && (
                          <div>
                            {room.facilities.slice(0, 4).map((facility, idx) => (
                              <Tag key={idx} style={{ margin: '0 4px 4px 0', fontSize: 11 }}>
                                {facility}
                              </Tag>
                            ))}
                            {room.facilities.length > 4 && (
                              <Tag style={{ fontSize: 11 }}>+{room.facilities.length - 4}</Tag>
                            )}
                          </div>
                        )}
                      </Col>
                    </Row>
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
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <MapPin size={14} style={{ marginRight: 4, color: '#c58e53' }} />
              {displayHotel.nearbyAttractions || '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="附近交通">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Train size={14} style={{ marginRight: 4, color: '#c58e53' }} />
              {displayHotel.nearbyTransport || '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="附近商圈">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={14} style={{ marginRight: 4, color: '#c58e53' }} />
              {displayHotel.nearbyMalls || '-'}
            </span>
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

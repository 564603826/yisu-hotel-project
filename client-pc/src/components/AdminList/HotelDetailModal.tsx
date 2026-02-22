import React, { useState } from 'react'
import {
  Modal,
  Descriptions,
  Tag,
  Image,
  Row,
  Col,
  Rate,
  Divider,
  Alert,
  Carousel,
  Button,
} from 'antd'
import { ClockCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { MapPin, Train, ShoppingBag, Calendar, Building2 } from 'lucide-react'
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
  const [showPublishedVersion, setShowPublishedVersion] = useState(false)

  if (!hotel) return null

  // 判断是否可以切换版本（审核中或已驳回状态且有草稿数据）
  const canSwitchVersion =
    (hotel.status === 'pending' || hotel.status === 'rejected') && hotel.draftData

  // 根据切换状态决定展示哪个版本
  const displayHotel =
    canSwitchVersion && showPublishedVersion
      ? hotel // 显示上线版本
      : canSwitchVersion && !showPublishedVersion
        ? { ...hotel, ...hotel.draftData } // 显示审核版本
        : hotel

  // 根据切换状态决定使用哪种图片和房型
  const displayImages =
    canSwitchVersion && showPublishedVersion
      ? hotel._publishedImages || hotel.images || []
      : canSwitchVersion && !showPublishedVersion
        ? hotel._draftImages || hotel.images || []
        : hotel.images || []

  // 根据切换状态决定使用哪种房型数据
  const displayRoomTypes =
    canSwitchVersion && showPublishedVersion
      ? hotel._publishedRoomTypes || hotel.roomTypes || []
      : canSwitchVersion && !showPublishedVersion
        ? hotel._draftRoomTypes || hotel.roomTypes || []
        : hotel.roomTypes || []

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
    if (url.startsWith('http')) return url
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://112.124.2.205'
    // 确保路径以 / 开头
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendUrl}${path}`
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
          overflow: 'hidden',
          padding: 0,
        },
      }}
      loading={loading}
    >
      <div
        className="hotel-detail-modal"
        style={{ display: 'flex', flexDirection: 'column', height: 'calc(85vh - 110px)' }}
      >
        {/* 版本切换提示 - 固定在顶部 */}
        {canSwitchVersion && (
          <Alert
            title={
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {showPublishedVersion
                    ? '当前展示：上线版本'
                    : hotel.status === 'pending'
                      ? '当前展示：待审核版本'
                      : '当前展示：被驳回版本'}
                </span>
                <Button
                  type="primary"
                  size="small"
                  icon={showPublishedVersion ? <ClockCircleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowPublishedVersion(!showPublishedVersion)}
                >
                  {showPublishedVersion ? '查看审核版本' : '查看上线版本'}
                </Button>
              </div>
            }
            description={
              showPublishedVersion
                ? '这是当前正在线上展示的版本，审核通过后将替换此版本。'
                : hotel.status === 'pending'
                  ? '这是商户提交的最新修改版本，审核通过并发布后将替换线上版本。'
                  : '这是被驳回时的修改版本，商户可基于此版本继续修改后重新提交。'
            }
            type={
              showPublishedVersion ? 'success' : hotel.status === 'pending' ? 'info' : 'warning'
            }
            showIcon
            icon={
              showPublishedVersion ? (
                <EyeOutlined />
              ) : hotel.status === 'pending' ? (
                <ClockCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              )
            }
            style={{ margin: '16px 16px 0 16px', flexShrink: 0 }}
          />
        )}

        {/* 可滚动内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
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
            {displayRoomTypes && displayRoomTypes.length > 0 ? (
              <Row gutter={[16, 16]}>
                {displayRoomTypes.map((room, index) => (
                  <Col span={12} key={index}>
                    <div
                      style={{
                        padding: 16,
                        background: '#fff',
                        borderRadius: 12,
                        border: '1px solid #e7e5e4',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.3s ease',
                        height: 150, // 固定卡片高度
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Row gutter={[16, 0]} style={{ flex: 1 }}>
                        {/* 左侧图片轮播区域 */}
                        {room.images && room.images.length > 0 && (
                          <Col span={10} style={{ height: '100%' }}>
                            <div style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                              <Image.PreviewGroup
                                items={room.images.map((imgUrl) => ({
                                  src: getImageUrl(imgUrl),
                                }))}
                              >
                                <Carousel
                                  arrows
                                  infinite={false}
                                  style={{ background: '#f5f5f4', height: '100%' }}
                                >
                                  {room.images.map((imgUrl, imgIndex) => (
                                    <div key={imgIndex} style={{ height: 120 }}>
                                      <Image
                                        src={getImageUrl(imgUrl)}
                                        alt={`${room.name} 图片 ${imgIndex + 1}`}
                                        style={{
                                          width: '100%',
                                          height: 120,
                                          objectFit: 'cover',
                                        }}
                                        fallback="https://via.placeholder.com/200x168?text=No+Image"
                                        preview={{ mask: '查看' }}
                                      />
                                    </div>
                                  ))}
                                </Carousel>
                              </Image.PreviewGroup>
                            </div>
                          </Col>
                        )}
                        {/* 右侧信息区域 */}
                        <Col
                          span={room.images && room.images.length > 0 ? 14 : 24}
                          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 18,
                              marginBottom: 6,
                              color: '#292524',
                              lineHeight: 1.3,
                            }}
                          >
                            {room.name}
                          </div>
                          <div
                            style={{
                              color: '#c58e53',
                              fontSize: 18,
                              marginBottom: 6,
                              fontWeight: 600,
                              lineHeight: 1.3,
                            }}
                          >
                            ¥{room.price}
                            <span
                              style={{
                                color: '#a8a29e',
                                fontSize: 14,
                                marginLeft: 3,
                                fontWeight: 500,
                              }}
                            >
                              /晚
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              marginBottom: 4,
                              fontSize: 14,
                              color: '#78716c',
                              lineHeight: 1.3,
                            }}
                          >
                            <div>
                              <span style={{ color: '#a8a29e' }}>面积:</span>{' '}
                              {room.area ? `${room.area}㎡` : '未设置'}
                            </div>
                            <div>
                              <span style={{ color: '#a8a29e' }}>床型:</span>{' '}
                              {room.bedType || '未设置'}
                            </div>
                          </div>
                          {room.facilities && room.facilities.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'nowrap',
                                gap: '4px 6px',
                                overflowX: 'auto',
                                paddingBottom: 8, // 预留滚动条空间
                                marginTop: 4,
                                minHeight: 28, // 确保有空间显示设施
                              }}
                            >
                              {room.facilities.map((facility, idx) => (
                                <Tag
                                  key={idx}
                                  style={{
                                    margin: 0,
                                    fontSize: 11,
                                    padding: '1px 8px',
                                    borderRadius: 4,
                                    background: '#f5f5f4',
                                    border: 'none',
                                    color: '#57534e',
                                    flexShrink: 0,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {facility}
                                </Tag>
                              ))}
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
            <Descriptions.Item label="酒店设施">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Building2 size={14} style={{ marginRight: 4, color: '#c58e53' }} />
                {displayHotel.facilities && displayHotel.facilities.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {displayHotel.facilities.map((facility, index) => (
                      <Tag
                        key={index}
                        style={{
                          margin: 0,
                          padding: '4px 12px',
                          borderRadius: 6,
                          background: '#f5f5f4',
                          border: '1px solid #e7e5e4',
                          color: '#57534e',
                          fontSize: 13,
                        }}
                      >
                        {facility}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* 酒店图片 */}
          {displayImages && displayImages.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 12 }}>酒店图片</h4>
              <Image.PreviewGroup>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 12,
                  }}
                >
                  {displayImages.map((img, index) => (
                    <Image
                      key={index}
                      src={getImageUrl(img)}
                      alt={`酒店图片 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                      fallback="https://via.placeholder.com/150x100?text=No+Image"
                      preview={{ mask: '查看' }}
                    />
                  ))}
                </div>
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
      </div>
    </Modal>
  )
}

export default HotelDetailModal

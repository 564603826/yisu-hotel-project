import React from 'react'
import { Button, Space, Tag, Image } from 'antd'
import { Info, Trash2, BedDouble, Maximize, Eye } from 'lucide-react'
import '@/components/MerchantForm/index.scss'
import type { RoomType } from '@/types'
import type { ImageItem } from './MultiImageUpload'

// 扩展 RoomType 支持 ImageItem
interface RoomTypeWithImageItems extends Omit<RoomType, 'images'> {
  images?: (string | ImageItem)[]
}

interface RoomItemProps extends RoomTypeWithImageItems {
  index: number
  onEdit?: (index: number) => void
  onDelete?: (index: number) => void
  disabled?: boolean
  viewMode?: boolean // 查看模式（只显示查看按钮，不禁用）
}

const RoomItem: React.FC<RoomItemProps> = ({
  index,
  name,
  price,
  area,
  bedType,
  facilities,
  images,
  onEdit,
  onDelete,
  disabled,
  viewMode,
}) => {
  // 生成描述文本
  const descriptionParts: string[] = []
  if (area) descriptionParts.push(`${area}m²`)
  if (bedType) descriptionParts.push(bedType)

  // 获取图片URL（处理相对路径、blob URL 和 ImageItem）
  const getImageUrl = (img: string | ImageItem | undefined) => {
    if (!img) return ''
    const url = typeof img === 'string' ? img : img.url
    if (!url) return ''
    // blob URL 直接返回
    if (url.startsWith('blob:')) return url
    // 完整 http URL 直接返回
    if (url.startsWith('http')) return url
    // 相对路径添加后端前缀
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    return `${backendUrl}${url}`
  }

  // 处理所有图片URL
  const imageUrls = images?.map((img) => getImageUrl(img)).filter(Boolean) || []
  const coverImage = imageUrls.length > 0 ? imageUrls[0] : null

  // 构建预览图片列表
  const previewImages = imageUrls.map((url, idx) => ({
    src: url,
    alt: `${name} 图片 ${idx + 1}`,
  }))

  return (
    <div className="room-item">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
        {/* 房型图片或图标 */}
        {coverImage ? (
          <div className="room-image-preview">
            <Image.PreviewGroup items={previewImages}>
              <Image
                src={coverImage}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                preview={{ mask: '查看' }}
              />
            </Image.PreviewGroup>
            {images && images.length > 1 && (
              <div className="room-image-count">+{images.length - 1}</div>
            )}
          </div>
        ) : (
          <div className="room-icon">
            <BedDouble size={24} />
          </div>
        )}

        <div style={{ flex: 1 }}>
          {/* 房型名称 */}
          <div style={{ fontWeight: 'bold', fontSize: 16, color: '#292524' }}>{name}</div>

          {/* 房型信息 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 4,
              color: '#78716c',
              fontSize: 13,
            }}
          >
            {area && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Maximize size={14} />
                {area}m²
              </span>
            )}
            {bedType && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <BedDouble size={14} />
                {bedType}
              </span>
            )}
          </div>

          {/* 设施标签 */}
          {facilities && facilities.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {facilities.slice(0, 4).map((facility, idx) => (
                <Tag key={idx} style={{ fontSize: 11, borderRadius: 4 }}>
                  {facility}
                </Tag>
              ))}
              {facilities.length > 4 && (
                <Tag style={{ fontSize: 11, borderRadius: 4 }}>+{facilities.length - 4}</Tag>
              )}
            </div>
          )}

          {/* 价格 */}
          <div className="room-price" style={{ marginTop: 8 }}>
            ¥ {price.toLocaleString()}{' '}
            <span style={{ fontSize: 13, fontWeight: 'normal', color: '#a8a29e' }}>/ 晚</span>
          </div>
        </div>
      </div>

      <Space>
        {viewMode ? (
          // 查看模式：只显示查看按钮，可点击
          <Button
            icon={<Eye size={16} />}
            type="text"
            onClick={() => onEdit?.(index)}
            title="查看房型"
          />
        ) : (
          // 编辑模式：显示编辑和删除按钮
          <>
            <Button
              icon={<Info size={16} />}
              type="text"
              onClick={() => onEdit?.(index)}
              disabled={disabled}
              title="编辑房型"
            />
            <Button
              icon={<Trash2 size={16} />}
              type="text"
              danger
              onClick={() => onDelete?.(index)}
              disabled={disabled}
              title="删除房型"
            />
          </>
        )}
      </Space>
    </div>
  )
}

export default RoomItem

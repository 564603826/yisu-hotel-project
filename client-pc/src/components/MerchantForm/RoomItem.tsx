import React from 'react'
import { Button, Space, Tag } from 'antd'
import { Info, Trash2, BedDouble, Maximize } from 'lucide-react'
import '@/components/MerchantForm/index.scss'
import type { RoomType } from '@/types'

interface RoomItemProps extends RoomType {
  index: number
  onEdit?: (index: number) => void
  onDelete?: (index: number) => void
}

const RoomItem: React.FC<RoomItemProps> = ({
  index,
  name,
  price,
  area,
  bedType,
  facilities,
  onEdit,
  onDelete,
}) => {
  // 生成描述文本
  const descriptionParts: string[] = []
  if (area) descriptionParts.push(`${area}m²`)
  if (bedType) descriptionParts.push(bedType)

  return (
    <div className="room-item">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
        {/* 房型图标 */}
        <div className="room-icon">
          <BedDouble size={24} />
        </div>

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
        <Button icon={<Info size={16} />} type="text" onClick={() => onEdit?.(index)} />
        <Button icon={<Trash2 size={16} />} type="text" danger onClick={() => onDelete?.(index)} />
      </Space>
    </div>
  )
}

export default RoomItem

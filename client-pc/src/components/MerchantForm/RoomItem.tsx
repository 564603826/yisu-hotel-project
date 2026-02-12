import React from 'react'
import { Button, Space } from 'antd'
import { Plus, Info, Trash2 } from 'lucide-react'
import '@/components/MerchantForm/index.scss'

interface RoomItemProps {
  id: string
  name: string
  description: string
  price: number
  image: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const RoomItem: React.FC<RoomItemProps> = ({
  id,
  name,
  description,
  price,
  image,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="room-item">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <img src={image} className="room-img" alt="room" />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16, color: '#292524' }}>{name}</div>
          <div style={{ color: '#78716c', fontSize: 12, marginTop: 4 }}>{description}</div>
          <div className="room-price" style={{ marginTop: 4 }}>
            ¥ {price.toLocaleString()} / 晚
          </div>
        </div>
      </div>
      <Space>
        <Button icon={<Info size={16} />} type="text" onClick={() => onEdit?.(id)} />
        <Button icon={<Trash2 size={16} />} type="text" danger onClick={() => onDelete?.(id)} />
      </Space>
    </div>
  )
}

export default RoomItem

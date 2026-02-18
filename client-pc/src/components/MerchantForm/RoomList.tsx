import React from 'react'
import { Button, Typography, Spin } from 'antd'
import { Plus } from 'lucide-react'
import type { RoomType } from '@/types'
import type { ImageItem } from './MultiImageUpload'

const { Title } = Typography

// 扩展 RoomType 支持 ImageItem（用于本地编辑状态）
interface RoomTypeWithImageItems extends Omit<RoomType, 'images'> {
  images?: (string | ImageItem)[]
}

interface RoomListProps {
  rooms: Array<RoomTypeWithImageItems>
  onAddRoom?: () => void
  onEditRoom?: (index: number) => void
  onDeleteRoom?: (index: number) => void
  disabled?: boolean
  viewMode?: boolean
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  disabled,
  viewMode,
}) => {
  const RoomItem = React.lazy(() => import('./RoomItem'))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          房型列表
        </Title>
        <Button
          type="link"
          icon={<Plus size={16} />}
          style={{ color: '#c58e53', fontWeight: 'bold' }}
          onClick={onAddRoom}
        >
          添加新房型
        </Button>
      </div>

      {rooms.map((room, index) => (
        <React.Suspense
          key={index}
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '100px',
              }}
            >
              <Spin size="default" />
            </div>
          }
        >
          <RoomItem
            index={index}
            name={room.name}
            price={room.price}
            area={room.area}
            bedType={room.bedType}
            facilities={room.facilities}
            images={room.images}
            onEdit={onEditRoom}
            onDelete={onDeleteRoom}
            disabled={disabled}
            viewMode={viewMode}
          />
        </React.Suspense>
      ))}
    </div>
  )
}

export default RoomList

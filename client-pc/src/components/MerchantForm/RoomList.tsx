import React from 'react'
import { Button, Typography } from 'antd'
import { Plus } from 'lucide-react'

const { Title } = Typography

interface RoomListProps {
  rooms: Array<{
    id: string
    name: string
    description: string
    price: number
    image: string
  }>
  onAddRoom?: () => void
  onEditRoom?: (id: string) => void
  onDeleteRoom?: (id: string) => void
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onAddRoom, onEditRoom, onDeleteRoom }) => {
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

      {rooms.map((room) => (
        <React.Suspense key={room.id} fallback={<div>加载中...</div>}>
          <RoomItem
            id={room.id}
            name={room.name}
            description={room.description}
            price={room.price}
            image={room.image}
            onEdit={onEditRoom}
            onDelete={onDeleteRoom}
          />
        </React.Suspense>
      ))}
    </div>
  )
}

export default RoomList

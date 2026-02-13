import React, { useState } from 'react'
import '@/components/AdminList/index.scss'

interface HotelInfoCellProps {
  id: string
  hotelName: string
  submitter: string
  imageUrl?: string
  onClick?: () => void
}

const HotelInfoCell: React.FC<HotelInfoCellProps> = ({
  id,
  hotelName,
  submitter,
  imageUrl,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false)

  // 构建图片 URL
  const buildImageUrl = (url?: string): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    // 相对路径，添加后端地址
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const displayImageUrl = buildImageUrl(imageUrl)

  // 如果图片加载失败或没有图片，使用默认图片
  const finalImageUrl =
    imageError || !displayImageUrl ? `https://picsum.photos/seed/${id}/100` : displayImageUrl

  return (
    <div
      className="hotel-info-cell"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        className="thumb"
        src={finalImageUrl}
        alt={hotelName}
        onError={() => setImageError(true)}
      />
      <div>
        <div className="name">{hotelName}</div>
        <div className="sub">提交人: {submitter}</div>
      </div>
    </div>
  )
}

export default HotelInfoCell

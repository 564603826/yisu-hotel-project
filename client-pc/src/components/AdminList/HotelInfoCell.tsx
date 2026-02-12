import React from 'react'
import '@/components/AdminList/index.scss'

interface HotelInfoCellProps {
  id: string
  hotelName: string
  submitter: string
}

const HotelInfoCell: React.FC<HotelInfoCellProps> = ({ id, hotelName, submitter }) => {
  return (
    <div className="hotel-info-cell">
      <div
        className="thumb"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${id}/100)` }}
      />
      <div>
        <div className="name">{hotelName}</div>
        <div className="sub">提交人: {submitter}</div>
      </div>
    </div>
  )
}

export default HotelInfoCell

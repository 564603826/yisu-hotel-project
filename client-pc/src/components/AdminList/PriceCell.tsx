import React from 'react'
import '@/components/AdminList/index.scss'

interface PriceCellProps {
  location: string
  price: number
}

const PriceCell: React.FC<PriceCellProps> = ({ location, price }) => {
  return (
    <div className="price-cell">
      <div className="location">{location}</div>
      <div className="price">
        ¥{price}
        <span className="unit">起</span>
      </div>
    </div>
  )
}

export default PriceCell

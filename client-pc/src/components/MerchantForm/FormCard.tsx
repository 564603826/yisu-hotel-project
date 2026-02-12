import React from 'react'
import '@/components/MerchantForm/index.scss'

interface FormCardProps {
  children: React.ReactNode
}

const FormCard: React.FC<FormCardProps> = ({ children }) => {
  return <div className="form-card">{children}</div>
}

export default FormCard

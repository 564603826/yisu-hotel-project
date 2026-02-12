import React from 'react'
import { Upload } from 'lucide-react'
import '@/components/MerchantForm/index.scss'

interface UploadAreaProps {
  onUpload?: (file: File) => void
}

const UploadArea: React.FC<UploadAreaProps> = ({ onUpload }) => {
  return (
    <div className="upload-area">
      <div className="upload-content">
        <Upload size={32} />
        <span className="upload-title">点击上传或拖拽图片至此</span>
        <span className="upload-hint">支持 JPG, PNG (Max 5MB)</span>
      </div>
    </div>
  )
}

export default UploadArea

import React, { useState, useRef, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { message } from 'antd'
import '@/components/MerchantForm/index.scss'

interface UploadAreaProps {
  value?: string
  onChange?: (url: string) => void
  pendingFile?: File | null
  onPendingFileChange?: (file: File | null) => void
  disabled?: boolean
}

const UploadArea: React.FC<UploadAreaProps> = ({
  value,
  onChange,
  onPendingFileChange,
  disabled = false,
}) => {
  const [localPreview, setLocalPreview] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 清理本地预览 URL
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 文件类型校验
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      message.error('仅支持 jpeg, jpg, png, gif, webp 格式的图片')
      return
    }

    // 文件大小校验 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      message.error('图片大小不能超过 5MB')
      return
    }

    // 清理之前的本地预览
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
    }

    // 生成本地预览 URL
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)

    // 通知父组件有待上传的文件
    onPendingFileChange?.(file)
    // 清空表单中的 URL 值（因为现在使用本地文件）
    onChange?.('')

    // 清空 input 值，允许重复选择同一文件
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    // 清理本地预览
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview('')
    }
    onPendingFileChange?.(null)
    onChange?.('')
  }

  // 确定显示的 URL
  // 优先显示本地预览，其次显示已上传的图片
  const displayUrl =
    localPreview ||
    (value
      ? value.startsWith('http')
        ? value
        : `${import.meta.env.VITE_BACKEND_URL}${value}`
      : '')

  // 如果有图片，显示预览
  if (displayUrl) {
    return (
      <div
        className="upload-preview"
        onClick={handleClick}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <img src={displayUrl} alt="封面图" />
        {!disabled && (
          <div className="upload-preview-overlay">
            <span>点击更换图片</span>
            <button className="upload-remove-btn" onClick={handleRemove} title="删除图片">
              <X size={16} />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div
      className="upload-area"
      onClick={handleClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      <div className="upload-content">
        <Upload size={32} />
        <span className="upload-title">点击上传或拖拽图片至此</span>
        <span className="upload-hint">支持 JPG, PNG (Max 5MB)</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  )
}

export default UploadArea

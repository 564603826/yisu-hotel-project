import React, { useRef } from 'react'
import { X, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { message, Image } from 'antd'
import '@/components/MerchantForm/index.scss'

export interface ImageItem {
  url: string
  uid?: string
  status?: 'pending' | 'done' | 'error' // pending = 本地待上传
  name?: string
  file?: File // 本地文件对象（待上传）
  isNew?: boolean // 标记是否为新上传的
  isDeleted?: boolean // 标记是否已删除
}

interface MultiImageUploadProps {
  value?: ImageItem[]
  onChange?: (images: ImageItem[]) => void
  maxCount?: number
  disabled?: boolean
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 10,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // 确保 value 是数组
  const safeValue = Array.isArray(value) ? value : []

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 检查是否超过最大数量
    if (safeValue.length + files.length > maxCount) {
      message.error(`最多只能上传 ${maxCount} 张图片`)
      return
    }

    // 文件校验
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        message.error(`${file.name} 格式不支持，仅支持 jpeg, jpg, png, gif, webp`)
        return
      }
      if (file.size > maxSize) {
        message.error(`${file.name} 超过 5MB 限制`)
        return
      }
    }

    // 创建本地预览（不立即上传）
    const newImages: ImageItem[] = files.map((file) => ({
      url: URL.createObjectURL(file),
      uid: `${Date.now()}-${Math.random()}`,
      status: 'pending',
      name: file.name,
      file: file,
      isNew: true,
    }))

    // 添加到列表
    const updatedImages = [...safeValue, ...newImages]
    onChange?.(updatedImages)

    // 清空 input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    if (disabled) return

    const newImages = [...safeValue]
    const removed = newImages.splice(index, 1)[0]

    // 释放本地预览 URL
    if (removed?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url)
    }

    onChange?.(newImages)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (disabled) return
    const newImages = [...safeValue]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newImages.length) return // 交换位置
    ;[newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
    onChange?.(newImages)
  }

  const getImageUrl = (url: string | undefined) => {
    if (!url) return ''
    // 本地 blob URL 直接返回
    if (url.startsWith('blob:')) return url
    // 完整 URL 直接返回
    if (url.startsWith('http')) return url
    // 相对路径添加服务器前缀
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://112.124.2.205'
    // 确保路径以 / 开头
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendUrl}${path}`
  }

  // 构建预览图片列表
  const previewImages = safeValue.map((image) => ({
    src: getImageUrl(image?.url),
    alt: image?.name || '图片',
  }))

  return (
    <div className="multi-image-upload">
      <Image.PreviewGroup items={previewImages}>
        <div className="image-list">
          {safeValue.map((image, index) => {
            const imageUrl = getImageUrl(image?.url)
            const isPending = image?.status === 'pending'
            return (
              <div
                key={image?.uid || image?.url || index}
                className={`image-item ${isPending ? 'pending' : ''}`}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={image?.name || `图片${index + 1}`}
                    preview={{ mask: '查看' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback="https://via.placeholder.com/120x120?text=No+Image"
                  />
                ) : (
                  <div className="image-placeholder">加载中...</div>
                )}

                {/* 操作按钮 - 预览通过Image组件自带功能，其他操作在启用状态下可用 */}
                <div className="image-actions">
                  {!disabled && (
                    <>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMove(index, 'up')
                        }}
                        disabled={index === 0}
                        title="前移"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMove(index, 'down')
                        }}
                        disabled={index === safeValue.length - 1}
                        title="后移"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </>
                  )}
                  {!disabled && (
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(index)
                      }}
                      title="删除"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 待上传标记 */}
                {isPending && <div className="pending-mask">待保存</div>}

                {/* 序号标记 */}
                <div className="image-index">{index + 1}</div>
              </div>
            )
          })}

          {/* 上传按钮 */}
          {safeValue.length < maxCount && !disabled && (
            <div className="upload-button" onClick={handleClick}>
              <Plus size={24} />
              <span>上传图片</span>
            </div>
          )}
        </div>
      </Image.PreviewGroup>

      {/* 提示信息 */}
      <div className="upload-hint-text">
        共 {safeValue.length} 张图片，最多 {maxCount} 张
        {safeValue.some((img) => img.status === 'pending') && '（有未保存的图片）'}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  )
}

export default MultiImageUpload

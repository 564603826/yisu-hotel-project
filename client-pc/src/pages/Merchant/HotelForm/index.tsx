import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Form, Button, Space, message, Modal, Tag, Alert, Input } from 'antd'
import {
  Save,
  Undo2,
  Loader2,
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import styles from './MerchantHotelForm.module.scss'
import dayjs from 'dayjs'
import CustomTabs from '@/components/MerchantForm/CustomTabs'
import FormCard from '@/components/MerchantForm/FormCard'
import BasicInfoForm from '@/components/MerchantForm/BasicInfoForm'
import RoomList from '@/components/MerchantForm/RoomList'
import RoomModal from '@/components/MerchantForm/RoomModal'
import MarketingForm from '@/components/MerchantForm/MarketingForm'
import { useMerchantStore, useUserStore } from '@/store'
import { type RoomType } from '@/types'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import hotelImageApi from '@/api/hotel-image'
import uploadApi from '@/api/upload-image'
import type { ImageItem } from '@/components/MerchantForm/MultiImageUpload'

// 扩展 RoomType 支持 ImageItem（用于本地编辑状态）
interface RoomTypeWithImageItems extends Omit<RoomType, 'images'> {
  images?: (string | ImageItem)[]
}

// 判断是否为已发布/已下线状态（有版本控制）
const hasVersionControl = (status: string) => {
  return status === 'published' || status === 'offline'
}

const MerchantHotelForm: React.FC = () => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')
  // 保存所有表单字段值（跨 tab）
  const [allFormValues, setAllFormValues] = useState<any>({})
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  // 本地图片列表（包含文件对象）
  // 使用 null 作为初始值，用于区分"初始状态"和"用户删除了所有图片"
  const [localImages, setLocalImages] = useState<ImageItem[] | null>(null)
  // 版本控制：是否查看当前线上版本（已发布/已下线酒店）
  const [viewingPublishedVersion, setViewingPublishedVersion] = useState(false)
  // 查看驳回原因弹窗
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false)
  // 提交审核弹窗
  const [submitAuditModalOpen, setSubmitAuditModalOpen] = useState(false)
  const [auditInfoInput, setAuditInfoInput] = useState('')
  // 自动刷新相关状态
  const [loading, setLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  // 刚刚保存成功的标志，用于跳过草稿检查
  const justSavedRef = useRef(false)
  // 是否禁用草稿保存（保存后表单重新初始化时使用）
  const disableDraftSaveRef = useRef(false)
  // 标记用户是否在基本信息 tab 操作过图片（包括删除所有图片）
  const imagesModifiedRef = useRef(false)
  // 标记是否已经复制过草稿（避免刷新页面后重复复制）
  const hasCopiedToDraft = useRef(false)

  const { hotelInfo } = useMerchantStore((state) => state)
  const getHotelInfo = useMerchantStore((state) => state.getHotelInfo)
  const updateHotelInfo = useMerchantStore((state) => state.updateHotelInfo)
  const submitAudit = useMerchantStore((state) => state.submitAudit)
  const cancelAudit = useMerchantStore((state) => state.cancelAudit)

  const copyToDraft = useMerchantStore((state) => state.copyToDraft)
  const draftImages = useMerchantStore((state) => state.draftImages)
  const getDraftImages = useMerchantStore((state) => state.getDraftImages)
  const publishedImages = useMerchantStore((state) => state.publishedImages)
  const getPublishedImages = useMerchantStore((state) => state.getPublishedImages)

  // 获取当前用户信息用于数据隔离
  const { userInfo } = useUserStore((state) => state)

  // 检测表单是否有未保存的修改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 本地草稿存储的 key - 使用用户ID隔离不同商户的数据
  const getDraftStorageKey = useCallback(() => {
    // 如果没有用户ID，返回空字符串（表示无法保存草稿）
    if (!userInfo?.userId) {
      return ''
    }
    return `merchant_hotel_draft_${userInfo.userId}`
  }, [userInfo?.userId])

  // 保存草稿到本地存储
  const saveDraftToStorage = useCallback(
    (values: any) => {
      try {
        // 如果没有用户ID，不保存草稿（避免使用 anonymous key）
        if (!userInfo?.userId) {
          return
        }
        const draft = {
          values,
          timestamp: Date.now(),
          hotelId: hotelInfo?.id,
          userId: userInfo?.userId,
        }
        const key = getDraftStorageKey()
        localStorage.setItem(key, JSON.stringify(draft))
      } catch (error) {
        console.error('保存草稿失败:', error)
      }
    },
    [hotelInfo?.id, userInfo?.userId, getDraftStorageKey]
  )

  // 从本地存储读取草稿
  const loadDraftFromStorage = useCallback(() => {
    try {
      const key = getDraftStorageKey()
      if (!key) return null
      const draftStr = localStorage.getItem(key)
      if (!draftStr) return null
      const draft = JSON.parse(draftStr)

      if (draft.userId !== userInfo?.userId) {
        console.warn('草稿用户ID不匹配，清除草稿')
        localStorage.removeItem(key)
        return null
      }

      const maxAge = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - draft.timestamp > maxAge) {
        localStorage.removeItem(key)
        return null
      }
      return draft
    } catch (error) {
      console.error('读取草稿失败:', error)
      return null
    }
  }, [getDraftStorageKey, userInfo?.userId])

  // 清除本地草稿
  const clearDraftStorage = useCallback(() => {
    try {
      const key = getDraftStorageKey()
      if (key) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('清除草稿失败:', error)
    }
  }, [getDraftStorageKey])

  // 表单值变化时的处理
  const handleFormValuesChange = useCallback(
    (_changedValues: any, allValues: any) => {
      // 如果没有酒店ID，不保存草稿
      if (!hotelInfo?.id) {
        return
      }
      // 标记有未保存的修改（即使在禁用期间也标记，确保用户知道有修改）
      setHasUnsavedChanges(true)
      // 如果禁用草稿保存（保存后的初始化阶段），只标记状态但不保存草稿
      if (disableDraftSaveRef.current) {
        return
      }
      // 使用 functional update 合并新的表单值
      setAllFormValues((prev: any) => {
        const newFormValues = { ...prev, ...allValues }
        saveDraftToStorage(newFormValues)
        return newFormValues
      })
    },
    [saveDraftToStorage, hotelInfo?.id]
  )

  // 保存成功后重置未保存状态
  const handleSaveSuccess = useCallback(() => {
    setHasUnsavedChanges(false)
    clearDraftStorage()
    // 清空已保存的表单值
    setAllFormValues({})
    justSavedRef.current = true
    // 禁用草稿保存，防止表单重新初始化时保存草稿
    disableDraftSaveRef.current = true
    // 重置图片修改标志
    imagesModifiedRef.current = false
    // 重置草稿复制标志（保存后草稿已存在，不需要再复制）
    hasCopiedToDraft.current = true
    // 重置初始数据加载标志，允许表单重新初始化
    initialDataLoadedRef.current = false
    // 2秒后重置标志（给数据刷新足够的时间）
    setTimeout(() => {
      justSavedRef.current = false
      // 重新启用草稿保存
      disableDraftSaveRef.current = false
    }, 2000)
  }, [clearDraftStorage])

  // 恢复草稿对话框
  const [restoreDraftModalOpen, setRestoreDraftModalOpen] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<any>(null)

  // 获取酒店信息的函数 - 使用 useCallback 避免无限循环
  const fetchHotelData = useCallback(async () => {
    setLoading(true)
    try {
      // 根据查看模式传递 viewMode 参数
      const viewMode = viewingPublishedVersion ? 'published' : 'draft'
      const hotel = await getHotelInfo(viewMode)
      setLastUpdateTime(new Date())
      // 获取酒店信息后，根据状态加载相应的图片
      if (hotel?.id) {
        if (hotel.status === 'pending' || hotel.status === 'rejected') {
          await getDraftImages()
        } else if (hotel.status === 'published' || hotel.status === 'offline') {
          // 对于已发布/已下线状态，根据查看模式加载相应图片
          if (viewingPublishedVersion) {
            await getPublishedImages()
          } else {
            await getDraftImages()
          }
        }
      }
    } catch (error) {
      console.error('获取酒店信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [getHotelInfo, getDraftImages, getPublishedImages, viewingPublishedVersion])

  // 自动刷新用的函数 - 有未保存修改时跳过
  const autoRefreshData = useCallback(async () => {
    if (hasUnsavedChanges) {
      return
    }
    await fetchHotelData()
  }, [fetchHotelData, hasUnsavedChanges])

  // 使用自动刷新 Hook
  useAutoRefresh(autoRefreshData, {
    interval: 30000,
    refreshOnVisible: true,
    enabled: !hasUnsavedChanges,
  })

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '确认刷新',
        content:
          '您有未保存的修改，刷新后将丢失当前编辑的内容并同步后台最新保存的数据。是否继续刷新？',
        okText: '继续刷新',
        cancelText: '取消',
        onOk: async () => {
          setHasUnsavedChanges(false)
          // 清空本地草稿数据
          clearDraftStorage()
          setAllFormValues({})
          setLocalImages(null)
          // 重置图片修改标志
          imagesModifiedRef.current = false
          // 重置初始数据加载标志，允许表单重新初始化
          initialDataLoadedRef.current = false
          await fetchHotelData()
        },
      })
    } else {
      fetchHotelData()
    }
  }, [hasUnsavedChanges, fetchHotelData, clearDraftStorage])

  // 初始加载
  useEffect(() => {
    fetchHotelData()
  }, [fetchHotelData])

  // 页面加载时检查是否有本地草稿（只检查一次）
  const draftCheckedRef = useRef(false)
  useEffect(() => {
    // 只检查一次
    if (draftCheckedRef.current) {
      return
    }

    // 等待用户信息和酒店信息都加载完成
    if (!hotelInfo || !userInfo?.userId) {
      return
    }

    // 如果刚刚保存成功，跳过草稿检查
    if (justSavedRef.current) {
      return
    }

    const draft = loadDraftFromStorage()
    if (draft && draft.hotelId === hotelInfo.id) {
      // 排除图片字段，比较其他所有字段
      const excludeFields = ['images', 'coverImage']
      const hasChanges = Object.keys(draft.values).some((key) => {
        // 跳过图片字段
        if (excludeFields.includes(key)) {
          return false
        }
        const draftValue = draft.values[key]
        const currentValue = hotelInfo[key as keyof typeof hotelInfo]
        // 处理 undefined 和空字符串的等价性
        const normalizedDraft =
          draftValue === undefined || draftValue === null ? '' : String(draftValue)
        const normalizedCurrent =
          currentValue === undefined || currentValue === null ? '' : String(currentValue)
        return normalizedDraft !== normalizedCurrent
      })

      if (hasChanges) {
        setPendingDraft(draft)
        setRestoreDraftModalOpen(true)
      } else {
        clearDraftStorage()
      }
    }

    // 标记已检查过草稿
    draftCheckedRef.current = true
  }, [hotelInfo, userInfo?.userId, loadDraftFromStorage, clearDraftStorage, allFormValues])

  // 恢复草稿
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      form.setFieldsValue({
        ...pendingDraft.values,
        openDate: pendingDraft.values.openDate ? dayjs(pendingDraft.values.openDate) : null,
      })
      // 同时恢复 allFormValues
      setAllFormValues(pendingDraft.values)
      setHasUnsavedChanges(true)
      message.success('已恢复草稿')
    }
    setRestoreDraftModalOpen(false)
    setPendingDraft(null)
  }

  // 放弃草稿
  const handleDiscardDraft = () => {
    // 只清除本地草稿存储，不删除数据库中的图片
    // 因为"放弃草稿"只是放弃本地未保存的修改，不是删除已保存的数据
    clearDraftStorage()
    // 清空已保存的表单值
    setAllFormValues({})
    // 重置图片修改标志
    imagesModifiedRef.current = false
    setRestoreDraftModalOpen(false)
    setPendingDraft(null)
    // 刷新页面数据，恢复到服务器保存的状态
    fetchHotelData()
    message.info('已放弃草稿')
  }

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // 获取当前展示的数据（主数据或草稿数据）
  const displayData = useMemo(() => {
    if (!hotelInfo) return null

    if (hotelInfo.status === 'pending') {
      // pending 状态：优先使用 draftData 中的数据（如果有），否则使用主表数据
      // 图片使用 draftImages
      return {
        ...hotelInfo,
        ...hotelInfo.draftData,
        images: draftImages.map((img) => img.url),
        // 使用 draftData 中的房型数据（如果有）
        roomTypes: hotelInfo.draftData?.roomTypes || hotelInfo.roomTypes,
      }
    }

    if (hotelInfo.status === 'rejected') {
      // rejected 状态：直接使用主表数据，图片使用 draftImages
      // rejected 状态的数据保存在主表，不使用 draftData
      return {
        ...hotelInfo,
        images: draftImages.map((img) => img.url),
      }
    }

    if (hasVersionControl(hotelInfo.status)) {
      if (viewingPublishedVersion) {
        // 查看线上版本：使用已发布图片和已发布房型数据
        return {
          ...hotelInfo,
          images: publishedImages.map((img) => img.url),
          // 使用 hotelInfo.roomTypes（已发布版本）
          roomTypes: hotelInfo.roomTypes,
        }
      }
      // 编辑草稿模式：使用 draftImages 和 draftData 中的房型数据
      // 注意：draftImages 为 null/undefined 时才使用后备逻辑，空数组是有效的数据状态（表示用户删除了所有图片）
      const images = draftImages != null ? draftImages.map((img) => img.url) : hotelInfo.images
      return {
        ...hotelInfo,
        ...hotelInfo.draftData,
        images: images || [],
        // 使用 draftData 中的房型数据（如果有）
        roomTypes: hotelInfo.draftData?.roomTypes || hotelInfo.roomTypes,
      }
    }

    return hotelInfo
  }, [hotelInfo, viewingPublishedVersion, draftImages, publishedImages])

  // 本地房型数据（支持 ImageItem，用于编辑状态）
  const [localRoomTypes, setLocalRoomTypes] = useState<RoomTypeWithImageItems[]>([])

  // 从 displayData 同步本地房型数据
  useEffect(() => {
    if (displayData?.roomTypes) {
      setLocalRoomTypes(displayData.roomTypes)
    }
  }, [displayData?.roomTypes])

  // 表单数据初始化（首次加载或酒店ID变化时）
  const initialDataLoadedRef = useRef(false)
  useEffect(() => {
    if (displayData?.id && !initialDataLoadedRef.current) {
      // 优先使用 allFormValues 中的值（用户已编辑但未保存的值）
      const formData = {
        ...displayData,
        ...allFormValues,
        openDate: allFormValues.openDate
          ? dayjs(allFormValues.openDate)
          : displayData.openDate
            ? dayjs(displayData.openDate)
            : null,
        coverImage: allFormValues.images?.[0] || displayData.images?.[0] || '',
        images: allFormValues.images || displayData.images || [],
      }
      form.setFieldsValue(formData)
      initialDataLoadedRef.current = true
    }
  }, [displayData, form, allFormValues])

  // 当 displayData 变化但非首次加载时，更新非表单编辑中的字段
  useEffect(() => {
    if (displayData?.id && initialDataLoadedRef.current && !hasUnsavedChanges) {
      // 更新地址和坐标字段（用户未编辑时）
      form.setFieldsValue({
        address: displayData.address,
        longitude: displayData.longitude,
        latitude: displayData.latitude,
        coverImage: displayData.images?.[0] || '',
        images: displayData.images || [],
      })
    }
  }, [
    displayData?.images,
    displayData?.id,
    displayData?.address,
    displayData?.longitude,
    displayData?.latitude,
    form,
    hasUnsavedChanges,
  ])

  // 切换查看模式时重置表单
  useEffect(() => {
    if (hotelInfo && hasVersionControl(hotelInfo.status)) {
      // 如果用户有本地未保存的修改（localImages 不为 null），保留本地修改
      const hasLocalChanges = localImages !== null
      // 检查是否有本地表单草稿数据
      const hasFormDraft = Object.keys(allFormValues).length > 0

      const data = viewingPublishedVersion
        ? {
            ...hotelInfo,
            images: publishedImages.map((img) => img.url),
          }
        : {
            ...hotelInfo,
            ...hotelInfo.draftData,
            // 切换回编辑模式时，如果有本地修改则使用本地数据，否则使用草稿数据
            images: hasLocalChanges
              ? localImages.map((img) => img.url)
              : draftImages.map((img) => img.url),
          }

      // 切换回编辑模式时，如果有本地表单草稿，合并到数据中
      const finalData =
        !viewingPublishedVersion && hasFormDraft ? { ...data, ...allFormValues } : data

      const formData = {
        ...finalData,
        openDate: finalData?.openDate ? dayjs(finalData.openDate) : null,
        coverImage: finalData?.images?.[0] || '',
        images: finalData?.images || [],
      }
      form.setFieldsValue(formData)
    }
  }, [
    viewingPublishedVersion,
    hotelInfo,
    form,
    draftImages,
    publishedImages,
    localImages,
    allFormValues,
  ])

  // 切换到查看线上版本时，加载已发布图片
  // 切换回编辑模式时，加载草稿图片
  useEffect(() => {
    if (!hotelInfo?.id) return

    // 注意：切换模式时不清空 localImages，保留用户的本地修改
    // 只有在首次加载或保存后才清空 localImages

    if (viewingPublishedVersion) {
      getPublishedImages()
    } else {
      getDraftImages()
    }
  }, [viewingPublishedVersion, hotelInfo?.id, getPublishedImages, getDraftImages])

  // 进入编辑时调用copy-to-draft（确保草稿存在）
  // 只在首次加载时调用一次，不依赖 draftImages 避免重复调用
  useEffect(() => {
    if (
      hotelInfo?.id &&
      hasVersionControl(hotelInfo.status) &&
      !viewingPublishedVersion &&
      !hasCopiedToDraft.current
    ) {
      hasCopiedToDraft.current = true
      copyToDraft()
    }
  }, [hotelInfo?.id, hotelInfo?.status, viewingPublishedVersion, copyToDraft])

  // 当状态变为 pending 或 rejected 时，刷新草稿图片
  useEffect(() => {
    if (hotelInfo?.id && (hotelInfo.status === 'pending' || hotelInfo.status === 'rejected')) {
      getDraftImages()
    }
  }, [hotelInfo?.id, hotelInfo?.status, getDraftImages])

  const update = async () => {
    if (viewingPublishedVersion) {
      message.warning('当前处于查看线上版本模式，请切换到编辑模式后再保存')
      return
    }

    // 审核中状态禁止编辑
    if (hotelInfo?.status === 'pending') {
      message.warning('当前酒店正在审核中，无法进行编辑')
      return
    }

    setSaving(true)
    let hotelUpdated = false
    let imagesUpdated = false

    try {
      // 合并当前表单值和 allFormValues（跨 tab 保存的所有字段值）
      const currentFormValues = form.getFieldsValue()
      const formValues = { ...allFormValues, ...currentFormValues }

      // 1. 处理酒店主图
      // 使用 localImages（用户调整后的顺序）作为基础
      // 注意：使用 imagesModifiedRef 来判断用户是否操作过图片，因为删除所有图片后 localImages 为空
      const uploadedImageUrls: string[] = []
      const uploadedImageIds: number[] = []

      if (imagesModifiedRef.current && localImages !== null) {
        // 用户在基本信息 tab 操作过图片（包括删除所有图片），使用 localImages
        for (const img of localImages) {
          if (img.file && img.status === 'pending') {
            // 新上传的图片
            try {
              const res = await uploadApi.uploadImage(img.file, {
                type: 'hotel_main',
                hotelId: hotelInfo?.id,
              })
              uploadedImageUrls.push(res.url)
            } catch (error) {
              console.error('上传图片失败:', error)
              message.error(`上传图片 ${img.name} 失败`)
              throw error
            }
          } else if (img.url && !img.url.startsWith('blob:')) {
            // 已有服务器图片（非 blob URL）
            uploadedImageUrls.push(img.url)
            // 如果有 id，记录用于排序
            if (img.uid && !img.uid.startsWith('local-')) {
              uploadedImageIds.push(parseInt(img.uid))
            }
          }
        }
      } else {
        // 用户未操作过图片，保留当前数据的图片
        // 优先使用 displayData，如果为空则使用 hotelInfo 的图片
        const currentData = displayData || hotelInfo
        if (currentData?.images && currentData.images.length > 0) {
          uploadedImageUrls.push(...currentData.images)
        } else if (hotelInfo?.images && hotelInfo.images.length > 0) {
          // 后备：直接使用 hotelInfo 的图片
          uploadedImageUrls.push(...hotelInfo.images)
        }
      }

      // 去重，避免传入重复URL
      const uniqueImageUrls = [...new Set(uploadedImageUrls)]

      // 2. 上传房型图片并转换 roomTypes
      const processedRoomTypes: RoomType[] = []
      for (const room of localRoomTypes) {
        const roomImageUrls: string[] = []
        const roomImages = room.images || []

        for (const img of roomImages) {
          // 如果是字符串（已有 URL），直接使用
          if (typeof img === 'string') {
            roomImageUrls.push(img)
          } else if (img.file && img.status === 'pending') {
            // 如果是 ImageItem 且有 file，需要上传
            try {
              const res = await uploadApi.uploadImage(img.file, {
                type: 'hotel_room',
                hotelId: hotelInfo?.id,
                roomType: room.name, // 传递房型名称作为 roomType
              })
              roomImageUrls.push(res.url)
            } catch (error) {
              console.error('上传房型图片失败:', error)
              message.error(`上传房型图片 ${img.name} 失败`)
              throw error
            }
          } else if (img.url && !img.url.startsWith('blob:')) {
            // 已有服务器图片
            roomImageUrls.push(img.url)
          }
        }

        // 过滤掉 undefined 值，避免 JSON 序列化问题
        const processedRoom: any = {
          name: room.name,
          price: room.price,
          images: roomImageUrls,
        }
        if (room.area !== undefined && room.area !== null) processedRoom.area = room.area
        if (room.bedType !== undefined && room.bedType !== null)
          processedRoom.bedType = room.bedType
        if (
          room.facilities !== undefined &&
          room.facilities !== null &&
          room.facilities.length > 0
        ) {
          processedRoom.facilities = room.facilities
        }
        processedRoomTypes.push(processedRoom)
      }

      // 3. 保存酒店基本信息（包含图片URL列表）
      // 从 displayData 获取当前数据，避免只保存当前 tab 的字段导致其他字段丢失
      const currentData = displayData || hotelInfo
      // 辅助函数：如果表单值有效（非undefined、非null、非空字符串），则使用，否则使用后备值
      const getValue = (formValue: any, currentValue: any) => {
        if (formValue !== undefined && formValue !== null && formValue !== '') {
          return formValue
        }
        // 如果 currentValue 也是空字符串，优先使用表单值（允许用户清空）
        if (formValue === '' && currentValue === '') {
          return formValue
        }
        return currentValue
      }
      const updateForm: any = {
        nameZh: getValue(formValues.nameZh, currentData?.nameZh),
        nameEn: getValue(formValues.nameEn, currentData?.nameEn),
        address: getValue(formValues.address, currentData?.address),
        openDate: form.getFieldValue('openDate')?.format('YYYY-MM-DD') || currentData?.openDate,
        starRating:
          formValues.starRating !== undefined && formValues.starRating !== null
            ? formValues.starRating
            : currentData?.starRating,
        description: getValue(formValues.description, currentData?.description),
        roomTypes: processedRoomTypes,
        // 周边信息 - 优先从表单获取，表单中没有则从当前数据获取
        nearbyAttractions: getValue(formValues.nearbyAttractions, currentData?.nearbyAttractions),
        nearbyTransport: getValue(formValues.nearbyTransport, currentData?.nearbyTransport),
        nearbyMalls: getValue(formValues.nearbyMalls, currentData?.nearbyMalls),
        // 优惠活动
        discounts:
          formValues.discounts !== undefined ? formValues.discounts : currentData?.discounts,
      }

      // 只有用户操作过图片（在基本信息 tab）时，才发送 images 字段
      // 否则不发送，让后端保留原有图片数据
      // 注意：使用 imagesModifiedRef 来判断，因为用户可能删除了所有图片（此时 localImages 为空）
      if (imagesModifiedRef.current) {
        updateForm.images = uniqueImageUrls
      }

      // 4. 先同步图片到数据库（删除、排序）
      // 用户操作过图片时需要同步（包括删除所有图片的情况）
      // 注意：只要用户操作过图片（imagesModifiedRef.current 为 true），无论 uniqueImageUrls 是否为空，都需要同步
      // 因为 uniqueImageUrls 为空表示用户删除了所有图片，这时候需要删除数据库中的草稿图片
      const shouldSyncImages = imagesModifiedRef.current
      if (hotelInfo?.id && shouldSyncImages) {
        await hotelImageApi.syncImages(hotelInfo.id, uniqueImageUrls, 'hotel_main')
        imagesUpdated = true
      }

      // 5. 保存酒店基本信息（在图片同步之后，这样 updateHotelInfo 获取到的图片是最新的）
      await updateHotelInfo(updateForm)
      hotelUpdated = true

      // 6. 清理本地状态并刷新数据
      setLocalImages(null)
      handleSaveSuccess()
      // 刷新酒店信息和图片数据
      await getHotelInfo()

      if (hotelUpdated || imagesUpdated) {
        message.success('保存成功')
      } else {
        message.info('没有需要保存的更改')
      }
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    if (viewingPublishedVersion) {
      message.warning('当前处于查看线上版本模式，请切换到编辑模式后再提交')
      return
    }

    if (hotelInfo && hasVersionControl(hotelInfo.status) && !hotelInfo.draftData) {
      message.warning('请先修改酒店信息后再提交审核')
      return
    }

    setAuditInfoInput('')
    setSubmitAuditModalOpen(true)
  }

  const cancel = async () => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销审核申请吗？撤销后可以继续修改酒店信息。',
      okText: '确认撤销',
      cancelText: '取消',
      onOk: async () => {
        await cancelAudit()
        await getHotelInfo()
        // 撤销审核后状态变回 draft，需要刷新草稿图片
        getDraftImages()
        message.success('撤销审核成功')
      },
    })
  }

  // 处理提交审核
  const handleSubmitAudit = async () => {
    setSaving(true)
    try {
      await submitAudit({ auditInfo: auditInfoInput })
      setSubmitAuditModalOpen(false)
      await getHotelInfo()
      // 提交审核后状态变为 pending，需要刷新草稿图片
      await getDraftImages()
      message.success('提交审核成功')
    } finally {
      setSaving(false)
    }
  }

  const handleAddRoom = () => {
    if (viewingPublishedVersion) {
      message.warning('查看模式下不能编辑房型')
      return
    }
    if (hotelInfo?.status === 'pending') {
      message.warning('审核中不能编辑房型')
      return
    }
    setEditingRoomIndex(null)
    setRoomModalOpen(true)
  }

  const handleEditRoom = (index: number) => {
    // 审核中状态允许查看（只读），但不允许编辑
    // viewMode 会在 RoomModal 中处理
    setEditingRoomIndex(index)
    setRoomModalOpen(true)
  }

  const handleDeleteRoom = (index: number) => {
    if (viewingPublishedVersion) {
      message.warning('查看模式下不能删除房型')
      return
    }
    if (hotelInfo?.status === 'pending') {
      message.warning('审核中不能删除房型')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个房型吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 从本地房型数据中删除
        setLocalRoomTypes((prev) => prev.filter((_, i) => i !== index))
        setHasUnsavedChanges(true)
        message.success('删除成功')
      },
    })
  }

  const handleRoomSubmit = (room: RoomTypeWithImageItems) => {
    if (editingRoomIndex !== null) {
      // 更新本地房型数据
      setLocalRoomTypes((prev) => {
        const newRooms = [...prev]
        newRooms[editingRoomIndex] = room
        return newRooms
      })
      message.success('房型更新成功（点击保存修改后生效）')
    } else {
      // 添加新房型到本地数据
      setLocalRoomTypes((prev) => [...prev, room])
      message.success('房型添加成功（点击保存修改后生效）')
    }
    setHasUnsavedChanges(true)
    setRoomModalOpen(false)
    setEditingRoomIndex(null)
  }

  const editingRoom = useMemo<RoomTypeWithImageItems | undefined>(() => {
    if (editingRoomIndex !== null && localRoomTypes[editingRoomIndex]) {
      return localRoomTypes[editingRoomIndex]
    }
    return undefined
  }, [editingRoomIndex, localRoomTypes])

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> =
    {
      draft: {
        label: '草稿',
        icon: <FileEdit size={14} />,
        className: styles.statusDraft,
      },
      pending: {
        label: '审核中',
        icon: <Clock size={14} />,
        className: styles.statusPending,
      },
      approved: {
        label: '审核通过',
        icon: <CheckCircle size={14} />,
        className: styles.statusApproved,
      },
      published: {
        label: '已发布',
        icon: <CheckCircle size={14} />,
        className: styles.statusPublished,
      },
      rejected: {
        label: '已驳回',
        icon: <XCircle size={14} />,
        className: styles.statusRejected,
      },
      offline: {
        label: '已下线',
        icon: <XCircle size={14} />,
        className: styles.statusOffline,
      },
    }

  const currentStatus = statusConfig[hotelInfo?.status || 'draft'] || statusConfig.draft

  const hasPendingDraft = hotelInfo && hasVersionControl(hotelInfo.status) && !!hotelInfo.draftData

  return (
    <div className={styles.container}>
      <div className="pageHeader">
        <h2>酒店信息管理</h2>
        <div className={styles.headerSub}>
          <Tag
            className={`${styles.statusTag} ${currentStatus.className}`}
            icon={currentStatus.icon}
          >
            {currentStatus.label}
          </Tag>
          <span className={styles.headerDesc}>
            {hotelInfo?.status === 'published'
              ? '酒店已发布，客户端展示的是最近一次已上线的版本。'
              : hotelInfo?.status === 'offline'
                ? '酒店已下线，客户端不再展示。'
                : hotelInfo?.status === 'pending'
                  ? '酒店正在审核中，审核期间无法编辑，请耐心等待。'
                  : '请完善您的酒店资料，审核通过后将展示在客户端。'}
          </span>
          {hotelInfo?.rejectReason &&
            (hotelInfo.status === 'rejected' ||
              hotelInfo.status === 'draft' ||
              hotelInfo.status === 'pending') && (
              <Button
                type="link"
                icon={<AlertCircle size={16} />}
                onClick={() => setRejectReasonModalOpen(true)}
                style={{
                  color: '#dc2626',
                  padding: '0 8px 0 0',
                }}
                className="reject-reason-btn"
              >
                查看驳回原因
              </Button>
            )}
        </div>

        <Space className={styles.optionButton}>
          <div
            style={{
              fontSize: 12,
              color: '#78716c',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              position: 'relative',
            }}
          >
            <div>{loading ? '更新中...' : `上次更新: ${formatUpdateTime(lastUpdateTime)}`}</div>
            {hasUnsavedChanges && (
              <div
                style={{
                  color: '#fa8c16',
                  position: 'absolute',
                  top: '100%',
                  whiteSpace: 'nowrap',
                }}
              >
                (未保存的修改-自动刷新已暂停)
              </div>
            )}
          </div>
          <Button
            type="text"
            icon={<RefreshCw size={16} className={loading ? 'spin' : ''} />}
            onClick={handleManualRefresh}
            disabled={loading}
            title="立即刷新"
          />
          {hotelInfo?.status === 'draft' && (
            <>
              <Button size="large" onClick={update} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存草稿'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving}
              >
                提交审核
              </Button>
            </>
          )}
          {hotelInfo?.status === 'pending' && (
            <Button size="large" icon={<Undo2 size={18} />} onClick={cancel}>
              撤销审核
            </Button>
          )}
          {(hotelInfo?.status === 'published' || hotelInfo?.status === 'offline') && (
            <>
              <Button size="large" onClick={update} disabled={saving || viewingPublishedVersion}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存修改'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving || viewingPublishedVersion || !hasPendingDraft}
              >
                提交审核
              </Button>
            </>
          )}
          {hotelInfo?.status === 'rejected' && (
            <>
              <Button size="large" onClick={update} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : '保存草稿'}
              </Button>
              <Button
                size="large"
                className="btn-primary-gold"
                icon={<Save size={18} />}
                onClick={submit}
                disabled={saving}
              >
                重新提交
              </Button>
            </>
          )}
        </Space>
      </div>

      <div className={styles.tabsRow}>
        <CustomTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'basic', label: '基本信息' },
            { key: 'rooms', label: '房型与价格' },
            { key: 'marketing', label: '营销与位置' },
          ]}
        />

        {hotelInfo && hasVersionControl(hotelInfo.status) && (
          <div className={styles.versionToggle}>
            <Space size="small" align="center">
              {hasPendingDraft && (
                <Alert
                  message="您有未审核的修改"
                  type="warning"
                  showIcon
                  style={{ padding: '4px 12px', fontSize: 12 }}
                />
              )}
              <div className="view-mode-tabs">
                <button
                  className={`view-mode-tab ${!viewingPublishedVersion ? 'active' : ''}`}
                  onClick={() => setViewingPublishedVersion(false)}
                >
                  <Edit3 size={14} />
                  <span>编辑草稿</span>
                </button>
                <button
                  className={`view-mode-tab ${viewingPublishedVersion ? 'active' : ''}`}
                  onClick={() => setViewingPublishedVersion(true)}
                >
                  <Eye size={14} />
                  <span>查看线上版本</span>
                </button>
              </div>
            </Space>
          </div>
        )}
      </div>

      <Modal
        title="查看驳回原因"
        open={rejectReasonModalOpen}
        onCancel={() => setRejectReasonModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setRejectReasonModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={520}
        centered
      >
        <div style={{ padding: '16px 24px' }}>
          <Alert
            message="审核不通过"
            description={hotelInfo?.rejectReason || '暂无驳回原因'}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: '#666', fontSize: 14 }}>请根据驳回原因修改酒店信息后重新提交审核。</p>
        </div>
      </Modal>

      <Modal
        title="提交审核"
        open={submitAuditModalOpen}
        onCancel={() => setSubmitAuditModalOpen(false)}
        onOk={handleSubmitAudit}
        confirmLoading={saving}
        okText="确认提交"
        cancelText="取消"
        width={520}
        centered
      >
        <div style={{ padding: '16px 24px' }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            请填写审核信息，帮助管理员了解本次修改内容：
          </p>
          <Input.TextArea
            value={auditInfoInput}
            onChange={(e) => setAuditInfoInput(e.target.value)}
            placeholder="例如：本次修改了酒店房型价格和添加了新的设施照片..."
            rows={4}
            maxLength={500}
            showCount
            style={{
              borderRadius: 8,
            }}
          />
        </div>
      </Modal>

      <FormCard>
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          {/* 使用 display 控制显示，避免组件卸载导致地图重新加载 */}
          <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <BasicInfoForm
              disabled={viewingPublishedVersion || hotelInfo?.status === 'pending'}
              initialImages={
                viewingPublishedVersion
                  ? (displayData?.images || []).map((url: string, index: number) => ({
                      url,
                      uid: `published-${index}`,
                      status: 'done' as const,
                    }))
                  : // 当 localImages 不为 null 时，优先使用 localImages（包括空数组的情况）
                    // 这样当用户删除所有图片后，不会回退到 draftImages
                    localImages !== null
                    ? localImages
                    : draftImages.length > 0
                      ? draftImages.map((img) => ({
                          url: img.url,
                          uid: `draft-${img.id}`,
                          status: 'done' as const,
                        }))
                      : (displayData?.images || []).map((url: string, index: number) => ({
                          url,
                          uid: `published-${index}`,
                          status: 'done' as const,
                        }))
              }
              onImagesChange={(images) => {
                setLocalImages(images)
                setHasUnsavedChanges(true)
                imagesModifiedRef.current = true
              }}
              onValuesChange={handleFormValuesChange}
            />
          </div>
          <div style={{ display: activeTab === 'rooms' ? 'block' : 'none' }}>
            <RoomList
              rooms={localRoomTypes}
              onAddRoom={handleAddRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              disabled={viewingPublishedVersion || hotelInfo?.status === 'pending'}
              viewMode={viewingPublishedVersion || hotelInfo?.status === 'pending'}
            />
          </div>
          <div style={{ display: activeTab === 'marketing' ? 'block' : 'none' }}>
            <MarketingForm disabled={viewingPublishedVersion || hotelInfo?.status === 'pending'} />
          </div>
        </Form>
      </FormCard>

      <RoomModal
        open={roomModalOpen}
        onCancel={() => {
          setRoomModalOpen(false)
          setEditingRoomIndex(null)
        }}
        onSubmit={handleRoomSubmit}
        initialValues={editingRoom}
        disabled={viewingPublishedVersion || hotelInfo?.status === 'pending'}
      />

      <Modal
        title="恢复草稿"
        open={restoreDraftModalOpen}
        onOk={handleRestoreDraft}
        onCancel={handleDiscardDraft}
        okText="恢复草稿"
        cancelText="放弃草稿"
        width={400}
        centered
      >
        <p>检测到您有未保存的草稿，是否恢复？</p>
      </Modal>
    </div>
  )
}

export default MerchantHotelForm

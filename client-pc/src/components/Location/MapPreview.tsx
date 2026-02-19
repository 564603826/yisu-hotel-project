import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Spin, Empty, message, Button } from 'antd'
import { MapPin, Navigation, Search } from 'lucide-react'
import AMapLoader from '@amap/amap-jsapi-loader'
import './MapPreview.scss'

interface MapPreviewProps {
  address?: string
  lng?: number
  lat?: number
  onClick?: () => void
  disabled?: boolean
  showLocateButton?: boolean
  onLocate?: (location: { address: string; lng: number; lat: number }) => void
}

const MapPreview: React.FC<MapPreviewProps> = ({
  address,
  lng,
  lat,
  disabled = false,
  showLocateButton = false,
  onLocate,
}) => {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasLocation, setHasLocation] = useState(false)
  const [AMap, setAMap] = useState<any>(null)

  // 初始化高德地图 SDK
  const initMap = useCallback(async () => {
    setLoading(true)
    try {
      window._AMapSecurityConfig = {
        securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY || '',
      }

      const amapInstance = await AMapLoader.load({
        key: import.meta.env.VITE_AMAP_KEY || '',
        version: '2.0',
        plugins: ['AMap.Geolocation', 'AMap.Geocoder', 'AMap.PlaceSearch'],
      })

      setAMap(amapInstance)
    } catch (error) {
      console.error('地图 SDK 加载失败:', error)
      setLoading(false)
    }
  }, [])

  // 根据坐标获取地址（逆地理编码）
  const getAddressByLngLat = useCallback(
    (longitude: number, latitude: number): Promise<string> => {
      return new Promise((resolve) => {
        if (!AMap) {
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          return
        }
        const geocoder = new AMap.Geocoder()
        geocoder.getAddress([longitude, latitude], (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            resolve(result.regeocode.formattedAddress)
          } else {
            resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        })
      })
    },
    [AMap]
  )

  // 创建地图
  const createMap = useCallback(
    (centerLng: number, centerLat: number) => {
      if (!AMap || !mapContainerRef.current) return

      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '2D',
        zoom: 15,
        center: [centerLng, centerLat],
        // 启用拖拽和缩放
        dragEnable: true,
        zoomEnable: true,
        doubleClickZoom: true,
        scrollWheel: true,
      })

      mapRef.current = map

      const marker = new AMap.Marker({
        position: [centerLng, centerLat],
        draggable: false,
      })

      marker.setMap(map)
      markerRef.current = marker

      setLoading(false)
      setHasLocation(true)
    },
    [AMap]
  )

  // 根据地址查询坐标（使用 PlaceSearch 与 LocationPicker 保持一致）
  const geocodeAddress = useCallback(
    async (addr: string): Promise<{ lng: number; lat: number } | null> => {
      if (!AMap || !addr) return null

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(null)
        }, 5000)

        const placeSearch = new AMap.PlaceSearch({ pageSize: 1, pageIndex: 1 })
        placeSearch.search(addr, (status: string, result: any) => {
          clearTimeout(timeoutId)
          if (status === 'complete' && result.poiList?.pois?.length > 0) {
            const poi = result.poiList.pois[0]
            resolve({ lng: poi.location.lng, lat: poi.location.lat })
          } else {
            resolve(null)
          }
        })
      })
    },
    [AMap]
  )

  // 初始化地图 SDK
  useEffect(() => {
    if (!AMap) {
      // 使用 requestIdleCallback 避免在 effect 中同步调用 setState
      const id = requestIdleCallback(() => initMap(), { timeout: 100 })
      return () => cancelIdleCallback(id)
    }
  }, [AMap, initMap])

  // 用于追踪上一次成功定位的地址，避免重复查询相同地址
  const lastAddressRef = useRef<string>('')
  // 用于节流的定时器
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 待查询的地址
  const pendingAddressRef = useRef<string>('')

  // 重新搜索当前地址
  const handleReSearch = useCallback(async () => {
    if (!AMap || !address) {
      message.warning('请输入地址后再搜索')
      return
    }

    setLoading(true)
    // 清除上次查询记录，强制重新查询
    lastAddressRef.current = ''

    try {
      const location = await geocodeAddress(address)
      if (location) {
        lastAddressRef.current = address
        if (mapRef.current) {
          mapRef.current.panTo([location.lng, location.lat])
          markerRef.current.setPosition([location.lng, location.lat])
        } else if (mapContainerRef.current) {
          createMap(location.lng, location.lat)
        }
        setHasLocation(true)
        message.success('位置已更新')
      } else {
        message.error('无法识别该地址，请检查地址是否正确')
        setHasLocation(false)
        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }
      }
    } catch (error) {
      console.error('重新搜索失败:', error)
      message.error('搜索失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [AMap, address, geocodeAddress, createMap])

  // 用于追踪上一次的坐标，判断坐标是否变化
  const lastCoordsRef = useRef<{ lng?: number; lat?: number }>({})

  // 执行地图更新的实际逻辑
  const doUpdateMap = useCallback(async () => {
    const addr = pendingAddressRef.current

    // 情况1: 有坐标时，优先使用坐标定位
    if (lng && lat && AMap) {
      // 检查坐标是否变化
      const coordsChanged = lng !== lastCoordsRef.current.lng || lat !== lastCoordsRef.current.lat

      if (coordsChanged) {
        // 坐标变化了（从LocationPicker选择的新位置），直接使用新坐标
        lastCoordsRef.current = { lng, lat }
        lastAddressRef.current = addr || ''
        if (mapRef.current) {
          mapRef.current.panTo([lng, lat])
          markerRef.current.setPosition([lng, lat])
        } else if (mapContainerRef.current) {
          createMap(lng, lat)
        }
        setHasLocation(true)
        return
      }

      // 坐标没变但地址变了（手动输入地址），根据地址查询
      if (addr && addr !== lastAddressRef.current) {
        setLoading(true)
        const location = await geocodeAddress(addr)
        if (location) {
          lastAddressRef.current = addr
          if (mapRef.current) {
            mapRef.current.panTo([location.lng, location.lat])
            markerRef.current.setPosition([location.lng, location.lat])
          } else if (mapContainerRef.current) {
            createMap(location.lng, location.lat)
          }
          setHasLocation(true)
        }
        setLoading(false)
        return
      }

      // 都没变，直接使用坐标
      if (mapRef.current) {
        mapRef.current.panTo([lng, lat])
        markerRef.current.setPosition([lng, lat])
      } else if (mapContainerRef.current) {
        createMap(lng, lat)
      }
      setHasLocation(true)
      return
    }

    // 情况2: 只有地址没有坐标时，根据地址查询
    if (addr && AMap && (!lng || !lat)) {
      // 如果地址和上次查询的相同，跳过
      if (addr === lastAddressRef.current) {
        return
      }

      setLoading(true)
      const location = await geocodeAddress(addr)
      if (location) {
        lastAddressRef.current = addr
        if (mapRef.current) {
          mapRef.current.panTo([location.lng, location.lat])
          markerRef.current.setPosition([location.lng, location.lat])
        } else if (mapContainerRef.current) {
          createMap(location.lng, location.lat)
        }
        setHasLocation(true)
      } else {
        setHasLocation(false)
        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }
      }
      setLoading(false)
    } else if (!addr && (!lng || !lat)) {
      // 地址和坐标都为空时，清空地图
      setHasLocation(false)
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [lng, lat, AMap, createMap, geocodeAddress])

  // 更新地图显示（带节流）
  useEffect(() => {
    pendingAddressRef.current = address || ''

    // 清除之前的定时器
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current)
    }

    // 如果没有地址且没有坐标，直接显示空状态，不加载
    if (!address && !lng && !lat) {
      setHasLocation(false)
      setLoading(false)
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
      return
    }

    // 设置新的定时器，1500ms 后执行查询，给用户足够时间输入
    throttleTimerRef.current = setTimeout(() => {
      doUpdateMap()
    }, 1500)

    // 清理函数
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }
    }
  }, [address, lng, lat, doUpdateMap])

  // 获取当前定位
  const handleLocate = () => {
    if (!AMap || disabled) return

    setLoading(true)
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    })

    geolocation.getCurrentPosition(async (status: string, result: any) => {
      if (status === 'complete') {
        const { lng, lat } = result.position
        const resolvedAddress = await getAddressByLngLat(lng, lat)

        // 更新地图
        if (mapRef.current) {
          mapRef.current.setCenter([lng, lat])
          markerRef.current.setPosition([lng, lat])
        } else if (mapContainerRef.current) {
          createMap(lng, lat)
        }

        setHasLocation(true)
        message.success('已获取当前位置')
        onLocate?.({ address: resolvedAddress, lng, lat })
      } else {
        message.error('获取定位失败，请检查浏览器定位权限')
      }
      setLoading(false)
    })
  }

  // 清理地图实例
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className={`map-preview ${disabled ? 'disabled' : ''}`}>
      {/* 始终渲染地图容器，但无位置时隐藏 */}
      <div
        ref={mapContainerRef}
        className="map-preview-container"
        style={{ visibility: hasLocation ? 'visible' : 'hidden' }}
      />

      {/* 加载状态 */}
      {loading && (
        <div className="map-preview-loading">
          <Spin size="large" tip="地图加载中..." />
        </div>
      )}

      {/* 有位置时显示按钮 */}
      {hasLocation && (
        <>
          {/* 左上角重新搜索按钮 */}
          {address && (
            <Button
              className="map-preview-search-btn"
              type="primary"
              size="small"
              icon={<Search size={14} />}
              onClick={(e) => {
                e.stopPropagation()
                handleReSearch()
              }}
              loading={loading}
            >
              重新搜索
            </Button>
          )}
          {showLocateButton && (
            <div
              className="map-preview-locate-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleLocate()
              }}
            >
              <Navigation size={14} />
              <span>当前定位</span>
            </div>
          )}
        </>
      )}

      {/* 无位置时显示空状态 */}
      {!hasLocation && !loading && (
        <div className="map-preview-empty">
          <Empty
            image={<MapPin size={48} style={{ color: '#c58e53', opacity: 0.5 }} />}
            description={
              <div className="map-preview-empty-text">
                <div>暂无位置信息</div>
                <div className="map-preview-empty-hint">
                  {address ? '无法识别该地址，请重新选择位置' : '点击下方按钮选择位置'}
                </div>
              </div>
            }
          />
          {showLocateButton && (
            <div
              className="map-preview-locate-btn primary"
              onClick={(e) => {
                e.stopPropagation()
                handleLocate()
              }}
            >
              <Navigation size={14} />
              <span>使用当前定位</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MapPreview

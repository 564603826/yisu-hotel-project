import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Spin, Empty, message } from 'antd'
import { MapPin, Navigation } from 'lucide-react'
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
        plugins: ['AMap.Geolocation', 'AMap.Geocoder'],
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
        // 启用基本的地图交互功能
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

  // 根据地址查询坐标
  const geocodeAddress = useCallback(
    async (addr: string): Promise<{ lng: number; lat: number } | null> => {
      if (!AMap || !addr) return null

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(null)
        }, 5000)

        const geocoder = new AMap.Geocoder()
        geocoder.getLocation(addr, (status: string, result: any) => {
          clearTimeout(timeoutId)
          if (status === 'complete' && result.geocodes?.length > 0) {
            const location = result.geocodes[0].location
            resolve({ lng: location.lng, lat: location.lat })
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

  // 更新地图显示
  useEffect(() => {
    const updateMap = async () => {
      // 如果直接传入了坐标，优先使用
      if (lng && lat) {
        if (mapRef.current) {
          mapRef.current.setCenter([lng, lat])
          markerRef.current.setPosition([lng, lat])
        } else if (mapContainerRef.current && AMap) {
          createMap(lng, lat)
        }
        setHasLocation(true)
        return
      }

      // 如果有地址，尝试地理编码
      if (address && AMap) {
        // 如果地址和上次查询的相同，跳过
        if (address === lastAddressRef.current && hasLocation) {
          return
        }

        setLoading(true)
        const location = await geocodeAddress(address)
        if (location) {
          lastAddressRef.current = address
          if (mapRef.current) {
            mapRef.current.setCenter([location.lng, location.lat])
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
      } else if (!address) {
        // 地址为空时，清空地图
        setHasLocation(false)
        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }
      }
    }

    updateMap()
  }, [address, lng, lat, AMap, createMap, geocodeAddress, hasLocation])

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
      {loading && (
        <div className="map-preview-loading">
          <Spin size="large" tip="地图加载中..." />
        </div>
      )}

      {hasLocation ? (
        <>
          <div ref={mapContainerRef} className="map-preview-container" />
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
      ) : (
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

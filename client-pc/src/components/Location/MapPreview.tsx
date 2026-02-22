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
        plugins: ['AMap.Geolocation', 'AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.CitySearch'],
      })

      setAMap(amapInstance)
    } catch {
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
    } catch {
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

  // 使用免费的 ipapi.co 进行 IP 定位（备用方案）
  const getLocationByIPFree = useCallback(async (): Promise<{
    lng: number
    lat: number
    address: string
  } | null> => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()

      // 强制检查 latitude 和 longitude 是否存在且有效
      const hasValidCoords =
        Object.prototype.hasOwnProperty.call(data, 'latitude') &&
        Object.prototype.hasOwnProperty.call(data, 'longitude') &&
        data.latitude !== undefined &&
        data.longitude !== undefined &&
        data.latitude !== null &&
        data.longitude !== null

      if (hasValidCoords) {
        const lng = Number(data.longitude)
        const lat = Number(data.latitude)

        if (!isNaN(lng) && !isNaN(lat)) {
          const address = data.city || data.region || data.country_name || '当前位置'
          return { lng, lat, address }
        }
      }
      return null
    } catch {
      return null
    }
  }, [])

  // 使用高德 Web API 进行 IP 定位（使用专门的 IP 定位 Key）
  const getLocationByIPWebAPI = useCallback(async (): Promise<{
    lng: number
    lat: number
    address: string
  } | null> => {
    const ipKey = import.meta.env.VITE_AMAP_IP_KEY
    if (!ipKey) return null

    try {
      // 首先获取客户端 IP 地址（使用多个备用服务）
      let clientIP = ''
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=text')
        clientIP = await ipResponse.text()
      } catch {
        try {
          const ipResponse = await fetch('https://checkip.amazonaws.com/')
          clientIP = await ipResponse.text()
        } catch {
          const ipResponse = await fetch('https://ipapi.co/ip/')
          clientIP = await ipResponse.text()
        }
      }

      if (!clientIP.trim()) {
        return null
      }

      // 使用获取到的 IP 调用高德 IP 定位 API
      const url = `https://restapi.amap.com/v3/ip?key=${ipKey}&ip=${clientIP.trim()}`

      const response = await fetch(url)
      const data = await response.json()

      // 检查 rectangle 是否存在且为有效字符串
      if (
        data.status === '1' &&
        data.rectangle &&
        typeof data.rectangle === 'string' &&
        data.rectangle.includes(';')
      ) {
        const coords = data.rectangle.split(';')
        if (coords.length === 2) {
          const [sw, ne] = coords
          const [swLng, swLat] = sw.split(',').map(Number)
          const [neLng, neLat] = ne.split(',').map(Number)
          // 确保解析出的坐标有效
          if (!isNaN(swLng) && !isNaN(swLat) && !isNaN(neLng) && !isNaN(neLat)) {
            const lng = (swLng + neLng) / 2
            const lat = (swLat + neLat) / 2
            const address = data.city || data.province || '当前城市中心'
            return { lng, lat, address }
          }
        }
      }
      return null
    } catch {
      return null
    }
  }, [])

  // 默认城市配置（当所有定位方式都失败时使用）
  const getDefaultLocation = useCallback((): { lng: number; lat: number; address: string } => {
    // 默认使用北京市中心
    return {
      lng: 116.407526,
      lat: 39.90403,
      address: '北京市中心（默认位置）',
    }
  }, [])

  // 使用 IP 定位作为降级方案（优先使用 Web API，失败时使用免费 API 或 JS API）
  const getLocationByIP = useCallback(async (): Promise<{
    lng: number
    lat: number
    address: string
  } | null> => {
    // 首先尝试使用高德 Web API（使用专门的 IP 定位 Key）
    const webAPIResult = await getLocationByIPWebAPI()
    if (webAPIResult) {
      return webAPIResult
    }

    // 高德 Web API 失败，尝试使用免费 IP 定位 API
    const freeAPIResult = await getLocationByIPFree()
    if (freeAPIResult) {
      return freeAPIResult
    }

    // 免费 API 也失败，尝试使用 JS API 的 CitySearch
    if (!AMap) return null
    return new Promise((resolve) => {
      const citySearch = new AMap.CitySearch()
      citySearch.getLocalCity((status: string, result: any) => {
        if (status === 'complete' && result) {
          // 优先使用 bounds 获取中心点
          if (result.bounds && result.bounds.getCenter) {
            const center = result.bounds.getCenter()
            const lng = center.lng
            const lat = center.lat
            const address = result.city || '当前城市中心'
            resolve({ lng, lat, address })
            return
          }
          // 如果没有 bounds，尝试使用 rectangle 解析中心点
          if (result.rectangle) {
            const coords = result.rectangle.split(';')
            if (coords.length === 2) {
              const [sw, ne] = coords
              const [swLng, swLat] = sw.split(',').map(Number)
              const [neLng, neLat] = ne.split(',').map(Number)
              const lng = (swLng + neLng) / 2
              const lat = (swLat + neLat) / 2
              const address = result.city || '当前城市中心'
              resolve({ lng, lat, address })
              return
            }
          }
          // 如果只有城市名，尝试使用 Geocoder 获取城市中心
          if (result.city) {
            const geocoder = new AMap.Geocoder()
            geocoder.getLocation(result.city, (geoStatus: string, geoResult: any) => {
              if (geoStatus === 'complete' && geoResult.geocodes && geoResult.geocodes.length > 0) {
                const location = geoResult.geocodes[0].location
                resolve({ lng: location.lng, lat: location.lat, address: result.city })
              } else {
                resolve(null)
              }
            })
            return
          }
        }
        resolve(null)
      })
    })
  }, [AMap, getLocationByIPWebAPI, getLocationByIPFree])

  // 获取当前定位
  const handleLocate = async () => {
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
        // GPS 定位失败，尝试 IP 定位
        message.info('GPS 定位失败，正在使用 IP 定位...')
        const ipLocation = await getLocationByIP()
        if (ipLocation) {
          const { lng, lat, address } = ipLocation
          const resolvedAddress = await getAddressByLngLat(lng, lat)

          if (mapRef.current) {
            mapRef.current.setCenter([lng, lat])
            markerRef.current.setPosition([lng, lat])
          } else if (mapContainerRef.current) {
            createMap(lng, lat)
          }

          setHasLocation(true)
          message.success('已获取当前城市位置')
          onLocate?.({ address: resolvedAddress || address, lng, lat })
        } else {
          // IP 定位也失败，使用默认位置
          message.info('IP 定位失败，使用默认位置...')
          const defaultLocation = getDefaultLocation()
          const { lng, lat, address } = defaultLocation
          const resolvedAddress = await getAddressByLngLat(lng, lat)

          if (mapRef.current) {
            mapRef.current.setCenter([lng, lat])
            markerRef.current.setPosition([lng, lat])
          } else if (mapContainerRef.current) {
            createMap(lng, lat)
          }

          setHasLocation(true)
          message.success('已使用默认位置（北京），请手动调整')
          onLocate?.({ address: resolvedAddress || address, lng, lat })
        }
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

// 使用 React.memo 避免不必要的重新渲染
export default React.memo(MapPreview, (prevProps, nextProps) => {
  // 只有当这些 props 真正变化时才重新渲染
  return (
    prevProps.address === nextProps.address &&
    prevProps.lng === nextProps.lng &&
    prevProps.lat === nextProps.lat &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showLocateButton === nextProps.showLocateButton
  )
})

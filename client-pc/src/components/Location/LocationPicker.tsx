import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Modal, Input, message, Spin, Button } from 'antd'
import { Search, Locate, MapPin } from 'lucide-react'
import AMapLoader from '@amap/amap-jsapi-loader'
import './LocationPicker.scss'

interface LocationPickerProps {
  open: boolean
  onClose: () => void
  onConfirm: (location: { address: string; lng: number; lat: number }) => void
  defaultAddress?: string
  defaultLng?: number
  defaultLat?: number
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  open,
  onClose,
  onConfirm,
  defaultAddress,
  defaultLng,
  defaultLat,
}) => {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [currentLng, setCurrentLng] = useState(116.397428)
  const [currentLat, setCurrentLat] = useState(39.90923)
  const [AMap, setAMap] = useState<any>(null)

  const getAddressByLngLat = useCallback(
    (lng: number, lat: number) => {
      if (!AMap) return

      const geocoder = new AMap.Geocoder()
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          const address = result.regeocode.formattedAddress
          setCurrentAddress(address)
          setCurrentLng(lng)
          setCurrentLat(lat)
        }
      })
    },
    [AMap]
  )

  const createMap = useCallback(
    (centerLng: number, centerLat: number) => {
      if (!AMap || !mapContainerRef.current) return

      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '2D',
        zoom: 15,
        center: [centerLng, centerLat],
      })

      mapRef.current = map

      const marker = new AMap.Marker({
        position: [centerLng, centerLat],
        draggable: true,
      })

      marker.setMap(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const position = marker.getPosition()
        getAddressByLngLat(position.lng, position.lat)
      })

      map.on('click', (e: any) => {
        marker.setPosition([e.lnglat.lng, e.lnglat.lat])
        getAddressByLngLat(e.lnglat.lng, e.lnglat.lat)
      })

      setLoading(false)
    },
    [AMap, getAddressByLngLat]
  )

  const initMap = useCallback(async () => {
    setLoading(true)
    try {
      window._AMapSecurityConfig = {
        securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY || '',
      }

      const amapInstance = await AMapLoader.load({
        key: import.meta.env.VITE_AMAP_KEY || '',
        version: '2.0',
        plugins: ['AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.CitySearch'],
      })

      setAMap(amapInstance)
    } catch {
      message.error('地图加载失败，请检查网络连接')
      setLoading(false)
    }
  }, [])

  // 根据地址搜索坐标
  const searchAddressLocation = useCallback(
    (address: string): Promise<{ lng: number; lat: number } | null> => {
      return new Promise((resolve) => {
        if (!AMap || !address) {
          resolve(null)
          return
        }
        const placeSearch = new AMap.PlaceSearch({ pageSize: 1, pageIndex: 1 })
        placeSearch.search(address, (status: string, result: any) => {
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

  // 用于追踪上一次的地址，避免重复查询
  const lastAddressRef = useRef<string>('')

  // 当弹窗打开或地址变化时，初始化地图并定位
  useEffect(() => {
    if (!open) return

    // 初始化地图 SDK
    if (!AMap) {
      requestIdleCallback(() => initMap(), { timeout: 100 })
      return
    }

    // 优先根据地址变化来定位（与预览组件保持一致）
    if (defaultAddress && defaultAddress !== lastAddressRef.current) {
      lastAddressRef.current = defaultAddress
      requestIdleCallback(
        async () => {
          setSearchText(defaultAddress)
          setCurrentAddress(defaultAddress)
          const location = await searchAddressLocation(defaultAddress)
          if (location) {
            setCurrentLng(location.lng)
            setCurrentLat(location.lat)
            // 如果地图已创建，平滑移动到新位置
            if (mapRef.current && markerRef.current) {
              mapRef.current.panTo([location.lng, location.lat])
              markerRef.current.setPosition([location.lng, location.lat])
            } else if (mapContainerRef.current && !mapRef.current) {
              // 创建地图并定位
              createMap(location.lng, location.lat)
            }
          } else {
            // 搜索失败，如果有坐标则使用坐标
            if (defaultLng && defaultLat) {
              setCurrentLng(defaultLng)
              setCurrentLat(defaultLat)
              if (mapContainerRef.current && !mapRef.current) {
                createMap(defaultLng, defaultLat)
              }
            } else {
              // 使用默认坐标
              if (mapContainerRef.current && !mapRef.current) {
                createMap(116.397428, 39.90923)
              }
            }
          }
        },
        { timeout: 100 }
      )
      return
    }

    // 地址没变但有坐标时，使用坐标
    if (defaultLng && defaultLat) {
      requestIdleCallback(
        () => {
          setCurrentLng(defaultLng)
          setCurrentLat(defaultLat)
          if (defaultAddress) {
            setCurrentAddress(defaultAddress)
            setSearchText(defaultAddress)
          }
          // 创建地图并定位
          if (mapContainerRef.current && !mapRef.current) {
            createMap(defaultLng, defaultLat)
          } else {
            // 地图已存在，直接结束加载
            setLoading(false)
          }
        },
        { timeout: 100 }
      )
      return
    }

    // 没有地址和坐标，使用默认位置
    if (!defaultAddress && !defaultLng && !defaultLat) {
      requestIdleCallback(
        () => {
          if (mapContainerRef.current && !mapRef.current) {
            createMap(116.397428, 39.90923)
          } else {
            setLoading(false)
          }
        },
        { timeout: 100 }
      )
    }
  }, [
    open,
    defaultAddress,
    defaultLng,
    defaultLat,
    AMap,
    initMap,
    createMap,
    searchAddressLocation,
  ])

  const handleSearch = () => {
    if (!searchText.trim() || !AMap || !mapRef.current) return

    const placeSearch = new AMap.PlaceSearch({
      pageSize: 1,
      pageIndex: 1,
    })

    placeSearch.search(searchText, (status: string, result: any) => {
      if (status === 'complete' && result.poiList?.pois?.length > 0) {
        const poi = result.poiList.pois[0]
        const { lng, lat } = poi.location

        mapRef.current.setCenter([lng, lat])
        markerRef.current.setPosition([lng, lat])
        setCurrentAddress(poi.address || poi.name)
        setCurrentLng(lng)
        setCurrentLat(lat)
      } else {
        message.warning('未找到相关位置')
      }
    })
  }

  // 使用免费的 ipapi.co 进行 IP 定位（备用方案）
  const getLocationByIPFree = useCallback(async (): Promise<{
    lng: number
    lat: number
    address: string
  } | null> => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()

      if (data.latitude && data.longitude) {
        const lng = data.longitude
        const lat = data.latitude
        const address = data.city || data.region || data.country_name || '当前位置'
        return { lng, lat, address }
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

  const handleLocate = async () => {
    if (!AMap || !mapRef.current) return

    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    })

    geolocation.getCurrentPosition(async (status: string, result: any) => {
      if (status === 'complete') {
        const { lng, lat } = result.position
        mapRef.current.setCenter([lng, lat])
        markerRef.current.setPosition([lng, lat])
        setCurrentAddress(result.formattedAddress)
        setCurrentLng(lng)
        setCurrentLat(lat)
      } else {
        // GPS 定位失败，尝试 IP 定位
        message.info('GPS 定位失败，正在使用 IP 定位...')
        const ipLocation = await getLocationByIP()
        if (ipLocation) {
          const { lng, lat, address } = ipLocation
          mapRef.current.setCenter([lng, lat])
          markerRef.current.setPosition([lng, lat])
          setCurrentAddress(address)
          setCurrentLng(lng)
          setCurrentLat(lat)
          message.success('已获取当前城市位置')
        } else {
          // IP 定位也失败，使用默认位置
          message.info('IP 定位失败，使用默认位置...')
          const defaultLocation = getDefaultLocation()
          const { lng, lat, address } = defaultLocation
          mapRef.current.setCenter([lng, lat])
          markerRef.current.setPosition([lng, lat])
          setCurrentAddress(address)
          setCurrentLng(lng)
          setCurrentLat(lat)
          message.success('已使用默认位置（北京），请手动调整')
        }
      }
    })
  }

  const handleConfirm = () => {
    onConfirm({
      address: currentAddress,
      lng: currentLng,
      lat: currentLat,
    })
    onClose()
  }

  const handleClose = () => {
    setSearchText('')
    // 关闭时销毁地图并重置地址追踪
    if (mapRef.current) {
      mapRef.current.destroy()
      mapRef.current = null
    }
    // 重置地址追踪，确保下次打开时重新定位
    lastAddressRef.current = ''
    onClose()
  }

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <Modal
      title="选择位置"
      open={open}
      onCancel={handleClose}
      onOk={handleConfirm}
      okText="确认选择"
      cancelText="取消"
      width={800}
      className="location-picker-modal"
      styles={{
        body: { height: 500, padding: 0 },
      }}
    >
      <div className="location-picker">
        <div className="location-search">
          <Input
            placeholder="搜索地点..."
            prefix={<Search size={16} />}
            suffix={
              <Button type="link" size="small" onClick={handleSearch} style={{ color: '#c58e53' }}>
                搜索
              </Button>
            }
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button
            type="primary"
            icon={<Locate size={18} style={{ marginTop: 3 }} />}
            onClick={handleLocate}
            style={{ marginTop: 4 }}
          >
            当前定位
          </Button>
        </div>

        <div className="location-map-wrapper">
          {loading && (
            <div className="location-loading">
              <Spin size="large" tip="地图加载中..." />
            </div>
          )}
          <div ref={mapContainerRef} className="location-map-container" />
        </div>

        <div className="location-info">
          <MapPin size={16} />
          <span className="location-address">{currentAddress || '请在地图上点击选择位置'}</span>
        </div>
      </div>
    </Modal>
  )
}

export default LocationPicker

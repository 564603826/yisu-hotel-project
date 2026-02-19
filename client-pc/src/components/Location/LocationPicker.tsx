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
        plugins: ['AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Geocoder'],
      })

      setAMap(amapInstance)
    } catch (error) {
      console.error('地图加载失败:', error)
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

  const handleLocate = () => {
    if (!AMap || !mapRef.current) return

    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    })

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        const { lng, lat } = result.position
        mapRef.current.setCenter([lng, lat])
        markerRef.current.setPosition([lng, lat])
        setCurrentAddress(result.formattedAddress)
        setCurrentLng(lng)
        setCurrentLat(lat)
      } else {
        message.error('获取定位失败，请检查浏览器定位权限')
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

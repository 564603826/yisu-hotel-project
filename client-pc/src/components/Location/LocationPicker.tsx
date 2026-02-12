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
  const [currentAddress, setCurrentAddress] = useState(defaultAddress || '')
  const [currentLng, setCurrentLng] = useState(defaultLng || 116.397428)
  const [currentLat, setCurrentLat] = useState(defaultLat || 39.90923)
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

  const createMap = useCallback(() => {
    if (!AMap || !mapContainerRef.current) return

    const map = new AMap.Map(mapContainerRef.current, {
      viewMode: '2D',
      zoom: 15,
      center: [currentLng, currentLat],
    })

    mapRef.current = map

    const marker = new AMap.Marker({
      position: [currentLng, currentLat],
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

    if (defaultAddress && defaultLng && defaultLat) {
      marker.setPosition([defaultLng, defaultLat])
      map.setCenter([defaultLng, defaultLat])
    }
  }, [AMap, currentLng, currentLat, defaultAddress, defaultLng, defaultLat, getAddressByLngLat])

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

  useEffect(() => {
    if (open && !AMap) {
      // 将地图初始化推迟到浏览器空闲时段，避免在 effect 中直接触发 setState
      requestIdleCallback(() => initMap(), { timeout: 100 })
    }
    if (open && AMap && mapContainerRef.current && !mapRef.current) {
      // 将地图创建推迟到浏览器空闲时段，避免在 effect 中直接触发 setState
      requestIdleCallback(() => createMap(), { timeout: 100 })
    }
  }, [open, AMap, initMap, createMap])

  useEffect(() => {
    if (defaultAddress) {
      // 将地址更新推迟到微任务，避免在 effect 中直接触发 setState
      queueMicrotask(() => setCurrentAddress(defaultAddress))
    }
    if (defaultLng && defaultLat) {
      queueMicrotask(() => setCurrentLng(defaultLng))
      queueMicrotask(() => setCurrentLat(defaultLat))
    }
  }, [defaultAddress, defaultLng, defaultLat])

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
            icon={<Locate size={16} />}
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

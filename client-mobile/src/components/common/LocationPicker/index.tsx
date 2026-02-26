import React, { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import './LocationPicker.scss';

// Extend Window interface to include AMap security config
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

interface LocationPickerProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (location: { address: string; lng: number; lat: number }) => void;
  defaultAddress?: string;
  defaultLng?: number;
  defaultLat?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  show,
  onClose,
  onConfirm,
  defaultAddress,
  defaultLng,
  defaultLat,
}) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentAddress, setCurrentAddress] = useState(defaultAddress || '');
  const [currentLng, setCurrentLng] = useState(defaultLng || 116.397428);
  const [currentLat, setCurrentLat] = useState(defaultLat || 39.90923);
  const [AMap, setAMap] = useState<any>(null);

  const getAddressByLngLat = useCallback(
    (lng: number, lat: number) => {
      if (!AMap) return;

      try {
        // 检查AMap.Geocoder是否存在
        if (typeof AMap.Geocoder === 'function') {
          const geocoder = new AMap.Geocoder();
          geocoder.getAddress([lng, lat], (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              const address = result.regeocode.formattedAddress;
              setCurrentAddress(address);
              setCurrentLng(lng);
              setCurrentLat(lat);
            }
          });
        } else {
          console.warn('AMap.Geocoder 不可用，无法获取地址信息');
          // 使用坐标作为地址
          setCurrentAddress(`坐标: ${lng}, ${lat}`);
          setCurrentLng(lng);
          setCurrentLat(lat);
        }
      } catch (error) {
        console.error('获取地址失败:', error);
        // 使用坐标作为地址
        setCurrentAddress(`坐标: ${lng}, ${lat}`);
        setCurrentLng(lng);
        setCurrentLat(lat);
      }
    },
    [AMap]
  );

  const createMap = useCallback(() => {
    console.log('开始创建地图实例');
    if (!AMap) {
      console.error('地图创建失败: AMap未初始化');
      return;
    }
    if (!mapContainerRef.current) {
      console.error('地图创建失败: 地图容器未找到');
      return;
    }
    
    console.log('地图容器:', mapContainerRef.current);
    console.log('地图配置:', {
      viewMode: '2D',
      zoom: 15,
      center: [currentLng, currentLat],
    });

    try {
      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '2D',
        zoom: 15,
        center: [currentLng, currentLat],
      });

      console.log('地图实例创建成功:', map);
      mapRef.current = map;

      const marker = new AMap.Marker({
        position: [currentLng, currentLat],
        draggable: true,
      });

      console.log('标记创建成功:', marker);
      marker.setMap(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getPosition();
        getAddressByLngLat(position.lng, position.lat);
      });

      map.on('click', (e: any) => {
        marker.setPosition([e.lnglat.lng, e.lnglat.lat]);
        getAddressByLngLat(e.lnglat.lng, e.lnglat.lat);
      });

      console.log('地图事件绑定成功');
      setLoading(false);
      console.log('地图加载完成');

      if (defaultAddress && defaultLng && defaultLat) {
        console.log('设置默认位置:', { defaultAddress, defaultLng, defaultLat });
        marker.setPosition([defaultLng, defaultLat]);
        map.setCenter([defaultLng, defaultLat]);
      }
    } catch (error) {
      console.error('地图创建失败:', error);
      alert('地图创建失败，请检查网络连接');
      setLoading(false);
    }
  }, [AMap, currentLng, currentLat, defaultAddress, defaultLng, defaultLat, getAddressByLngLat]);

  const initMap = useCallback(async () => {
    setLoading(true);
    console.log('开始初始化地图');
    try {
      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY || '',
      };

      // 使用@amap/amap-jsapi-loader加载API
      const amapInstance = await AMapLoader.load({
        key: import.meta.env.VITE_AMAP_KEY || '',
        version: '2.0',
        plugins: ['AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Geocoder'],
      });

      console.log('高德地图API加载成功');
      setAMap(amapInstance);
      setLoading(false);
    } catch (error) {
      console.error('地图加载失败:', error);
      alert('地图加载失败，请检查网络连接');
      setLoading(false);
    }
  }, []);
  
  // 全局错误处理，捕获高德地图API的错误
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('USERKEY_PLAT_NOMATCH')) {
        console.warn('高德地图API密钥与平台不匹配，这可能会影响部分功能，但基本地图功能仍可使用');
      } else if (event.message.includes('Unimplemented type: 3')) {
        console.warn('高德地图API内部错误，基本地图功能仍可使用');
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (show && !AMap) {
      console.log('显示定位选择器，开始初始化地图');
      // 直接调用initMap，不使用requestIdleCallback
      initMap();
    }
    if (show && AMap && mapContainerRef.current && !mapRef.current) {
      console.log('地图API已初始化，开始创建地图实例');
      // 直接调用createMap，不使用requestIdleCallback
      createMap();
    }
  }, [show, AMap, initMap, createMap]);

  useEffect(() => {
    if (defaultAddress) {
      queueMicrotask(() => setCurrentAddress(defaultAddress));
    }
    if (defaultLng && defaultLat) {
      queueMicrotask(() => setCurrentLng(defaultLng));
      queueMicrotask(() => setCurrentLat(defaultLat));
    }
  }, [defaultAddress, defaultLng, defaultLat]);

  const handleSearch = () => {
    if (!searchText.trim() || !AMap || !mapRef.current) return;

    try {
      // 检查AMap.PlaceSearch是否存在
      if (typeof AMap.PlaceSearch === 'function') {
        const placeSearch = new AMap.PlaceSearch({
          pageSize: 1,
          pageIndex: 1,
        });

        placeSearch.search(searchText, (status: string, result: any) => {
          if (status === 'complete' && result.poiList?.pois?.length > 0) {
            const poi = result.poiList.pois[0];
            if (poi.location) {
              const { lng, lat } = poi.location;

              mapRef.current.setCenter([lng, lat]);
              markerRef.current.setPosition([lng, lat]);
              setCurrentAddress(poi.address || poi.name);
              setCurrentLng(lng);
              setCurrentLat(lat);
            } else {
              alert('未找到相关位置的坐标信息');
            }
          } else {
            alert('未找到相关位置');
          }
        });
      } else {
        console.warn('AMap.PlaceSearch 不可用，搜索功能暂时无法使用');
        alert('搜索功能暂时无法使用，请直接在地图上选择位置');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请直接在地图上选择位置');
    }
  };

  const handleLocate = () => {
    if (!AMap || !mapRef.current) return;

    try {
      // 检查AMap.Geolocation是否存在
      if (typeof AMap.Geolocation === 'function') {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        geolocation.getCurrentPosition((status: string, result: any) => {
          if (status === 'complete') {
            if (result.position) {
              const { lng, lat } = result.position;
              mapRef.current.setCenter([lng, lat]);
              markerRef.current.setPosition([lng, lat]);
              setCurrentAddress(result.formattedAddress || `坐标: ${lng}, ${lat}`);
              setCurrentLng(lng);
              setCurrentLat(lat);
            } else {
              alert('获取定位失败，未返回位置信息');
            }
          } else {
            alert('获取定位失败，请检查浏览器定位权限');
          }
        });
      } else {
        console.warn('AMap.Geolocation 不可用，定位功能暂时无法使用');
        alert('定位功能暂时无法使用，请直接在地图上选择位置');
      }
    } catch (error) {
      console.error('定位失败:', error);
      alert('定位失败，请直接在地图上选择位置');
    }
  };

  const handleConfirm = () => {
    onConfirm({
      address: currentAddress,
      lng: currentLng,
      lat: currentLat,
    });
    onClose();
  };

  const handleClose = () => {
    setSearchText('');
    onClose();
  };

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  if (!show) return null;

  return (
    <div className="location-picker-overlay">
      <div className="location-picker-modal">
        <div className="location-picker-header">
          <h3>选择位置</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        <div className="location-picker">
          <div className="location-search">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="搜索地点..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-button" onClick={handleSearch}>
                搜索
              </button>
            </div>
            <button className="locate-button" onClick={handleLocate}>
              📍 当前定位
            </button>
          </div>

          <div className="location-map-wrapper">
            {loading && (
              <div className="location-loading">
                <div>地图加载中...</div>
              </div>
            )}
            <div ref={mapContainerRef} className="location-map-container" />
          </div>

          <div className="location-info">
            📍
            <span className="location-address">
              {currentAddress || '请在地图上点击选择位置'}
            </span>
          </div>

          <div className="location-actions">
            <button className="cancel-button" onClick={handleClose}>
              取消
            </button>
            <button className="confirm-button" onClick={handleConfirm}>
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
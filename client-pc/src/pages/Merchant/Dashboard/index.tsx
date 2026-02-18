import React, { useCallback, useState } from 'react'
import { Row, Col, Typography, Spin } from 'antd'
import { Users, DoorOpen, DollarSign, Pencil, BedDouble, RefreshCw } from 'lucide-react'
import styles from './MerchantDashboard.module.scss'
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/MerchantDashboard/StatCard'
import ActionCard from '@/components/MerchantDashboard/ActionCard'
import WhiteCard from '@/components/MerchantDashboard/WhiteCard'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useMerchantStore } from '@/store'

const { Title, Text } = Typography

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { hotelInfo, getHotelInfo } = useMerchantStore()
  const [loading, setLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // 获取酒店信息的函数 - 使用 useCallback 避免无限循环
  const fetchHotelData = useCallback(async () => {
    setLoading(true)
    try {
      await getHotelInfo()
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('获取酒店信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [getHotelInfo])

  // 使用自动刷新 Hook，每 30 秒刷新一次
  const { refresh } = useAutoRefresh(fetchHotelData, {
    interval: 30000, // 30秒
    refreshOnVisible: true, // 页面可见时立即刷新
    enabled: true,
  })

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2}>
              欢迎回来,{' '}
              <span style={{ color: '#c58e53' }}>{hotelInfo?.nameZh || '四季御苑酒店'}</span>
            </Title>
            <Text type="secondary">这是您今天的运营概况。</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {loading && <Spin size="small" />}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              上次更新: {formatUpdateTime(lastUpdateTime)}
            </Text>
            <RefreshCw
              size={18}
              style={{ cursor: 'pointer', color: '#c58e53' }}
              onClick={refresh}
              className={loading ? styles.spinning : ''}
            />
          </div>
        </div>
        {/* 酒店状态标签 */}
        {hotelInfo && (
          <div style={{ marginTop: '12px' }}>
            <span
              className={`${styles.statusTag} ${
                hotelInfo.status === 'draft'
                  ? styles.statusDraft
                  : hotelInfo.status === 'pending'
                    ? styles.statusPending
                    : hotelInfo.status === 'approved'
                      ? styles.statusApproved
                      : hotelInfo.status === 'published'
                        ? styles.statusPublished
                        : hotelInfo.status === 'rejected'
                          ? styles.statusRejected
                          : hotelInfo.status === 'offline'
                            ? styles.statusOffline
                            : styles.statusDraft
              }`}
            >
              {hotelInfo.status === 'draft'
                ? '草稿'
                : hotelInfo.status === 'pending'
                  ? '审核中'
                  : hotelInfo.status === 'approved'
                    ? '审核通过'
                    : hotelInfo.status === 'published'
                      ? '已发布'
                      : hotelInfo.status === 'rejected'
                        ? '已驳回'
                        : hotelInfo.status === 'offline'
                          ? '已下线'
                          : hotelInfo.status}
            </span>
            {hotelInfo.draftData && <span className={styles.draftBadge}>有待审核的修改</span>}
          </div>
        )}
      </div>

      {/* 1. 顶部数据 - 白色卡片 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <StatCard
            title="今日入住 (位)"
            value="24"
            icon={<Users size={22} />}
            trend="+12%"
            isUp={true}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="剩余房量 (间)"
            value="08"
            icon={<DoorOpen size={22} />}
            trend="-5%"
            isUp={false}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="今日总营收 (¥)"
            value="48,290"
            icon={<DollarSign size={22} />}
            trend="+8.5%"
            isUp={true}
          />
        </Col>
      </Row>

      {/* 2. 中间操作 - 保持现在的样子 */}
      <div className={styles.section}>
        <Title level={4} className={styles.sectionTitle}>
          快捷操作
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <ActionCard
              title="编辑酒店信息"
              desc="更新设施、图片或基本信息"
              onClick={() => navigate('/merchant/hotels')}
              icon={<Pencil size={22} />}
              primary
            />
          </Col>
          <Col xs={24} md={8}>
            <ActionCard title="房型管理" desc="调整房价、库存状态" icon={<BedDouble size={22} />} />
          </Col>
          <Col xs={24} md={8}>
            <ActionCard title="查看订单" desc="处理新的预订申请" icon={<Users size={22} />} />
          </Col>
        </Row>
      </div>

      {/* 3. 底部动态 - 白色卡片 */}
      <div className={styles.section}>
        <Title level={4} className={styles.sectionTitle}>
          实时动态
        </Title>
        <WhiteCard style={{ minHeight: 'auto' }}>
          <div className={styles.activityList}>
            {[1, 2, 3].map((_, index) => (
              <div key={index} className={styles.activityItem}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={styles.dot} />
                  <span className={styles.activityText}>新订单: 豪华海景大床房 x 1 晚</span>
                </div>
                <span className={styles.activityTime}>{(index + 1) * 15} 分钟前</span>
              </div>
            ))}
          </div>
        </WhiteCard>
      </div>
    </div>
  )
}

export default MerchantDashboard

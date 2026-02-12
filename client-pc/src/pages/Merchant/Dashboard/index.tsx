import React from 'react'
import { Row, Col, Typography } from 'antd'
import { Users, DoorOpen, DollarSign, TrendingUp, Pencil, BedDouble } from 'lucide-react'
import styles from './MerchantDashboard.module.scss'
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/MerchantDashboard/StatCard'
import ActionCard from '@/components/MerchantDashboard/ActionCard'
import WhiteCard from '@/components/MerchantDashboard/WhiteCard'

const { Title, Text } = Typography

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeSection}>
        <Title level={2}>
          欢迎回来, <span style={{ color: '#c58e53' }}>四季御苑酒店</span>
        </Title>
        <Text type="secondary">这是您今天的运营概况。</Text>
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

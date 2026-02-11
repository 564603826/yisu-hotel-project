import React from 'react'
import { Row, Col, Typography } from 'antd'
import {
  Users,
  DoorOpen,
  DollarSign,
  TrendingUp,
  Pencil,
  BedDouble,
  ChevronRight,
} from 'lucide-react'
import styles from './MerchantDashboard.module.scss'

const { Title, Text } = Typography

// 1. 顶部统计卡片 (不再使用 Antd Card，改用 div.whiteCard)
const StatCard = ({ title, value, icon: Icon, trend, isUp }: any) => (
  <div className={styles.whiteCard}>
    <div className={styles.statCardHeader}>
      <div>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {title}
        </Text>
        <Title level={2} style={{ margin: '4px 0 0 0', fontFamily: 'Playfair Display' }}>
          {value}
        </Title>
      </div>
      <div className={styles.iconBox}>
        <Icon size={22} />
      </div>
    </div>

    <div className={styles.trend}>
      <TrendingUp size={14} style={{ marginRight: 4 }} />
      {/* 根据涨跌变色 */}
      <span className={`${styles.trendValue} ${isUp ? styles.up : styles.down}`}>{trend}</span>
      <span className={styles.trendLabel}> 较昨日</span>
    </div>
  </div>
)

// 2. 快捷操作卡片
const ActionCard = ({ title, desc, icon: Icon, primary = false }: any) => (
  <div className={`${styles.actionCard} ${primary ? styles.primary : ''}`}>
    <div className={styles.actionContent}>
      <div className={styles.actionIcon}>
        <Icon size={22} />
      </div>
      <div>
        <div className={styles.actionTitle}>{title}</div>
        <div className={styles.actionDesc}>{desc}</div>
      </div>
    </div>
    <ChevronRight className={styles.arrow} size={20} />
  </div>
)

const MerchantDashboard: React.FC = () => {
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
          <StatCard title="今日入住 (位)" value="24" icon={Users} trend="+12%" isUp={true} />
        </Col>
        <Col xs={24} md={8}>
          <StatCard title="剩余房量 (间)" value="08" icon={DoorOpen} trend="-5%" isUp={false} />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="今日总营收 (¥)"
            value="48,290"
            icon={DollarSign}
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
              icon={Pencil}
              primary // 👈 只有这个是金色的
            />
          </Col>
          <Col xs={24} md={8}>
            <ActionCard title="房型管理" desc="调整房价、库存状态" icon={BedDouble} />
          </Col>
          <Col xs={24} md={8}>
            <ActionCard title="查看订单" desc="处理新的预订申请" icon={Users} />
          </Col>
        </Row>
      </div>

      {/* 3. 底部动态 - 白色卡片 */}
      <div className={styles.section}>
        <Title level={4} className={styles.sectionTitle}>
          实时动态
        </Title>
        {/* 这里也不用 Antd Card，用我们自定义的 whiteCard */}
        <div className={styles.whiteCard} style={{ minHeight: 'auto' }}>
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
        </div>
      </div>
    </div>
  )
}

export default MerchantDashboard

import React from 'react'
import { Row, Col, Typography, Table, Tag, Button, Space } from 'antd'
import { FileClock, CheckCircle2, Building } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import styles from './AdminDashboard.module.scss'

const { Title, Text } = Typography

// Mock Data
interface DataType {
  key: string
  hotelName: string
  submitter: string
  time: string
  status: string
}

const data: DataType[] = [
  {
    key: '1',
    hotelName: '云端喜来登度假村',
    submitter: '王经理',
    time: '2023-10-24 10:30',
    status: 'pending',
  },
  {
    key: '2',
    hotelName: '西湖雅致精品酒店',
    submitter: '李女士',
    time: '2023-10-24 09:15',
    status: 'pending',
  },
  {
    key: '3',
    hotelName: '星际商务公寓',
    submitter: '张先生',
    time: '2023-10-23 18:45',
    status: 'pending',
  },
  {
    key: '4',
    hotelName: '莫干山隐居',
    submitter: '赵老板',
    time: '2023-10-23 14:20',
    status: 'approved',
  },
]

const columns: ColumnsType<DataType> = [
  {
    title: '酒店名称',
    dataIndex: 'hotelName',
    key: 'hotelName',
    render: (text) => (
      <span style={{ fontWeight: 'bold', fontFamily: 'Playfair Display', color: '#292524' }}>
        {text}
      </span>
    ),
  },
  {
    title: '提交人',
    dataIndex: 'submitter',
    key: 'submitter',
    render: (text) => <span style={{ color: '#57534e' }}>{text}</span>,
  },
  {
    title: '提交时间',
    dataIndex: 'time',
    key: 'time',
    render: (text) => (
      <span className="font-mono text-stone-400" style={{ fontSize: 12 }}>
        {text}
      </span>
    ),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag
        color={status === 'pending' ? 'gold' : 'green'}
        style={{ borderRadius: 4, border: 'none', padding: '0 8px' }}
      >
        {status === 'pending' ? '待审核' : '已通过'}
      </Tag>
    ),
  },
  {
    title: '操作',
    key: 'action',
    align: 'right',
    render: () => (
      <Space>
        <Button
          size="small"
          type="primary"
          ghost
          style={{ borderColor: '#c58e53', color: '#c58e53' }}
        >
          审核
        </Button>
      </Space>
    ),
  },
]

const AdminDashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* 顶部标题栏 */}
      <div className={styles.header}>
        <Title level={2}>平台概览</Title>
        <div className={styles.date}>
          <Text type="secondary">系统最后更新: </Text>
          <Text strong style={{ color: '#c58e53' }}>
            2023-10-24 14:00:23
          </Text>
        </div>
      </div>

      {/* 统计卡片区 - 使用 .whiteCard */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* 1. 待审核 - 红色卡片 */}
        <Col xs={24} md={8}>
          <div className={styles.cardRed}>
            <div className={styles.statCardContent}>
              <div className={`${styles.iconCircle} ${styles.red}`}>
                <FileClock size={28} />
              </div>
              <div>
                <Text>待审核酒店</Text>
                <Title level={2} style={{ margin: 0, fontFamily: 'Playfair Display' }}>
                  12
                </Title>
              </div>
            </div>
          </div>
        </Col>

        {/* 2. 今日通过 - 绿色卡片 */}
        <Col xs={24} md={8}>
          <div className={styles.cardGreen}>
            <div className={styles.statCardContent}>
              <div className={`${styles.iconCircle} ${styles.green}`}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <Text>今日通过</Text>
                <Title level={2} style={{ margin: 0, fontFamily: 'Playfair Display' }}>
                  05
                </Title>
              </div>
            </div>
          </div>
        </Col>

        {/* 3. 平台总数 - 暖灰色卡片 */}
        <Col xs={24} md={8}>
          <div className={styles.cardStone}>
            <div className={styles.statCardContent}>
              <div className={`${styles.iconCircle} ${styles.stone}`}>
                <Building size={28} />
              </div>
              <div>
                <Text>平台收录总数</Text>
                <Title level={2} style={{ margin: 0, fontFamily: 'Playfair Display' }}>
                  1,240
                </Title>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 底部表格区 - 使用 .whiteCard */}
      <div className={styles.whiteCard} style={{ padding: '24px 32px' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <span className={styles.redDot} />
            审核队列预览
          </div>
          <Button type="link" style={{ color: '#c58e53' }}>
            查看全部 &rarr;
          </Button>
        </div>

        <Table columns={columns} dataSource={data} pagination={false} rowKey="key" />
      </div>
    </div>
  )
}

export default AdminDashboard

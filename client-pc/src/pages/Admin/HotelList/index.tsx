import React, { useState } from 'react'
import { Button, Tag, Space, Modal, Tooltip, Input } from 'antd'
import { CheckCircle, XCircle, RefreshCw, Power } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import styles from './AdminHotelList.module.scss'
import TabSwitcher from '@/components/AdminList/TabSwitcher'
import Toolbar from '@/components/AdminList/Toolbar'
import HotelInfoCell from '@/components/AdminList/HotelInfoCell'
import PriceCell from '@/components/AdminList/PriceCell'
import TableCard from '@/components/AdminList/TableCard'

const { TextArea } = Input

interface DataType {
  id: string
  hotelName: string
  submitter: string
  location: string
  price: number
  time: string
  status: 'pending' | 'approved' | 'rejected'
  onlineStatus: 'online' | 'offline'
}

const MOCK_DATA: DataType[] = [
  {
    id: '1',
    hotelName: '云端喜来登度假村',
    submitter: '王经理',
    location: '三亚',
    price: 2500,
    time: '2023-10-24 10:30',
    status: 'pending',
    onlineStatus: 'offline',
  },
  {
    id: '2',
    hotelName: '西湖雅致精品酒店',
    submitter: '李女士',
    location: '杭州',
    price: 1200,
    time: '2023-10-24 09:15',
    status: 'approved',
    onlineStatus: 'online',
  },
  {
    id: '3',
    hotelName: '星际商务公寓',
    submitter: '张先生',
    location: '上海',
    price: 680,
    time: '2023-10-23 18:45',
    status: 'rejected',
    onlineStatus: 'offline',
  },
  {
    id: '4',
    hotelName: '莫干山隐居',
    submitter: '赵老板',
    location: '莫干山',
    price: 3200,
    time: '2023-10-22 14:20',
    status: 'approved',
    onlineStatus: 'online',
  },
]

const AdminHotelList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'management'>('audit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, setCurrentId] = useState<string>('')

  const listData = MOCK_DATA.filter((item) =>
    activeTab === 'audit' ? true : item.status === 'approved'
  )

  const handleReject = (id: string) => {
    setCurrentId(id)
    setIsModalOpen(true)
  }

  const columns: ColumnsType<DataType> = [
    {
      title: '酒店信息',
      key: 'info',
      render: (_, record) => (
        <HotelInfoCell id={record.id} hotelName={record.hotelName} submitter={record.submitter} />
      ),
    },
    {
      title: '位置/价格',
      key: 'location',
      render: (_, record) => <PriceCell location={record.location} price={record.price} />,
    },
    {
      title: activeTab === 'audit' ? '提交时间' : '更新时间',
      dataIndex: 'time',
      key: 'time',
      render: (text) => <span style={{ fontFamily: 'monospace', color: '#999' }}>{text}</span>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        if (activeTab === 'audit') {
          const map = {
            pending: { color: 'gold', text: '待审核' },
            approved: { color: 'green', text: '已通过' },
            rejected: { color: 'red', text: '已驳回' },
          }
          const s = map[record.status]
          return (
            <Tag color={s.color} style={{ borderRadius: 12 }}>
              {s.text}
            </Tag>
          )
        } else {
          return (
            <Space>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: record.onlineStatus === 'online' ? '#52c41a' : '#d9d9d9',
                }}
              />
              <span style={{ color: record.onlineStatus === 'online' ? '#52c41a' : '#999' }}>
                {record.onlineStatus === 'online' ? '已上线' : '已下线'}
              </span>
            </Space>
          )
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          {activeTab === 'audit' && record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button
                  type="text"
                  shape="circle"
                  icon={<CheckCircle size={18} color="#52c41a" />}
                />
              </Tooltip>
              <Tooltip title="驳回">
                <Button
                  type="text"
                  shape="circle"
                  danger
                  icon={<XCircle size={18} />}
                  onClick={() => handleReject(record.id)}
                />
              </Tooltip>
            </>
          )}

          {activeTab === 'management' && (
            <>
              <Button
                type="link"
                size="small"
                style={{ color: '#999' }}
                icon={<RefreshCw size={14} />}
              >
                恢复
              </Button>
              <Button
                type="link"
                size="small"
                danger={record.onlineStatus === 'online'}
                style={{ color: record.onlineStatus === 'online' ? undefined : '#52c41a' }}
                icon={<Power size={14} />}
              >
                {record.onlineStatus === 'online' ? '下线' : '上线'}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className="pageHeader">
        <div>
          <h2>{activeTab === 'audit' ? '酒店信息审核' : '平台酒店管理'}</h2>
          <p>
            {activeTab === 'audit'
              ? '审批商户提交的酒店资料，确保信息真实有效。'
              : '管理已发布酒店的上下线状态及运营数据。'}
          </p>
        </div>

        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <Toolbar />

      <TableCard columns={columns} dataSource={listData} rowKey="id" pagination={{ pageSize: 5 }} />

      <Modal
        title="审核不通过"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 12, color: '#666' }}>请填写驳回原因，该信息将反馈给商户。</p>
        <TextArea rows={4} placeholder="例如：营业执照模糊，请重新上传..." />
      </Modal>
    </div>
  )
}

export default AdminHotelList

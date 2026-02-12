import React, { useState } from 'react'
import { Form, Button, Space, Typography } from 'antd'
import { Save } from 'lucide-react'
import styles from './MerchantHotelForm.module.scss'
import dayjs from 'dayjs'
import CustomTabs from '@/components/MerchantForm/CustomTabs'
import FormCard from '@/components/MerchantForm/FormCard'
import BasicInfoForm from '@/components/MerchantForm/BasicInfoForm'
import RoomList from '@/components/MerchantForm/RoomList'

const { Title, Text } = Typography

const MerchantHotelForm: React.FC = () => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')

  const initialValues = {
    nameCn: '四季御苑酒店',
    nameEn: 'Four Seasons Garden Hotel',
    address: '北京市朝阳区建国路88号',
    starRating: 5,
    openDate: dayjs('2018-05-20'),
    description: '位于市中心的高端豪华酒店，提供极致的住宿体验...',
  }

  const mockRooms = [
    {
      id: '1',
      name: '豪华海景大床房',
      description: '50m² | 大床 | 含早',
      price: 1280,
      image: 'https://picsum.photos/100/100',
    },
    {
      id: '2',
      name: '行政尊贵套房',
      description: '85m² | 特大床 | 行政权益',
      price: 2580,
      image: 'https://picsum.photos/101/101',
    },
  ]

  return (
    <div className={styles.container}>
      <div className="pageHeader">
        <div>
          <h2>酒店信息管理</h2>
          <p>请完善您的酒店资料，审核通过后将展示在客户端。</p>
        </div>
        <Space>
          <Button size="large">保存草稿</Button>
          <Button size="large" className="btn-primary-gold" icon={<Save size={18} />}>
            提交审核
          </Button>
        </Space>
      </div>

      <CustomTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'basic', label: '基本信息' },
          { key: 'rooms', label: '房型与价格' },
          { key: 'marketing', label: '营销与位置' },
        ]}
      />

      <FormCard>
        <Form form={form} layout="vertical" initialValues={initialValues}>
          {activeTab === 'basic' && <BasicInfoForm initialValues={initialValues} />}
          {activeTab === 'rooms' && (
            <RoomList
              rooms={mockRooms}
              onAddRoom={() => console.log('add room')}
              onEditRoom={(id) => console.log('edit room', id)}
              onDeleteRoom={(id) => console.log('delete room', id)}
            />
          )}
          {activeTab === 'marketing' && (
            <div style={{ color: '#999', padding: '40px', textAlign: 'center' }}>
              此处可放置营销信息表单 (逻辑同上)
            </div>
          )}
        </Form>
      </FormCard>
    </div>
  )
}

export default MerchantHotelForm

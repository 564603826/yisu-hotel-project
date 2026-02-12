import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import '@/components/AdminList/index.scss'

interface TableCardProps<T> {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: string | ((record: T) => string)
  pagination?: any
}

function TableCard<T>({ columns, dataSource, rowKey, pagination }: TableCardProps<T>) {
  return (
    <div className="table-card">
      <Table columns={columns} dataSource={dataSource} rowKey={rowKey} pagination={pagination} />
    </div>
  )
}

export default TableCard

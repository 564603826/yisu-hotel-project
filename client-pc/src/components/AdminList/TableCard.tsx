import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import styles from './TableCard.module.scss'

interface TableCardProps<T> {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: string | ((record: T) => string)
  pagination?: any
}

function TableCard<T>({ columns, dataSource, rowKey, pagination }: TableCardProps<T>) {
  return (
    <div className={styles.tableCard}>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        pagination={pagination}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}

export default TableCard

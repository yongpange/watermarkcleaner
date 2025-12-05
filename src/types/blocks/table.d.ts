import { ReactNode } from 'react';

export interface TableColumn {
  name?: string;
  title?: string;
  type?: string;
  options?: TableColumnOption[];
  className?: string;
  callback?: (item: TableDataItem) => TableDataItem | string | number | boolean | ReactNode | undefined;
}

export interface TableColumnOption {
  value: string | number;
  label: string;
}

export interface TableDataItem {
  [key: string]: unknown;
}

export interface Table {
  columns?: TableColumn[];
  data?: TableDataItem[];
  emptyMessage?: string;
}

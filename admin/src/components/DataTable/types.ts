import type { ReactNode } from "react";

export type SortDir = "asc" | "desc";

export interface Column<T> {
  /** Unique key; also used as the sort field (must match the server sort key in server mode). */
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render: (row: T) => ReactNode;
  /** Client mode: text to match against the search box (defaults to none). */
  searchValue?: (row: T) => string;
  /** Client mode: value used to sort this column (string or number). */
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: ReadonlyArray<T>;
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyLabel?: string;

  /** Total row count (server mode). In client mode this is derived. */
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;

  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;

  /** Multi-select + bulk delete. Omit onBulkDelete to hide selection. */
  onBulkDelete?: (ids: string[]) => Promise<void> | void;

  /** Per-row trailing actions (Edit / Delete buttons etc.). */
  renderActions?: (row: T) => ReactNode;

  /** Slots: status-filter chips on the left, an Add button on the right. */
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;

  /** Noun used in the pager/bulk copy, e.g. "order". */
  noun?: string;
}

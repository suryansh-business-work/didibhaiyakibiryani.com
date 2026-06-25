import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import type { Column, SortDir } from "./types";

interface Options {
  pageSize?: number;
  initialSortKey?: string;
  initialSortDir?: SortDir;
}

/**
 * Drives an in-browser DataTable for bounded reference lists: filters, sorts and
 * paginates the full `allRows` array client-side using each column's
 * `searchValue`/`sortValue`. Returns the controlled props the table needs.
 */
export function useClientTable<T>(allRows: ReadonlyArray<T>, columns: ReadonlyArray<Column<T>>, options?: Options) {
  const { pageSize = 15, initialSortKey = "", initialSortDir = "asc" } = options ?? {};
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return allRows;
    const cols = columns.filter((c) => c.searchValue);
    return allRows.filter((r) => cols.some((c) => (c.searchValue ? c.searchValue(r).toLowerCase().includes(q) : false)));
  }, [allRows, columns, debounced]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    const getVal = col?.sortValue;
    if (!getVal) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, columns, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [debounced, sortKey, sortDir, allRows]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  function onSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const tableProps = {
    rows,
    total,
    page: current,
    pageSize,
    onPageChange: setPage,
    search,
    onSearchChange: setSearch,
    sortKey,
    sortDir,
    onSort,
  };

  return { tableProps };
}

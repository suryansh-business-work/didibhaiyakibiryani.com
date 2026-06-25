import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import type { SortDir } from "./types";

interface Options {
  pageSize?: number;
  initialSortKey?: string;
  initialSortDir?: SortDir;
}

/**
 * Drives a server-paginated DataTable: owns search (debounced), page, and sort,
 * and exposes GraphQL `variables` plus the controlled props the table needs.
 * The page supplies `rows`/`total` from the query result itself.
 */
export function useServerTable(options?: Options) {
  const { pageSize = 15, initialSortKey = "createdAt", initialSortDir = "desc" } = options ?? {};
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  // Any change to the query inputs should bring the user back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, sortDir]);

  function onSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const variables = {
    search: debouncedSearch.trim() || null,
    sortBy: sortKey,
    sortDir: sortDir === "asc" ? "ASC" : "DESC",
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };

  const tableProps = {
    page,
    pageSize,
    onPageChange: setPage,
    search: searchInput,
    onSearchChange: setSearchInput,
    sortKey,
    sortDir,
    onSort,
  };

  return { variables, tableProps, setPage };
}

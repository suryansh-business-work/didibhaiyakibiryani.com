import { useState } from "react";
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { AsyncList } from "../ui";
import type { Column, DataTableProps } from "./types";

/**
 * A controlled, server-or-client driven table: debounced search, sortable
 * headers, multi-select + bulk delete, and pagination. Pair with `useServerTable`
 * (server pagination) or `useClientTable` (in-browser) to feed its props.
 */
export default function DataTable<T>(props: Readonly<DataTableProps<T>>) {
  const {
    columns, rows, rowKey, loading, emptyLabel = "Nothing here yet.",
    total, page, pageSize, onPageChange,
    search, onSearchChange, searchPlaceholder = "Search…",
    sortKey, sortDir, onSort,
    onBulkDelete, renderActions, toolbarStart, toolbarEnd, noun = "row",
  } = props;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectable = Boolean(onBulkDelete);

  const pageIds = rows.map(rowKey);
  const pageAllChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeChecked = pageIds.some((id) => selected.has(id));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (pageAllChecked) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }
  async function runBulkDelete() {
    const ids = [...selected];
    if (!ids.length || !onBulkDelete) return;
    setBulkBusy(true);
    try {
      await onBulkDelete(ids);
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        {toolbarStart}
        <div className="spacer" />
        <input
          className="search-input"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ minWidth: 220 }}
        />
        {toolbarEnd}
      </div>

      {selectable && selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <button className="btn btn-danger btn-sm" disabled={bulkBusy} onClick={runBulkDelete}>
            {bulkBusy ? "Deleting…" : `Delete ${selected.size}`}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="card">
        <AsyncList loading={Boolean(loading)} empty={total === 0} emptyLabel={emptyLabel}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={pageAllChecked}
                        indeterminate={!pageAllChecked && pageSomeChecked}
                        onChange={toggleAll}
                        inputProps={{ "aria-label": "Select all on page" }}
                      />
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <HeaderCell key={c.key} column={c} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  ))}
                  {renderActions ? <TableCell /> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const id = rowKey(row);
                  return (
                    <TableRow key={id} hover selected={selected.has(id)}>
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox size="small" checked={selected.has(id)} onChange={() => toggleRow(id)} inputProps={{ "aria-label": "Select row" }} />
                        </TableCell>
                      )}
                      {columns.map((c) => (
                        <TableCell key={c.key} align={c.align}>{c.render(row)}</TableCell>
                      ))}
                      {renderActions ? (
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{renderActions(row)}</TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <div className="pager">
            <span className="muted">{total} {noun}(s) · page {Math.min(page, totalPages)} of {totalPages}</span>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
          </div>
        </AsyncList>
      </div>
    </>
  );
}

function HeaderCell<T>({
  column, sortKey, sortDir, onSort,
}: Readonly<{ column: Column<T>; sortKey: string; sortDir: "asc" | "desc"; onSort: (key: string) => void }>) {
  if (!column.sortable) {
    return <TableCell align={column.align}>{column.label}</TableCell>;
  }
  return (
    <TableCell align={column.align} sortDirection={sortKey === column.key ? sortDir : false}>
      <TableSortLabel
        active={sortKey === column.key}
        direction={sortKey === column.key ? sortDir : "asc"}
        onClick={() => onSort(column.key)}
      >
        {column.label}
      </TableSortLabel>
    </TableCell>
  );
}

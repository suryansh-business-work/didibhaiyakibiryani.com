import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useClientTable } from "../useClientTable";
import type { Column } from "../types";

interface Row {
  id: string;
  name: string;
  price: number;
}

const rows: Row[] = [
  { id: "1", name: "Charlie", price: 30 },
  { id: "2", name: "alpha", price: 10 },
  { id: "3", name: "Bravo", price: 20 },
];

const columns: Column<Row>[] = [
  {
    key: "name",
    label: "Name",
    render: (r) => r.name,
    searchValue: (r) => r.name,
    sortValue: (r) => r.name,
  },
  {
    key: "price",
    label: "Price",
    render: (r) => r.price,
    sortValue: (r) => r.price,
  },
  // A column with neither searchValue nor sortValue to exercise the skip branches.
  {
    key: "plain",
    label: "Plain",
    render: () => "x",
  },
];

/** Flush the 250ms client-search debounce. */
function flushDebounce() {
  act(() => {
    vi.advanceTimersByTime(250);
  });
}

describe("useClientTable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns all rows unfiltered/unsorted by default", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));
    expect(result.current.tableProps.total).toBe(3);
    expect(result.current.tableProps.page).toBe(1);
    expect(result.current.tableProps.pageSize).toBe(15);
    // No initialSortKey -> insertion order preserved.
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("filters rows by searchValue (case-insensitive, trimmed) after debounce", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));

    act(() => {
      result.current.tableProps.onSearchChange("  BRA  ");
    });
    // Controlled search reflects immediately, filter waits for debounce.
    expect(result.current.tableProps.search).toBe("  BRA  ");
    expect(result.current.tableProps.total).toBe(3);

    flushDebounce();
    expect(result.current.tableProps.total).toBe(1);
    expect(result.current.tableProps.rows[0].name).toBe("Bravo");
  });

  it("returns an empty result set when nothing matches", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));
    act(() => {
      result.current.tableProps.onSearchChange("zzz");
    });
    flushDebounce();
    expect(result.current.tableProps.total).toBe(0);
    expect(result.current.tableProps.rows).toEqual([]);
  });

  it("sorts strings via localeCompare and toggles asc/desc on repeated clicks", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));

    // First click on a new key -> ascending.
    act(() => {
      result.current.tableProps.onSort("name");
    });
    // alpha, Bravo, Charlie (localeCompare is case-insensitive-ish here)
    expect(result.current.tableProps.sortDir).toBe("asc");
    expect(result.current.tableProps.rows.map((r) => r.name)).toEqual(["alpha", "Bravo", "Charlie"]);

    // Same key -> flip asc to desc.
    act(() => {
      result.current.tableProps.onSort("name");
    });
    expect(result.current.tableProps.sortDir).toBe("desc");
    expect(result.current.tableProps.rows.map((r) => r.name)).toEqual(["Charlie", "Bravo", "alpha"]);

    // Same key again -> flip desc back to asc (covers the updater's "asc" branch).
    act(() => {
      result.current.tableProps.onSort("name");
    });
    expect(result.current.tableProps.sortDir).toBe("asc");
    expect(result.current.tableProps.rows.map((r) => r.name)).toEqual(["alpha", "Bravo", "Charlie"]);
  });

  it("sorts numbers numerically", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));
    act(() => {
      result.current.tableProps.onSort("price");
    });
    expect(result.current.tableProps.rows.map((r) => r.price)).toEqual([10, 20, 30]);
    act(() => {
      result.current.tableProps.onSort("price");
    });
    expect(result.current.tableProps.rows.map((r) => r.price)).toEqual([30, 20, 10]);
  });

  it("leaves rows unsorted when the sort column has no sortValue", () => {
    const { result } = renderHook(() => useClientTable(rows, columns));
    act(() => {
      result.current.tableProps.onSort("plain");
    });
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("leaves rows unsorted when the sort key matches no column", () => {
    const { result } = renderHook(() => useClientTable(rows, columns, { initialSortKey: "missing" }));
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("applies initialSortKey/initialSortDir options", () => {
    const { result } = renderHook(() =>
      useClientTable(rows, columns, { initialSortKey: "price", initialSortDir: "desc" }),
    );
    expect(result.current.tableProps.sortKey).toBe("price");
    expect(result.current.tableProps.sortDir).toBe("desc");
    expect(result.current.tableProps.rows.map((r) => r.price)).toEqual([30, 20, 10]);
  });

  it("paginates client-side and clamps the current page to the last page", () => {
    const big: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `n${i + 1}`,
      price: i + 1,
    }));
    const { result } = renderHook(() => useClientTable(big, columns, { pageSize: 2 }));

    // 5 rows / pageSize 2 -> 3 pages; first page has 2 rows.
    expect(result.current.tableProps.total).toBe(5);
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["1", "2"]);

    act(() => {
      result.current.tableProps.onPageChange(2);
    });
    expect(result.current.tableProps.page).toBe(2);
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["3", "4"]);

    act(() => {
      result.current.tableProps.onPageChange(3);
    });
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["5"]);

    // Overshooting the last page clamps `current` (page>totalPages).
    act(() => {
      result.current.tableProps.onPageChange(99);
    });
    expect(result.current.tableProps.page).toBe(3);
    expect(result.current.tableProps.rows.map((r) => r.id)).toEqual(["5"]);
  });

  it("resets to page 1 when the debounced search changes", () => {
    const big: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `n${i + 1}`,
      price: i + 1,
    }));
    const { result } = renderHook(() => useClientTable(big, columns, { pageSize: 2 }));

    act(() => {
      result.current.tableProps.onPageChange(3);
    });
    expect(result.current.tableProps.page).toBe(3);

    act(() => {
      result.current.tableProps.onSearchChange("n");
    });
    flushDebounce();
    // Page reset via effect on [debounced, ...].
    expect(result.current.tableProps.page).toBe(1);
  });

  it("resets to page 1 when allRows changes", () => {
    const { result, rerender } = renderHook(({ data }) => useClientTable(data, columns, { pageSize: 2 }), {
      initialProps: { data: rows },
    });

    act(() => {
      result.current.tableProps.onPageChange(2);
    });
    expect(result.current.tableProps.page).toBe(2);

    const newRows: Row[] = [{ id: "9", name: "Zeta", price: 99 }];
    rerender({ data: newRows });
    expect(result.current.tableProps.page).toBe(1);
    expect(result.current.tableProps.total).toBe(1);
  });

  it("falls back to no filtering when no column declares searchValue", () => {
    const noSearchCols: Column<Row>[] = [{ key: "name", label: "Name", render: (r) => r.name }];
    const { result } = renderHook(() => useClientTable(rows, noSearchCols));
    act(() => {
      result.current.tableProps.onSearchChange("charlie");
    });
    flushDebounce();
    // No searchValue columns -> `cols` empty -> some() is false for every row.
    expect(result.current.tableProps.total).toBe(0);
  });

  it("treats a column that loses its searchValue between passes as non-matching", () => {
    // The hook reads `searchValue` twice: once when building `cols` (the
    // `columns.filter`) and again inside `cols.some(...)`. A getter that is truthy
    // for the filter pass but undefined afterwards exercises the ternary's
    // defensive `: false` branch (line 28) without mutating the source.
    let reads = 0;
    const flaky: Column<Row> = {
      key: "name",
      label: "Name",
      render: (r) => r.name,
      get searchValue() {
        reads += 1;
        // First read (filter pass) keeps the column in `cols`; later reads (the
        // some() callback) drop to undefined, hitting the `: false` arm.
        return reads === 1 ? (r: Row) => r.name : (undefined as unknown as (r: Row) => string);
      },
    };
    const { result } = renderHook(() => useClientTable(rows, [flaky]));
    act(() => {
      result.current.tableProps.onSearchChange("alpha");
    });
    flushDebounce();
    // searchValue is undefined during matching -> every row yields `false`.
    expect(result.current.tableProps.total).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useServerTable } from "../useServerTable";

/** Flush the 350ms search debounce and let effects settle. */
function flushDebounce() {
  act(() => {
    vi.advanceTimersByTime(350);
  });
}

describe("useServerTable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("uses the default options when none are supplied", () => {
    const { result } = renderHook(() => useServerTable());
    expect(result.current.tableProps.pageSize).toBe(15);
    expect(result.current.tableProps.sortKey).toBe("createdAt");
    expect(result.current.tableProps.sortDir).toBe("desc");
    expect(result.current.variables).toEqual({
      search: null,
      sortBy: "createdAt",
      sortDir: "DESC",
      limit: 15,
      offset: 0,
    });
  });

  it("honors custom options", () => {
    const { result } = renderHook(() =>
      useServerTable({ pageSize: 5, initialSortKey: "name", initialSortDir: "asc" }),
    );
    expect(result.current.tableProps.pageSize).toBe(5);
    expect(result.current.tableProps.sortKey).toBe("name");
    expect(result.current.tableProps.sortDir).toBe("asc");
    expect(result.current.variables.sortBy).toBe("name");
    expect(result.current.variables.sortDir).toBe("ASC");
    expect(result.current.variables.limit).toBe(5);
  });

  it("debounces the search input and trims it into variables.search", () => {
    const { result } = renderHook(() => useServerTable());

    act(() => {
      result.current.tableProps.onSearchChange("  pizza  ");
    });
    // Controlled search input updates immediately…
    expect(result.current.tableProps.search).toBe("  pizza  ");
    // …but the debounced query var is still empty until the timer fires.
    expect(result.current.variables.search).toBeNull();

    flushDebounce();
    expect(result.current.variables.search).toBe("pizza");
  });

  it("maps a whitespace-only/empty search to null", () => {
    const { result } = renderHook(() => useServerTable());
    act(() => {
      result.current.tableProps.onSearchChange("   ");
    });
    flushDebounce();
    expect(result.current.variables.search).toBeNull();
  });

  it("resets to page 1 when the debounced search changes", () => {
    const { result } = renderHook(() => useServerTable());

    act(() => {
      result.current.tableProps.onPageChange(3);
    });
    expect(result.current.tableProps.page).toBe(3);
    expect(result.current.variables.offset).toBe(30);

    act(() => {
      result.current.tableProps.onSearchChange("query");
    });
    // Still on page 3 until the debounce settles.
    expect(result.current.tableProps.page).toBe(3);

    flushDebounce();
    expect(result.current.tableProps.page).toBe(1);
    expect(result.current.variables.offset).toBe(0);
  });

  it("computes the offset from page and pageSize", () => {
    const { result } = renderHook(() => useServerTable({ pageSize: 10 }));
    act(() => {
      result.current.tableProps.onPageChange(4);
    });
    expect(result.current.variables.offset).toBe(30);
    expect(result.current.variables.limit).toBe(10);
  });

  it("onSort toggles asc/desc when the same key is clicked and resets page", () => {
    const { result } = renderHook(() => useServerTable({ initialSortKey: "name", initialSortDir: "asc" }));

    act(() => {
      result.current.tableProps.onPageChange(2);
    });
    expect(result.current.tableProps.page).toBe(2);

    // Same key -> flip asc to desc.
    act(() => {
      result.current.tableProps.onSort("name");
    });
    expect(result.current.tableProps.sortDir).toBe("desc");
    // Sort change resets page back to 1 (via the effect).
    expect(result.current.tableProps.page).toBe(1);

    // Same key again -> flip desc back to asc.
    act(() => {
      result.current.tableProps.onSort("name");
    });
    expect(result.current.tableProps.sortDir).toBe("asc");
  });

  it("onSort switches to a new key and forces asc", () => {
    const { result } = renderHook(() => useServerTable({ initialSortKey: "name", initialSortDir: "desc" }));

    act(() => {
      result.current.tableProps.onSort("price");
    });
    expect(result.current.tableProps.sortKey).toBe("price");
    expect(result.current.tableProps.sortDir).toBe("asc");
    expect(result.current.variables.sortBy).toBe("price");
    expect(result.current.variables.sortDir).toBe("ASC");
  });

  it("exposes setPage which updates the page directly", () => {
    const { result } = renderHook(() => useServerTable());
    act(() => {
      result.current.setPage(7);
    });
    expect(result.current.tableProps.page).toBe(7);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a"));
    expect(result.current).toBe("a");
  });

  it("only updates after the default delay (350ms) of quiet", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    // Not yet elapsed -> still old value.
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("honors a custom delay", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "x", delay: 1000 },
    });

    rerender({ value: "y", delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe("x");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("y");
  });

  it("debounces rapid changes, emitting only the final value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 0 },
    });

    rerender({ value: 1 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 3 });

    // None of the intermediate timers should have fired yet.
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(3);
  });

  it("clears the pending timer on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = renderHook(() => useDebounce("v"));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import DashboardFilter, { rangeForPreset, type Preset } from "../DashboardFilter";

// Fixed reference date so every assertion is deterministic regardless of the
// machine's clock. Computed expectations are derived with the same date-fns
// helpers the implementation uses, keeping the test timezone-agnostic.
const FIXED = new Date(2024, 2, 14, 9, 30, 0); // Thu 14 Mar 2024, 09:30 local

describe("rangeForPreset", () => {
  it("'today' maps to the start/end of the given day", () => {
    expect(rangeForPreset("today", FIXED)).toEqual({
      from: startOfDay(FIXED).toISOString(),
      to: endOfDay(FIXED).toISOString(),
    });
  });

  it("'tomorrow' maps to the start/end of the next day", () => {
    const day = addDays(FIXED, 1);
    expect(rangeForPreset("tomorrow", FIXED)).toEqual({
      from: startOfDay(day).toISOString(),
      to: endOfDay(day).toISOString(),
    });
  });

  it("'week' maps to the start/end of the surrounding week", () => {
    expect(rangeForPreset("week", FIXED)).toEqual({
      from: startOfWeek(FIXED).toISOString(),
      to: endOfWeek(FIXED).toISOString(),
    });
  });

  it("'month' maps to the start/end of the surrounding month", () => {
    expect(rangeForPreset("month", FIXED)).toEqual({
      from: startOfMonth(FIXED).toISOString(),
      to: endOfMonth(FIXED).toISOString(),
    });
  });

  it("'all' maps to an empty (all-time) range", () => {
    expect(rangeForPreset("all", FIXED)).toEqual({});
  });

  it("'custom' falls through to the today range", () => {
    expect(rangeForPreset("custom", FIXED)).toEqual({
      from: startOfDay(FIXED).toISOString(),
      to: endOfDay(FIXED).toISOString(),
    });
  });

  it("any unknown preset falls through to the today range", () => {
    expect(rangeForPreset("unknown" as Preset, FIXED)).toEqual({
      from: startOfDay(FIXED).toISOString(),
      to: endOfDay(FIXED).toISOString(),
    });
  });

  it("defaults the reference date to now when omitted", () => {
    const before = startOfDay(new Date()).toISOString();
    const result = rangeForPreset("today");
    const after = startOfDay(new Date()).toISOString();
    // The default `new Date()` resolves to the current day; its start-of-day
    // must match the start-of-day computed around the call.
    expect([before, after]).toContain(result.from);
  });
});

function renderFilter(props: Partial<React.ComponentProps<typeof DashboardFilter>> = {}) {
  const onPreset = props.onPreset ?? vi.fn();
  const onCustomFrom = props.onCustomFrom ?? vi.fn();
  const onCustomTo = props.onCustomTo ?? vi.fn();
  const utils = render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DashboardFilter
        preset={props.preset ?? "today"}
        customFrom={props.customFrom ?? null}
        customTo={props.customTo ?? null}
        onPreset={onPreset}
        onCustomFrom={onCustomFrom}
        onCustomTo={onCustomTo}
      />
    </LocalizationProvider>
  );
  return { ...utils, onPreset, onCustomFrom, onCustomTo };
}

describe("DashboardFilter component", () => {
  it("renders all preset chips", () => {
    renderFilter();
    for (const label of ["All time", "Today", "Tomorrow", "This Week", "This Month", "Custom"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("does not render the custom date pickers unless custom is active", () => {
    renderFilter({ preset: "today" });
    expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("To")).not.toBeInTheDocument();
  });

  it("fires onPreset with the clicked preset value", () => {
    const { onPreset } = renderFilter({ preset: "today" });
    fireEvent.click(screen.getByText("This Week"));
    expect(onPreset).toHaveBeenCalledWith("week");

    fireEvent.click(screen.getByText("Custom"));
    expect(onPreset).toHaveBeenCalledWith("custom");
  });

  it("renders the From/To date pickers when custom is active", () => {
    renderFilter({ preset: "custom" });
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("renders provided custom from/to values in the pickers", () => {
    renderFilter({
      preset: "custom",
      customFrom: new Date(2024, 0, 2),
      customTo: new Date(2024, 0, 9),
    });
    expect(screen.getByLabelText("From")).toHaveValue("01/02/2024");
    expect(screen.getByLabelText("To")).toHaveValue("01/09/2024");
  });
});

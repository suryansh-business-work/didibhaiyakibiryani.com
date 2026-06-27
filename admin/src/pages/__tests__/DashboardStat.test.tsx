import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Stat, PeriodSummary, type PeriodStats } from "../DashboardStat";
import { inr } from "../../components/ui";

describe("Stat", () => {
  it("renders label, value and sub text", () => {
    render(<Stat label="Orders" value="42" sub="In selected range" icon={<svg data-testid="ic" />} />);
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("In selected range")).toBeInTheDocument();
    expect(screen.getByTestId("ic")).toBeInTheDocument();
  });

  it("applies no inline color style when valueColor is omitted", () => {
    render(<Stat label="L" value="V" sub="S" icon={<i />} />);
    const value = screen.getByText("V");
    expect(value).not.toHaveStyle({ color: "rgb(22, 163, 74)" });
    expect(value.getAttribute("style")).toBeNull();
  });

  it("applies the inline color style when valueColor is provided", () => {
    render(<Stat label="L" value="V" sub="S" icon={<i />} valueColor="#16a34a" />);
    expect(screen.getByText("V")).toHaveStyle({ color: "rgb(22, 163, 74)" });
  });

  it("is a clickable button (mouse + Enter/Space, ignores other keys) when onClick is given", () => {
    const onClick = vi.fn();
    render(<Stat label="L" value="V" sub="S" icon={<i />} onClick={onClick} />);
    const tile = screen.getByRole("button");
    fireEvent.click(tile);
    fireEvent.keyDown(tile, { key: "Enter" });
    fireEvent.keyDown(tile, { key: " " });
    fireEvent.keyDown(tile, { key: "a" });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("is not a button when onClick is omitted", () => {
    render(<Stat label="L" value="V" sub="S" icon={<i />} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("PeriodSummary", () => {
  const base: PeriodStats = {
    periodOrders: 12,
    periodRevenue: 5000,
    periodExpenses: 2000,
    expenseCategoryCount: 4,
    periodProfit: 3000,
    periodComplimentary: 500,
  };

  it("renders the metric tiles with formatted values", () => {
    render(<PeriodSummary s={base} />);
    expect(screen.getByText("Period summary")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(inr(5000))).toBeInTheDocument();
    expect(screen.getByText(inr(2000))).toBeInTheDocument();
    expect(screen.getByText("Profit")).toBeInTheDocument();
    expect(screen.getByText(inr(3000))).toBeInTheDocument();
    expect(screen.getByText("Complimentary")).toBeInTheDocument();
    expect(screen.getByText(inr(500))).toBeInTheDocument();
  });

  it("shows the expense category count (plural) under Expenses", () => {
    render(<PeriodSummary s={base} />);
    expect(screen.getByText("4 categories with spend")).toBeInTheDocument();
  });

  it("uses the singular label for exactly one expense category", () => {
    render(<PeriodSummary s={{ ...base, expenseCategoryCount: 1 }} />);
    expect(screen.getByText("1 category with spend")).toBeInTheDocument();
  });

  it("colors a non-negative profit green", () => {
    render(<PeriodSummary s={{ ...base, periodProfit: 3000 }} />);
    expect(screen.getByText(inr(3000))).toHaveStyle({ color: "rgb(22, 163, 74)" });
  });

  it("colors a zero profit green (>= 0 boundary)", () => {
    render(<PeriodSummary s={{ ...base, periodProfit: 0 }} />);
    expect(screen.getByText(inr(0))).toHaveStyle({ color: "rgb(22, 163, 74)" });
  });

  it("colors a negative profit red", () => {
    render(<PeriodSummary s={{ ...base, periodProfit: -1500 }} />);
    expect(screen.getByText(inr(-1500))).toHaveStyle({ color: "rgb(220, 38, 38)" });
  });

  it("invokes onComplimentaryClick when the Complimentary tile is clicked", () => {
    const onComplimentaryClick = vi.fn();
    render(<PeriodSummary s={base} onComplimentaryClick={onComplimentaryClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onComplimentaryClick).toHaveBeenCalledTimes(1);
  });

  it("invokes onProfitClick when the Profit tile is clicked", () => {
    const onProfitClick = vi.fn();
    render(<PeriodSummary s={base} onProfitClick={onProfitClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onProfitClick).toHaveBeenCalledTimes(1);
  });
});

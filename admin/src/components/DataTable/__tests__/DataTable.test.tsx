import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import DataTable from "../DataTable";
import type { Column, DataTableProps } from "../types";

interface Row {
  id: string;
  name: string;
  price: number;
}

const allRows: Row[] = [
  { id: "1", name: "Alpha", price: 10 },
  { id: "2", name: "Bravo", price: 20 },
  { id: "3", name: "Charlie", price: 30 },
];

const columns: Column<Row>[] = [
  // Active sort column (sortKey === "name") -> HeaderCell active branch.
  { key: "name", label: "Name", sortable: true, render: (r) => r.name },
  // A second sortable column that is NOT the active sortKey -> HeaderCell inactive branch.
  { key: "price", label: "Price", align: "right", sortable: true, render: (r) => r.price },
  // A non-sortable column -> HeaderCell `!sortable` branch (plain text header).
  { key: "plain", label: "Plain", render: () => "x" },
];

function baseProps(overrides: Partial<DataTableProps<Row>> = {}): DataTableProps<Row> {
  return {
    columns,
    rows: allRows,
    rowKey: (r) => r.id,
    total: allRows.length,
    page: 1,
    pageSize: 15,
    onPageChange: vi.fn(),
    search: "",
    onSearchChange: vi.fn(),
    sortKey: "name",
    sortDir: "asc",
    onSort: vi.fn(),
    noun: "dish",
    ...overrides,
  };
}

describe("DataTable", () => {
  it("renders rows, the active + inactive sortable headers, and the plain header", () => {
    render(<DataTable {...baseProps()} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    // Active sortable header (sortKey === "name") is marked active.
    const nameLabel = screen.getByRole("button", { name: /Name/ });
    expect(nameLabel).toHaveClass("Mui-active");
    // The inactive sortable header (Price) still renders a sort-label button…
    const priceLabel = screen.getByRole("button", { name: /Price/ });
    expect(priceLabel).toBeInTheDocument();
    // …but is not marked active.
    expect(priceLabel).not.toHaveClass("Mui-active");
    // The non-sortable header is plain text (no sort button).
    expect(screen.queryByRole("button", { name: /^Plain$/ })).not.toBeInTheDocument();
    expect(screen.getByText("Plain")).toBeInTheDocument();
  });

  it("calls onSort when a sortable header is clicked", () => {
    const onSort = vi.fn();
    render(<DataTable {...baseProps({ onSort })} />);
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("calls onSearchChange as the search input changes", () => {
    const onSearchChange = vi.fn();
    render(<DataTable {...baseProps({ onSearchChange, searchPlaceholder: "Find dishes" })} />);
    const input = screen.getByPlaceholderText("Find dishes");
    fireEvent.change(input, { target: { value: "alp" } });
    expect(onSearchChange).toHaveBeenCalledWith("alp");
  });

  it("uses the default search placeholder when none is given", () => {
    render(<DataTable {...baseProps()} />);
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("renders toolbarStart and toolbarEnd slots", () => {
    render(
      <DataTable
        {...baseProps({
          toolbarStart: <span>filters-here</span>,
          toolbarEnd: <span>add-button</span>,
        })}
      />,
    );
    expect(screen.getByText("filters-here")).toBeInTheDocument();
    expect(screen.getByText("add-button")).toBeInTheDocument();
  });

  it("renders per-row actions via renderActions", () => {
    render(<DataTable {...baseProps({ renderActions: (r) => <button>edit-{r.id}</button> })} />);
    expect(screen.getByText("edit-1")).toBeInTheDocument();
    expect(screen.getByText("edit-3")).toBeInTheDocument();
  });

  it("shows the empty state when total is 0", () => {
    render(<DataTable {...baseProps({ rows: [], total: 0, emptyLabel: "No dishes." })} />);
    expect(screen.getByText("No dishes.")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("uses the default empty label when none is provided", () => {
    render(<DataTable {...baseProps({ rows: [], total: 0 })} />);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    const { container } = render(<DataTable {...baseProps({ loading: true })} />);
    expect(container.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });

  it("does not render selection checkboxes when onBulkDelete is omitted", () => {
    render(<DataTable {...baseProps()} />);
    expect(screen.queryByLabelText("Select all on page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select row")).not.toBeInTheDocument();
  });

  describe("selection + bulk delete", () => {
    it("toggles a single row, shows the bulk bar, and clears via the Clear button", () => {
      render(<DataTable {...baseProps({ onBulkDelete: vi.fn() })} />);
      const rowChecks = screen.getAllByLabelText("Select row");
      expect(rowChecks).toHaveLength(3);

      fireEvent.click(rowChecks[0]);
      expect(screen.getByText("1 selected")).toBeInTheDocument();

      // Untoggle the same row removes the bulk bar.
      fireEvent.click(rowChecks[0]);
      expect(screen.queryByText("1 selected")).not.toBeInTheDocument();

      // Re-select then Clear.
      fireEvent.click(rowChecks[1]);
      expect(screen.getByText("1 selected")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Clear"));
      expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    });

    it("select-all checks every row, and toggling again clears them", () => {
      render(<DataTable {...baseProps({ onBulkDelete: vi.fn() })} />);
      const selectAll = screen.getByLabelText("Select all on page") as HTMLInputElement;

      fireEvent.click(selectAll);
      expect(screen.getByText("3 selected")).toBeInTheDocument();
      expect(selectAll.checked).toBe(true);

      // Toggle all again -> deselect everything.
      fireEvent.click(selectAll);
      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });

    it("shows the indeterminate state when only some rows are selected", () => {
      const { container } = render(<DataTable {...baseProps({ onBulkDelete: vi.fn() })} />);
      const rowChecks = screen.getAllByLabelText("Select row");
      fireEvent.click(rowChecks[0]);
      expect(container.querySelector(".MuiCheckbox-indeterminate")).not.toBeNull();
    });

    it("runs onBulkDelete with the selected ids, then clears the selection", async () => {
      const onBulkDelete = vi.fn().mockResolvedValue(undefined);
      render(<DataTable {...baseProps({ onBulkDelete })} />);

      fireEvent.click(screen.getByLabelText("Select all on page"));
      fireEvent.click(screen.getByRole("button", { name: "Delete 3" }));

      await waitFor(() => expect(onBulkDelete).toHaveBeenCalledWith(["1", "2", "3"]));
      // Selection cleared on success -> bulk bar gone.
      await waitFor(() => expect(screen.queryByText(/selected/)).not.toBeInTheDocument());
    });

    it("shows the busy label while the delete promise is pending", async () => {
      let resolveDelete: () => void = () => {};
      const onBulkDelete = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          }),
      );
      render(<DataTable {...baseProps({ onBulkDelete })} />);

      fireEvent.click(screen.getAllByLabelText("Select row")[0]);
      fireEvent.click(screen.getByRole("button", { name: "Delete 1" }));

      // While pending the button shows the busy copy and is disabled.
      const busyBtn = await screen.findByRole("button", { name: "Deleting…" });
      expect(busyBtn).toBeDisabled();

      resolveDelete();
      await waitFor(() => expect(screen.queryByText(/selected/)).not.toBeInTheDocument());
    });
  });

  describe("pagination", () => {
    it("disables Prev on the first page and enables Next; clicking Next advances", () => {
      const onPageChange = vi.fn();
      render(<DataTable {...baseProps({ total: 40, pageSize: 15, page: 1, onPageChange })} />);

      const prev = screen.getByRole("button", { name: /Prev/ });
      const next = screen.getByRole("button", { name: /Next/ });
      expect(prev).toBeDisabled();
      expect(next).toBeEnabled();

      fireEvent.click(next);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("enables Prev on a middle page and disables Next on the last page", () => {
      const onPageChange = vi.fn();
      // 40 rows / 15 per page -> 3 pages; on the last page.
      render(<DataTable {...baseProps({ total: 40, pageSize: 15, page: 3, onPageChange })} />);

      const prev = screen.getByRole("button", { name: /Prev/ });
      const next = screen.getByRole("button", { name: /Next/ });
      expect(prev).toBeEnabled();
      expect(next).toBeDisabled();

      fireEvent.click(prev);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("renders the pager summary with the noun and clamped page count", () => {
      render(<DataTable {...baseProps({ total: 40, pageSize: 15, page: 2, noun: "dish" })} />);
      const pager = document.querySelector(".pager") as HTMLElement;
      expect(within(pager).getByText(/40 dish\(s\)/)).toBeInTheDocument();
      expect(within(pager).getByText(/page 2 of 3/)).toBeInTheDocument();
    });

    it("falls back to the default noun 'row' and at least 1 total page", () => {
      render(<DataTable {...baseProps({ total: 0, rows: [], noun: undefined })} />);
      // total 0 hits the empty state; ensure default noun does not crash render.
      expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    });
  });
});

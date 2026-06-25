import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import {
  Spinner,
  Empty,
  AsyncList,
  Modal,
  StatusBadge,
  FormActions,
  OnOffChip,
  inr,
  fmtDate,
} from "../ui";

afterEach(() => cleanup());

describe("Spinner", () => {
  it("renders a progressbar with no label when none is given", () => {
    render(<Spinner />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    // No label paragraph rendered.
    expect(document.querySelector("p")).toBeNull();
  });

  it("renders the label text when provided", () => {
    render(<Spinner label="Loading orders…" />);
    expect(screen.getByText("Loading orders…")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("Empty", () => {
  it("renders its children", () => {
    render(<Empty>Nothing here yet</Empty>);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});

describe("AsyncList", () => {
  it("shows a spinner while loading (and not the empty/children)", () => {
    render(
      <AsyncList loading empty={false} emptyLabel="No rows">
        <div>rows</div>
      </AsyncList>
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("No rows")).toBeNull();
    expect(screen.queryByText("rows")).toBeNull();
  });

  it("shows the empty label when not loading and empty", () => {
    render(
      <AsyncList loading={false} empty emptyLabel="No rows">
        <div>rows</div>
      </AsyncList>
    );
    expect(screen.getByText("No rows")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("rows")).toBeNull();
  });

  it("renders children when not loading and not empty", () => {
    render(
      <AsyncList loading={false} empty={false} emptyLabel="No rows">
        <div>rows</div>
      </AsyncList>
    );
    expect(screen.getByText("rows")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("No rows")).toBeNull();
  });
});

describe("Modal", () => {
  it("renders title, children and footer", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit item" onClose={onClose} footer={<button>FooterAction</button>}>
        <div>Body content</div>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit item")).toBeInTheDocument();
    expect(within(dialog).getByText("Body content")).toBeInTheDocument();
    expect(within(dialog).getByText("FooterAction")).toBeInTheDocument();
  });

  it("does not render a footer region when no footer is passed", () => {
    const onClose = vi.fn();
    render(
      <Modal title="No footer" onClose={onClose}>
        <div>Body</div>
      </Modal>
    );
    expect(screen.queryByText("FooterAction")).toBeNull();
  });

  it("invokes onClose when the × button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Closable" onClose={onClose}>
        <div>Body</div>
      </Modal>
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores backdrop clicks (the reason === 'backdropClick' branch keeps the dialog open)", () => {
    const onClose = vi.fn();
    render(
      <Modal title="Backdrop" onClose={onClose}>
        <div>Body</div>
      </Modal>
    );
    // MUI renders the backdrop as the dialog presentation's first child. Clicking
    // it fires the Dialog onClose with reason "backdropClick", which the guard
    // swallows — so onClose must NOT be called.
    const backdrop = document.querySelector(".MuiBackdrop-root");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("StatusBadge", () => {
  it("maps a known status to its styled label", () => {
    render(<StatusBadge status="OUT_FOR_DELIVERY" />);
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
  });

  it("falls back to the raw status for an unknown status", () => {
    render(<StatusBadge status="WEIRD_STATUS" />);
    expect(screen.getByText("WEIRD_STATUS")).toBeInTheDocument();
  });
});

describe("OnOffChip", () => {
  it("shows the default on-label when on", () => {
    render(<OnOffChip on />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows the default off-label when off", () => {
    render(<OnOffChip on={false} />);
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("honours custom on/off labels", () => {
    const { rerender } = render(<OnOffChip on onLabel="Enabled" offLabel="Disabled" />);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    rerender(<OnOffChip on={false} onLabel="Enabled" offLabel="Disabled" />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
});

describe("FormActions", () => {
  it("renders Cancel + default Save and wires their handlers when not busy", () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<FormActions onCancel={onCancel} onSave={onSave} />);

    const save = screen.getByRole("button", { name: "Save" });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows Saving… and disables the save button when busy", () => {
    render(<FormActions onCancel={vi.fn()} onSave={vi.fn()} busy />);
    const save = screen.getByRole("button", { name: "Saving…" });
    expect(save).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("uses a custom saveLabel when provided", () => {
    render(<FormActions onCancel={vi.fn()} onSave={vi.fn()} saveLabel="Create" />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});

describe("inr", () => {
  it("rounds and formats with the rupee symbol and en-IN grouping", () => {
    expect(inr(0)).toBe("₹0");
    expect(inr(1234.4)).toBe("₹1,234");
    expect(inr(1234.5)).toBe("₹1,235");
    expect(inr(100000)).toBe("₹1,00,000");
  });
});

describe("fmtDate", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "Asia/Kolkata");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("formats a timestamp number into a short day/month + time string", () => {
    // 2024-01-15T10:30:00Z -> rendered in en-IN with day/month/hour/minute.
    const out = fmtDate(Date.UTC(2024, 0, 15, 10, 30));
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    // Contains the abbreviated month and a time separator.
    expect(out).toMatch(/Jan/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it("accepts an ISO date string", () => {
    const out = fmtDate("2024-06-05T08:15:00Z");
    expect(out).toMatch(/Jun/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});

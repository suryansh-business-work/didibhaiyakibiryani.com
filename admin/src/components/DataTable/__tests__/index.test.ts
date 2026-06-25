import { describe, it, expect } from "vitest";
import * as DataTableModule from "../index";

// types.ts is type-only (erased at runtime); importing it keeps the module in the
// coverage graph and documents the public surface re-exported by the barrel.
import type { Column, DataTableProps, SortDir } from "../index";

describe("DataTable barrel (index.ts)", () => {
  it("re-exports the table component plus both table hooks", () => {
    expect(typeof DataTableModule.DataTable).toBe("function");
    expect(typeof DataTableModule.useServerTable).toBe("function");
    expect(typeof DataTableModule.useClientTable).toBe("function");
  });

  it("allows the re-exported types to annotate values", () => {
    const dir: SortDir = "asc";
    const col: Column<{ id: string }> = { key: "id", label: "Id", render: (r) => r.id };
    const props: Pick<DataTableProps<{ id: string }>, "total" | "page"> = { total: 0, page: 1 };
    expect(dir).toBe("asc");
    expect(col.key).toBe("id");
    expect(props.total).toBe(0);
  });
});

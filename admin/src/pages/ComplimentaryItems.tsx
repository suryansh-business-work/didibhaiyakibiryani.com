import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Typography } from "@mui/material";
import { startOfDay, endOfDay } from "date-fns";
import Layout from "../components/Layout";
import { fmtDate, inr } from "../components/ui";
import { DataTable, useServerTable, type Column } from "../components/DataTable";
import DashboardFilter, { rangeForPreset, type Preset, type DateRange } from "./DashboardFilter";
import { COMPLIMENTARY_ITEMS_PAGE } from "../graphql/queries";

interface CompItem {
  orderNumber: string;
  name: string;
  qty: number;
  value: number;
  placedAt: string;
}

function customRange(from: Date | null, to: Date | null): DateRange {
  return {
    from: from ? startOfDay(from).toISOString() : undefined,
    to: to ? endOfDay(to).toISOString() : undefined,
  };
}

/** Standalone report: every complimentary (free) line given, server-searched/paged/sorted. */
export default function ComplimentaryItems() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "placedAt", initialSortDir: "desc" });

  const range = useMemo<DateRange>(
    () => (preset === "custom" ? customRange(customFrom, customTo) : rangeForPreset(preset)),
    [preset, customFrom, customTo]
  );

  const { data, loading } = useQuery<{ complimentaryItemsPage: { items: CompItem[]; total: number } }>(
    COMPLIMENTARY_ITEMS_PAGE,
    { variables: { ...variables, ...range } }
  );
  const items = data?.complimentaryItemsPage.items ?? [];
  const total = data?.complimentaryItemsPage.total ?? 0;

  function choosePreset(p: Preset) {
    setPreset(p);
    setPage(1);
  }

  const columns = useMemo<Column<CompItem>[]>(() => [
    { key: "orderNumber", label: "Order", render: (it) => <Typography fontWeight={700}>{it.orderNumber}</Typography> },
    { key: "name", label: "Item", sortable: true, render: (it) => it.name },
    { key: "qty", label: "Qty", align: "right", sortable: true, render: (it) => it.qty },
    { key: "value", label: "Value", align: "right", sortable: true, render: (it) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(it.value)}</Typography> },
    { key: "placedAt", label: "When", sortable: true, render: (it) => <Typography variant="body2" color="text.secondary">{fmtDate(it.placedAt)}</Typography> },
  ], []);

  return (
    <Layout title="Complimentary items given">
      <DashboardFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPreset={choosePreset}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
      />
      <DataTable
        columns={columns}
        rows={items}
        total={total}
        rowKey={(it) => it.orderNumber}
        loading={loading && !data}
        emptyLabel="No complimentary items in this range."
        noun="item"
        searchPlaceholder="Search order # or item…"
        {...tableProps}
      />
    </Layout>
  );
}

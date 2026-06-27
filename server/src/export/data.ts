import { Order, Expense, ExpenseProduct } from "../models/index.js";
import { dashboardResolvers } from "../graphql/resolvers/dashboard.js";
import type { TokenPayload } from "../utils/auth.js";
import type { Report, ReportTable } from "./types.js";

type Query = Record<string, unknown>;

const str = (q: Query, key: string): string | undefined =>
  typeof q[key] === "string" && q[key] ? (q[key] as string) : undefined;

const fmtDate = (d?: Date | string | null): string =>
  d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "";
const fmtDateTime = (d?: Date | string | null): string =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
const money = (n: number): string => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

interface LeanOrder {
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  orderType?: string;
  paymentMethod: string;
  total: number;
  placedAt: Date;
  items: Array<{ qty: number }>;
  user?: { name?: string; phone?: string } | null;
}

async function ordersReport(q: Query): Promise<Report> {
  const filter: Record<string, unknown> = {};
  const status = str(q, "status");
  if (status) {
    filter.status = status;
  }
  const userId = str(q, "userId");
  const phone = str(q, "phone");
  if (userId) {
    filter.user = userId;
  } else if (phone) {
    filter.customerPhone = phone;
  }
  const search = str(q, "search");
  if (search) {
    const rx = { $regex: search, $options: "i" };
    filter.$or = [{ orderNumber: rx }, { customerName: rx }, { customerPhone: rx }];
  }
  const orders = await Order.find(filter)
    .populate({ path: "user", select: "name phone" })
    .sort({ placedAt: -1 })
    .lean<LeanOrder[]>()
    .exec();
  const rows = orders.map((o) => [
    o.orderNumber,
    o.user?.name ?? o.customerName ?? "",
    o.user?.phone ?? o.customerPhone ?? "",
    o.status,
    o.orderType ?? "",
    o.paymentMethod,
    o.items.reduce((n, it) => n + it.qty, 0),
    o.total,
    fmtDateTime(o.placedAt),
  ]);
  return {
    title: "Orders",
    tables: [
      {
        name: "Orders",
        columns: [
          { header: "Order #", width: 14 },
          { header: "Customer", width: 22 },
          { header: "Phone", width: 16 },
          { header: "Status", width: 16 },
          { header: "Type", width: 11 },
          { header: "Payment", width: 12 },
          { header: "Items", width: 8 },
          { header: "Total", width: 12, money: true },
          { header: "Placed", width: 20 },
        ],
        rows,
      },
    ],
  };
}

interface LeanExpense {
  title: string;
  amount: number;
  unit?: string;
  date?: Date;
  createdAt: Date;
  source?: { name?: string } | null;
  product?: { name?: string } | null;
}

async function expensesReport(q: Query): Promise<Report> {
  const filter: Record<string, unknown> = {};
  const sourceId = str(q, "sourceId");
  if (sourceId) {
    filter.source = sourceId;
  }
  const productId = str(q, "productId");
  if (productId) {
    filter.product = productId;
  }
  const from = str(q, "from");
  const to = str(q, "to");
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) {
      range.$gte = new Date(from);
    }
    if (to) {
      range.$lte = new Date(to);
    }
    filter.date = range;
  }
  const search = str(q, "search");
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }
  const expenses = await Expense.find(filter)
    .populate([
      { path: "source", select: "name" },
      { path: "product", select: "name" },
    ])
    .sort({ date: -1, createdAt: -1 })
    .lean<LeanExpense[]>()
    .exec();
  const rows = expenses.map((e) => [
    e.source?.name ?? "",
    e.product?.name ?? e.title,
    e.amount,
    e.unit ?? "",
    fmtDate(e.date ?? e.createdAt),
  ]);
  return {
    title: "Expenses",
    tables: [
      {
        name: "Expenses",
        columns: [
          { header: "Expense from", width: 20 },
          { header: "Raw item", width: 24 },
          { header: "Amount", width: 14, money: true },
          { header: "Unit", width: 12 },
          { header: "Date", width: 16 },
        ],
        rows,
      },
    ],
  };
}

interface LeanProduct {
  name: string;
  marketPrice: number;
  priceUnit?: string;
}

async function rawItemsReport(): Promise<Report> {
  const items = await ExpenseProduct.find().sort({ createdAt: 1 }).lean<LeanProduct[]>().exec();
  const rows = items.map((i) => [i.name, i.marketPrice, i.priceUnit ?? ""]);
  return {
    title: "Raw Items",
    tables: [
      {
        name: "Raw Items",
        columns: [
          { header: "Name", width: 30 },
          { header: "Market price", width: 16, money: true },
          { header: "Unit", width: 14 },
        ],
        rows,
      },
    ],
  };
}

async function dashboardReport(q: Query, user: TokenPayload): Promise<Report> {
  const from = str(q, "from");
  const to = str(q, "to");
  const s = await dashboardResolvers.Query.dashboardStats(
    null,
    { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined },
    { user }
  );
  const summary: ReportTable = {
    name: "Summary",
    columns: [
      { header: "Metric", width: 30 },
      { header: "Value", width: 20 },
    ],
    rows: [
      ["Total orders", String(s.totalOrders)],
      ["Total revenue", money(s.totalRevenue)],
      ["Today's orders", String(s.todayOrders)],
      ["Today's revenue", money(s.todayRevenue)],
      ["Pending orders", String(s.pendingOrders)],
      ["Customers (signup + manual)", String(s.totalCustomers + s.totalLeads)],
      ["Repeat customers", String(s.repeatCustomers)],
      ["Avg order value", money(s.avgOrderValue)],
      ["Period orders", String(s.periodOrders)],
      ["Period revenue", money(s.periodRevenue)],
      ["Period expenses", money(s.periodExpenses)],
      ["Period profit", money(s.periodProfit)],
    ],
  };
  const bySource: ReportTable = {
    name: "Spend by source",
    columns: [
      { header: "Source", width: 30 },
      { header: "Amount", width: 16, money: true },
    ],
    rows: s.expenseBySource.map((e) => [e.name, e.total]),
  };
  const byItem: ReportTable = {
    name: "Raw items used",
    columns: [
      { header: "Raw item", width: 30 },
      { header: "Amount", width: 16, money: true },
    ],
    rows: s.expenseByItem.map((e) => [e.name, e.total]),
  };
  const byStatus: ReportTable = {
    name: "Orders by status",
    columns: [
      { header: "Status", width: 24 },
      { header: "Orders", width: 12 },
    ],
    rows: s.ordersByStatus.map((o) => [o.status, o.count]),
  };
  const revenue: ReportTable = {
    name: "Revenue (last 7 days)",
    columns: [
      { header: "Date", width: 20 },
      { header: "Revenue", width: 16, money: true },
      { header: "Orders", width: 12 },
    ],
    rows: s.revenueByDay.map((d) => [d.date, d.revenue, d.orders]),
  };
  const top: ReportTable = {
    name: "Top sellers",
    columns: [
      { header: "Item", width: 30 },
      { header: "Qty sold", width: 12 },
      { header: "Revenue", width: 16, money: true },
    ],
    rows: s.topItems.map((t) => [t.name, t.qty, t.revenue]),
  };
  const recent: ReportTable = {
    name: "Recent orders",
    columns: [
      { header: "Order #", width: 16 },
      { header: "Customer", width: 22 },
      { header: "Status", width: 18 },
      { header: "Placed", width: 20 },
      { header: "Total", width: 14, money: true },
    ],
    rows: s.recentOrders.map((o) => [o.orderNumber, o.customerName ?? "", o.status, fmtDateTime(o.placedAt), o.total]),
  };
  return { title: "Dashboard report", tables: [summary, bySource, byItem, byStatus, revenue, top, recent] };
}

type Builder = (q: Query, user: TokenPayload) => Promise<Report>;

const BUILDERS: Record<string, Builder> = {
  orders: (q) => ordersReport(q),
  expenses: (q) => expensesReport(q),
  "raw-items": () => rawItemsReport(),
  dashboard: (q, user) => dashboardReport(q, user),
};

export function getReportBuilder(name: string): Builder | undefined {
  return BUILDERS[name];
}

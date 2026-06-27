import type { ComponentType } from "react";
import {
  IGrid,
  IOrders,
  IRupee,
  IBank,
  IParty,
  ITag,
  IMenu,
  ILayers,
  IImage,
  IUsers,
  IContact,
  IBike,
  IBuilding,
  ISend,
  IMessage,
  IHeadset,
  IClock,
  IPalette,
  IPlug,
  IWallet,
  IReceipt,
} from "./icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Sidebar navigation grouped into collapsible categories. */
export const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: IGrid, end: true }] },
  {
    label: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: IOrders },
      { to: "/party-orders", label: "Party Orders", icon: IParty },
      { to: "/coupons", label: "Coupons", icon: ITag },
      { to: "/complimentary", label: "Complimentary", icon: IRupee },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/finance", label: "Finance Settings", icon: IBank },
      { to: "/payments", label: "Payments", icon: IRupee },
      { to: "/expense-sources", label: "Expense Sources", icon: IWallet },
      { to: "/raw-items", label: "Raw Items", icon: ILayers },
      { to: "/expenses", label: "Manage Expenses", icon: IReceipt },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/menu", label: "Menu", icon: IMenu },
      { to: "/categories", label: "Categories", icon: ILayers },
      { to: "/slider", label: "Slider", icon: IImage },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/customers", label: "Signup Customer", icon: IUsers },
      { to: "/contacts", label: "Manual Customer Contacts", icon: IContact },
      { to: "/riders", label: "Riders", icon: IBike },
      { to: "/societies", label: "Societies", icon: IBuilding },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/campaigns", label: "Campaigns", icon: ISend },
      { to: "/support", label: "Support", icon: IHeadset },
    ],
  },
  {
    label: "Generate Messages Configuration",
    items: [
      { to: "/messages/tracking", label: "Tracking Message", icon: IBike },
      { to: "/messages/survey", label: "Survey Message", icon: IMessage },
      { to: "/messages/receipt", label: "Receipt Message", icon: IReceipt },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/store", label: "Store", icon: IClock },
      { to: "/branding", label: "Branding", icon: IPalette },
      { to: "/integrations", label: "Integrations", icon: IPlug },
    ],
  },
];

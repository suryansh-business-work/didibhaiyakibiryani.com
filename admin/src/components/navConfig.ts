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
      { to: "/payments", label: "Payments", icon: IRupee },
      { to: "/finance", label: "Finance", icon: IBank },
      { to: "/party-orders", label: "Party Orders", icon: IParty },
      { to: "/coupons", label: "Coupons", icon: ITag },
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
      { to: "/customers", label: "Customers", icon: IUsers },
      { to: "/contacts", label: "Contacts", icon: IContact },
      { to: "/riders", label: "Riders", icon: IBike },
      { to: "/societies", label: "Societies", icon: IBuilding },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/campaigns", label: "Campaigns", icon: ISend },
      { to: "/survey-message", label: "Survey Message", icon: IMessage },
      { to: "/support", label: "Support", icon: IHeadset },
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

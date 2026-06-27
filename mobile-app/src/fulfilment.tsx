import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OrderType = "DELIVERY" | "TAKEAWAY";

interface FulfilmentCtx {
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
}

const Ctx = createContext<FulfilmentCtx>(null as unknown as FulfilmentCtx);
const STORE_KEY = "ddb_fulfilment";

/** Remembers whether the customer is ordering for Delivery or Takeaway. Read by
 *  the home toggle and the checkout (which zeroes the delivery fee for pickup). */
export function FulfilmentProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [orderType, setType] = useState<OrderType>("DELIVERY");

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => {
      if (raw === "TAKEAWAY" || raw === "DELIVERY") setType(raw);
    });
  }, []);

  function setOrderType(t: OrderType) {
    setType(t);
    AsyncStorage.setItem(STORE_KEY, t);
  }

  return <Ctx.Provider value={{ orderType, setOrderType }}>{children}</Ctx.Provider>;
}

export function useFulfilment() {
  return useContext(Ctx);
}

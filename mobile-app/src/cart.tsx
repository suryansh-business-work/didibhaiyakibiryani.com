import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartLine {
  id: string; // menuItemId
  name: string;
  price: number;
  qty: number;
  spiceLevel: number;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  setSpice: (id: string, spiceLevel: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx>(null as unknown as CartCtx);
const STORE_KEY = "ddb_cart";

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => {
      if (raw) {
        try {
          setLines(JSON.parse(raw));
        } catch {
          /* ignore corrupt cart */
        }
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(lines));
  }, [lines]);

  function add(line: Omit<CartLine, "qty">, qty = 1) {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      if (existing) {
        return prev.map((l) => (l.id === line.id ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { ...line, qty }];
    });
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))
    );
  }

  function setSpice(id: string, spiceLevel: number) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, spiceLevel } : l)));
  }

  function remove(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function clear() {
    setLines([]);
  }

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <Ctx.Provider value={{ lines, count, subtotal, add, setQty, setSpice, remove, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  return useContext(Ctx);
}

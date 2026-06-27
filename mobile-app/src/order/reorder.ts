import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../cart";

export interface ReorderItem {
  qty: number;
  menuItem?: {
    id: string;
    name: string;
    price: number;
    spiceLevel: number;
    spiceSelectable: boolean;
    isAvailable: boolean;
  } | null;
}

/** Re-add a past order's still-available items to the cart and open the cart.
 *  No backend "reorder" exists — we rebuild the cart client-side from the order
 *  history (which carries each line's live menuItem). Returns the count added. */
export function useReorder() {
  const { add } = useCart();
  const router = useRouter();

  return (items: ReorderItem[]): number => {
    let added = 0;
    for (const it of items) {
      const m = it.menuItem;
      if (!m || !m.isAvailable) {
        continue;
      }
      add({ id: m.id, name: m.name, price: m.price, spiceLevel: m.spiceLevel, spiceSelectable: m.spiceSelectable }, it.qty);
      added += 1;
    }
    if (added > 0) {
      router.push("/cart");
    } else {
      Alert.alert("Items unavailable", "These items are no longer available to reorder.");
    }
    return added;
  };
}

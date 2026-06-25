import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { AppBar, Box, Dialog, IconButton, Toolbar, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { CATEGORIES, COUPONS, CUSTOMERS, LEADS, MENU_ITEMS, SETTINGS, SOCIETIES } from "../../../graphql/queries";
import { CREATE_MANUAL_ORDER, UPDATE_MANUAL_ORDER } from "../../../graphql/mutations";
import { manualOrderSchema, type ManualOrderForm } from "../../../form";
import { ItemCatalog } from "./ItemCatalog";
import { OrderPanel } from "./OrderPanel";
import {
  BLANK_MANUAL_ORDER,
  buildManualInput,
  computeTotals,
  couponItemDiscount,
  deliveryFeeFor,
  orderToManualForm,
  type CategoryOption,
  type CouponOption,
  type CustomerOption,
  type LeadOption,
  type MenuOption,
  type SocietyOption,
} from "./types";
import type { Order } from "../types";

interface DeliverySettingsData {
  settings: { minDeliveryCost: number; freeDeliveryAbove: number };
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  editOrder?: Order;
}

/** Full-screen point-of-sale dialog: tap dishes on the left to build the
 * order on the right (walk-in/existing customer, takeaway/delivery, manual
 * pricing, back-dating and a survey link). Reused to edit an existing order. */
export default function ManualOrderModal({ onClose, onCreated, editOrder }: Readonly<Props>) {
  const { data: menuData } = useQuery<{ menuItems: MenuOption[] }>(MENU_ITEMS);
  const { data: catData } = useQuery<{ categories: CategoryOption[] }>(CATEGORIES);
  const { data: custData } = useQuery<{ customers: CustomerOption[] }>(CUSTOMERS);
  const { data: leadData } = useQuery<{ leads: LeadOption[] }>(LEADS);
  const { data: socData } = useQuery<{ societies: SocietyOption[] }>(SOCIETIES);
  const { data: couponData } = useQuery<{ coupons: CouponOption[] }>(COUPONS);
  const { data: setData } = useQuery<DeliverySettingsData>(SETTINGS);
  const [create] = useMutation(CREATE_MANUAL_ORDER);
  const [updateOrder] = useMutation(UPDATE_MANUAL_ORDER);

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ManualOrderForm>({
    resolver: zodResolver(manualOrderSchema),
    // New POS sales default the order date to right now (back-dating stays editable).
    defaultValues: editOrder ? orderToManualForm(editOrder) : { ...BLANK_MANUAL_ORDER, placedAt: new Date().toISOString() },
  });
  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });

  const form = watch();
  const totals = useMemo(() => computeTotals(form), [form]);
  const isDelivery = form.orderType === "DELIVERY";

  const activeCoupons = useMemo(() => (couponData?.coupons ?? []).filter((c) => c.isActive), [couponData]);
  const minDeliveryCost = setData?.settings.minDeliveryCost ?? 0;
  const freeDeliveryAbove = setData?.settings.freeDeliveryAbove ?? 0;
  const couponCode = form.couponCode ?? "";
  const orderType = form.orderType;

  // Keep discount (from the chosen coupon) and the delivery fee (from Finance
  // settings) in sync with the cart — both are derived, not typed by staff.
  useEffect(() => {
    const coupon = activeCoupons.find((c) => c.code === couponCode);
    const discount = couponItemDiscount(coupon, totals.subtotal);
    if ((Number(getValues("discount")) || 0) !== discount) setValue("discount", discount);
    if (orderType === "DELIVERY") {
      const fee = deliveryFeeFor({ minDeliveryCost, freeDeliveryAbove }, totals.subtotal, coupon?.type === "FREE_DELIVERY");
      if ((Number(getValues("deliveryFee")) || 0) !== fee) setValue("deliveryFee", fee);
    }
  }, [couponCode, orderType, totals.subtotal, activeCoupons, minDeliveryCost, freeDeliveryAbove, setValue, getValues]);

  function addMenuItem(m: MenuOption) {
    const items = getValues("items");
    // Match by name so a prefilled (edit-mode) line of the same dish is
    // incremented instead of appended as a duplicate.
    const idx = items.findIndex((it) => it.name === m.name);
    if (idx >= 0) update(idx, { ...items[idx], menuItemId: m.id, qty: Number(items[idx].qty) + 1 });
    else append({ menuItemId: m.id, name: m.name, price: m.price, qty: 1, spiceLevel: 0 });
  }

  function changeQty(index: number, delta: number) {
    const items = getValues("items");
    const next = Number(items[index].qty) + delta;
    if (next <= 0) remove(index);
    else update(index, { ...items[index], qty: next });
  }

  async function onSave(values: ManualOrderForm) {
    try {
      const input = buildManualInput(values);
      if (editOrder) await updateOrder({ variables: { id: editOrder.id, input } });
      else await create({ variables: { input } });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save the order." });
    }
  }

  return (
    <Dialog fullScreen open onClose={onClose} PaperProps={{ sx: { display: "flex", flexDirection: "column" } }}>
      <AppBar position="relative" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>{editOrder ? `Edit order ${editOrder.orderNumber}` : "New order (POS)"}</Typography>
          <IconButton edge="end" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", gap: 2, p: 2, flex: 1, minHeight: 0, bgcolor: "background.default" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ItemCatalog items={menuData?.menuItems ?? []} categories={catData?.categories ?? []} onAdd={addMenuItem} />
        </Box>
        <OrderPanel
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
          customers={custData?.customers ?? []}
          leads={leadData?.leads ?? []}
          societies={socData?.societies ?? []}
          coupons={activeCoupons}
          fields={fields}
          totals={totals}
          isDelivery={isDelivery}
          orderType={form.orderType}
          setOrderType={(v) => setValue("orderType", v)}
          baseStatus={editOrder?.status ?? "PLACED"}
          onQty={changeQty}
          onRemove={remove}
          onCreate={handleSubmit(onSave)}
          isSubmitting={isSubmitting}
          rootError={errors.root?.message}
          submitLabel={editOrder ? "Save changes" : "Create order"}
        />
      </Box>
    </Dialog>
  );
}

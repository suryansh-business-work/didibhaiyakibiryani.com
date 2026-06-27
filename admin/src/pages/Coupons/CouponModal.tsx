import { type Control, type FieldErrors } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { Modal, FormActions } from "../../components/ui";
import { RHFField, RHFSelect, RHFCheckbox, type CouponForm } from "../../form";
import { TYPE_OPTIONS, type FreeItemOption } from "./types";

interface CouponModalProps {
  editing: boolean;
  control: Control<CouponForm>;
  errors: FieldErrors<CouponForm>;
  type: string;
  items: FreeItemOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CouponModal({
  editing,
  control,
  errors,
  type,
  items,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<CouponModalProps>) {
  const isAmountType = type === "PERCENT" || type === "FLAT";
  const valueLabel = type === "PERCENT" ? "Percent (%)" : "Amount (₹)";

  return (
    <Modal
      title={editing ? "Edit coupon" : "New coupon"}
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={onSubmit} busy={isSubmitting} />}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <RHFField control={control} name="code" label="Code" placeholder="BIRYANI50" error={errors.code?.message} />
        <RHFSelect control={control} name="type" label="Type" options={TYPE_OPTIONS} emptyLabel="Select type" />
      </Box>
      <RHFField control={control} name="title" label="Title" error={errors.title?.message} />
      <RHFField control={control} name="description" label="Description" error={errors.description?.message} />

      {isAmountType ? (
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <RHFField control={control} name="value" label={valueLabel} type="number" error={errors.value?.message} />
          {type === "PERCENT" ? (
            <RHFField control={control} name="maxDiscount" label="Max discount (₹)" type="number" error={errors.maxDiscount?.message} />
          ) : null}
        </Box>
      ) : null}

      {type === "FREE_ITEM" ? (
        <RHFSelect
          control={control}
          name="freeItemId"
          label="Free item"
          options={items.map((i) => ({ value: i.id, label: i.name }))}
          error={errors.freeItemId?.message}
          emptyLabel="Select…"
        />
      ) : null}

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <RHFField control={control} name="minOrder" label="Min order (₹)" type="number" error={errors.minOrder?.message} />
        <RHFField control={control} name="usageLimit" label="Usage limit (0 = ∞)" type="number" error={errors.usageLimit?.message} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
        <RHFCheckbox control={control} name="firstOrderOnly" label="First order only" />
        <RHFCheckbox control={control} name="appOnly" label="App only" />
        <RHFCheckbox control={control} name="isActive" label="Active" />
      </Box>
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}

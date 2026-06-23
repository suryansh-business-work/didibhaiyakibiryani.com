import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Box, MenuItem as MuiMenuItem, TextField, Typography } from "@mui/material";
import { Modal, FormActions } from "../../components/ui";
import { RHFField, RHFCheckbox, type CouponForm } from "../../form";
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
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <TextField {...field} value={field.value ?? ""} select label="Type" size="small" margin="dense" fullWidth>
              {TYPE_OPTIONS.map((t) => <MuiMenuItem key={t.value} value={t.value}>{t.label}</MuiMenuItem>)}
            </TextField>
          )}
        />
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
        <Controller
          control={control}
          name="freeItemId"
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              select
              label="Free item"
              size="small"
              margin="dense"
              fullWidth
              error={Boolean(errors.freeItemId)}
              helperText={errors.freeItemId?.message}
            >
              <MuiMenuItem value="">Select…</MuiMenuItem>
              {items.map((i) => <MuiMenuItem key={i.id} value={i.id}>{i.name}</MuiMenuItem>)}
            </TextField>
          )}
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

import { Controller, type Control, type FieldErrors, type UseFormWatch, type UseFormSetValue } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Modal, FormActions, inr } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { RHFField, RHFSelect, RHFCheckbox, type MenuForm } from "../../form";
import { BADGE_OPTIONS, SERVES_OPTIONS, SPICE_OPTIONS, type Cat } from "./types";

interface MenuItemModalProps {
  editing: boolean;
  control: Control<MenuForm>;
  errors: FieldErrors<MenuForm>;
  watch: UseFormWatch<MenuForm>;
  setValue: UseFormSetValue<MenuForm>;
  cats: Cat[];
  imageUrl: string;
  onImageUploaded: (url: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function FinanceAccordion({
  control,
  watch,
  setValue,
  error,
}: Readonly<{ control: Control<MenuForm>; watch: UseFormWatch<MenuForm>; setValue: UseFormSetValue<MenuForm>; error?: string }>) {
  const price = Number(watch("price")) || 0;
  const cost = Number(watch("makingCost")) || 0;
  const profit = price - cost;
  const margin = price > 0 ? Math.round((profit / price) * 100) : 0;

  // Making cost and Profit/unit are two views of the same number: cost + profit = price.
  // Editing Profit/unit derives the making cost (clamped to 0…price) and merges it back.
  function onProfitChange(raw: string) {
    const entered = Number(raw);
    if (!Number.isFinite(entered)) return;
    const nextCost = Math.min(Math.max(price - entered, 0), price);
    setValue("makingCost", nextCost, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <Accordion disableGutters sx={{ mt: 1, bgcolor: "transparent" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={700}>Finance</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <RHFField control={control} name="makingCost" label="Making cost (₹)" type="number" hint="What one unit costs you to make" error={error} />
            <TextField
              label="Profit / unit (₹)"
              type="number"
              size="small"
              margin="dense"
              fullWidth
              value={profit}
              onChange={(e) => onProfitChange(e.target.value)}
              helperText="Sets making cost from price"
            />
          </Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Profit / unit</Typography>
            <Typography variant="body2" fontWeight={700} color={profit >= 0 ? "success.main" : "error"}>
              {inr(profit)} ({margin}% margin)
            </Typography>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function MenuItemModal({
  editing,
  control,
  errors,
  watch,
  setValue,
  cats,
  imageUrl,
  onImageUploaded,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<MenuItemModalProps>) {
  return (
    <Modal
      title={editing ? "Edit item" : "New item"}
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={onSubmit} busy={isSubmitting} />}
    >
      <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
      <RHFField control={control} name="description" label="Description" multiline error={errors.description?.message} />
      <ImageUpload label="Item photo" folder="/menu" currentUrl={imageUrl} onUploaded={onImageUploaded} />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <RHFField control={control} name="price" label="Price (₹)" type="number" error={errors.price?.message} />
        <RHFSelect
          control={control}
          name="categoryId"
          label="Category"
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.categoryId?.message}
          emptyLabel="Select…"
        />
      </Box>
      <FinanceAccordion control={control} watch={watch} setValue={setValue} error={errors.makingCost?.message} />
      <RHFCheckbox control={control} name="spiceSelectable" label="Let customers choose a spice level for this item" />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Controller
          control={control}
          name="spiceLevel"
          render={({ field }) => (
            <Autocomplete
              options={SPICE_OPTIONS}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              value={SPICE_OPTIONS.find((o) => o.value === field.value) ?? null}
              onChange={(_, opt) => field.onChange(opt ? opt.value : 0)}
              fullWidth
              size="small"
              renderInput={(params) => <TextField {...params} label="Default spice level" margin="dense" onBlur={field.onBlur} />}
            />
          )}
        />
        <RHFSelect control={control} name="serves" label="Serves" options={SERVES_OPTIONS} emptyLabel="—" />
      </Box>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <RHFSelect control={control} name="badge" label="Badge" options={BADGE_OPTIONS} emptyLabel="None" />
        <RHFField control={control} name="tags" label="Tags (comma-separated)" placeholder="bestseller, paneer" error={errors.tags?.message} />
      </Box>
      <Controller
        control={control}
        name="isAvailable"
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox checked={!field.value} onChange={(e) => field.onChange(!e.target.checked)} />}
            label="Out of stock (hides “Add” in apps and blocks ordering)"
          />
        )}
      />
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}

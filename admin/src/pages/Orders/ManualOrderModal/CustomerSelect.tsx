import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { Autocomplete, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { ManualOrderForm } from "../../../form";
import type { CustomerOption } from "./types";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  watch: UseFormWatch<ManualOrderForm>;
  setValue: UseFormSetValue<ManualOrderForm>;
  customers: CustomerOption[];
}

/** Counter walk-in (name/phone) or an existing account (searchable). */
export function CustomerSelect({ control, errors, watch, setValue, customers }: Readonly<Props>) {
  const isWalkin = watch("customerMode") === "WALKIN";
  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={isWalkin ? "WALKIN" : "EXISTING"}
        onChange={(_, v) => {
          if (v) setValue("customerMode", v);
        }}
      >
        <ToggleButton value="WALKIN">Walk-in</ToggleButton>
        <ToggleButton value="EXISTING">Existing</ToggleButton>
      </ToggleButtonGroup>

      {isWalkin ? (
        <Stack direction="row" spacing={1}>
          <Controller
            control={control}
            name="customerName"
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Name"
                size="small"
                fullWidth
                error={Boolean(errors.customerName)}
                helperText={errors.customerName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="customerPhone"
            render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Phone" size="small" fullWidth />}
          />
        </Stack>
      ) : (
        <Controller
          control={control}
          name="userId"
          render={({ field }) => (
            <Autocomplete
              options={customers}
              getOptionLabel={(o) => (o.phone ? `${o.name} · ${o.phone}` : o.name)}
              isOptionEqualToValue={(o, val) => o.id === val.id}
              value={customers.find((c) => c.id === field.value) ?? null}
              onChange={(_, val) => setValue("userId", val?.id ?? "", { shouldValidate: true })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select customer"
                  size="small"
                  error={Boolean(errors.userId)}
                  helperText={errors.userId?.message}
                />
              )}
            />
          )}
        />
      )}
    </Stack>
  );
}

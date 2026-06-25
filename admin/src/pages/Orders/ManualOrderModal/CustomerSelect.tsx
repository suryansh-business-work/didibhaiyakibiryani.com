import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { Autocomplete, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { ManualOrderForm } from "../../../form";
import type { CustomerOption, LeadOption, SocietyOption } from "./types";

type Source = "WALKIN" | "EXISTING" | "CONTACT";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  watch: UseFormWatch<ManualOrderForm>;
  setValue: UseFormSetValue<ManualOrderForm>;
  customers: CustomerOption[];
  leads: LeadOption[];
  societies: SocietyOption[];
}

/** Counter walk-in (name/phone), a signed-up account, or a saved non-signup
 * contact (which fills the name/phone snapshot). */
export function CustomerSelect({ control, errors, watch, setValue, customers, leads, societies }: Readonly<Props>) {
  const isExisting = watch("customerMode") === "EXISTING";
  const [source, setSource] = useState<Source>(isExisting ? "EXISTING" : "WALKIN");

  function changeSource(next: Source) {
    setSource(next);
    if (next === "EXISTING") {
      setValue("customerMode", "EXISTING");
    } else {
      setValue("customerMode", "WALKIN");
      setValue("userId", "");
    }
  }

  function pickContact(l: LeadOption | null) {
    setValue("customerName", l?.name ?? "", { shouldValidate: true });
    setValue("customerPhone", l?.phone ?? "");
    if (!l) return;
    // Society contacts store only the society name; resolve its city/state/pin.
    const society = l.society ? societies.find((s) => s.name === l.society) : undefined;
    const line1 = l.society
      ? [l.flat ? `Flat ${l.flat}` : "", l.block, l.society].filter(Boolean).join(", ")
      : l.address ?? "";
    const city = l.city ?? society?.city ?? "";
    const state = l.state ?? society?.state ?? "";
    const pincode = l.pincode ?? society?.pincode ?? "";
    const hasAddress = Boolean(line1 || city || state || pincode);
    if (!hasAddress) return;
    // A saved address means this is almost certainly a delivery — switch and fill.
    setValue("orderType", "DELIVERY");
    setValue("line1", line1, { shouldValidate: true });
    setValue("city", city, { shouldValidate: true });
    setValue("state", state);
    setValue("pincode", pincode);
  }

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={source}
        onChange={(_, v) => {
          if (v) changeSource(v);
        }}
      >
        <ToggleButton value="WALKIN">Walk-in</ToggleButton>
        <ToggleButton value="EXISTING">Signed-up</ToggleButton>
        <ToggleButton value="CONTACT">Contacts</ToggleButton>
      </ToggleButtonGroup>

      {source === "EXISTING" && (
        <Controller
          control={control}
          name="userId"
          render={() => (
            <Autocomplete
              options={customers}
              getOptionLabel={(o) => (o.phone ? `${o.name} · ${o.phone}` : o.name)}
              isOptionEqualToValue={(o, val) => o.id === val.id}
              value={customers.find((c) => c.id === watch("userId")) ?? null}
              onChange={(_, val) => setValue("userId", val?.id ?? "", { shouldValidate: true })}
              renderInput={(params) => (
                <TextField {...params} label="Select customer" size="small" error={Boolean(errors.userId)} helperText={errors.userId?.message} />
              )}
            />
          )}
        />
      )}

      {source === "CONTACT" && (
        <Autocomplete
          options={leads}
          getOptionLabel={(o) => (o.phone ? `${o.name} · ${o.phone}` : o.name)}
          isOptionEqualToValue={(o, val) => o.id === val.id}
          onChange={(_, val) => pickContact(val)}
          renderInput={(params) => <TextField {...params} label="Pick a contact" size="small" />}
        />
      )}

      {source !== "EXISTING" && (
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
      )}
    </Stack>
  );
}

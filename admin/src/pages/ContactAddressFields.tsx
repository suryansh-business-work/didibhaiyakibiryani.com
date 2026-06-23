import { type Control, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { RHFField, RHFSelect, type LeadForm } from "../form";

interface Props {
  control: Control<LeadForm>;
  errors: FieldErrors<LeadForm>;
  watch: UseFormWatch<LeadForm>;
  setValue: UseFormSetValue<LeadForm>;
  societyOptions: ReadonlyArray<{ value: string; label: string }>;
}

/** Address entry for a contact: a free-form address, or a society + block + flat. */
export default function ContactAddressFields({ control, errors, watch, setValue, societyOptions }: Readonly<Props>) {
  const mode = watch("addressMode");
  return (
    <>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={mode}
        onChange={(_, v) => {
          if (v) setValue("addressMode", v);
        }}
        sx={{ mt: 1.5, mb: 0.5 }}
      >
        <ToggleButton value="ADDRESS">Address</ToggleButton>
        <ToggleButton value="SOCIETY">Society based</ToggleButton>
      </ToggleButtonGroup>

      {mode === "ADDRESS" ? (
        <RHFField control={control} name="address" label="Full address" multiline error={errors.address?.message} />
      ) : (
        <>
          <RHFSelect control={control} name="society" label="Society" options={societyOptions} error={errors.society?.message} />
          <Stack direction="row" spacing={1}>
            <RHFField control={control} name="block" label="Block" error={errors.block?.message} />
            <RHFField control={control} name="flat" label="Flat number" error={errors.flat?.message} />
          </Stack>
        </>
      )}
    </>
  );
}

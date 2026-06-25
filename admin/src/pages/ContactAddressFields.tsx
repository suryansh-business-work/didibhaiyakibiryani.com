import { useEffect, useMemo } from "react";
import { type Control, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { RHFField, RHFSelect, type LeadForm } from "../form";
import { STATE_OPTIONS } from "../constants/india";
import LocationPicker, { type LatLng } from "../components/LocationPicker";

export interface SocietyRef {
  id: string;
  name: string;
  area?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

interface Props {
  control: Control<LeadForm>;
  errors: FieldErrors<LeadForm>;
  watch: UseFormWatch<LeadForm>;
  setValue: UseFormSetValue<LeadForm>;
  societies: ReadonlyArray<SocietyRef>;
}

/**
 * Address entry for a contact. Address mode asks for a free-form address plus
 * City / State / Pin Code; Society mode needs only society + block + flat — the
 * society itself carries city/state and a map location, which we pin automatically.
 */
export default function ContactAddressFields({ control, errors, watch, setValue, societies }: Readonly<Props>) {
  const mode = watch("addressMode");
  const societyName = watch("society");
  const block = watch("block");
  const flat = watch("flat");
  const lat = watch("lat");
  const lng = watch("lng");
  const pin: LatLng | null = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;

  const societyOptions = useMemo(() => societies.map((s) => ({ value: s.name, label: s.name })), [societies]);
  const society = useMemo(() => societies.find((s) => s.name === societyName), [societies, societyName]);

  // When a society is picked, move the map + drop the pin at its saved location.
  useEffect(() => {
    if (mode !== "SOCIETY") return;
    if (typeof society?.lat === "number" && typeof society?.lng === "number") {
      setValue("lat", society.lat, { shouldDirty: true });
      setValue("lng", society.lng, { shouldDirty: true });
    }
  }, [mode, society?.lat, society?.lng, setValue]);

  function setPin(next: LatLng) {
    setValue("lat", next.lat, { shouldDirty: true });
    setValue("lng", next.lng, { shouldDirty: true });
  }
  function clearPin() {
    setValue("lat", undefined, { shouldDirty: true });
    setValue("lng", undefined, { shouldDirty: true });
  }

  const fullAddress =
    mode === "SOCIETY" && society
      ? [flat ? `Flat ${flat}` : "", block, society.name, society.line1, society.area, society.city, society.state, society.pincode]
          .filter(Boolean)
          .join(", ")
      : "";
  const coords = pin ? ` (${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)})` : "";

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
      >
        <ToggleButton value="ADDRESS">Address</ToggleButton>
        <ToggleButton value="SOCIETY">Society based</ToggleButton>
      </ToggleButtonGroup>

      {mode === "ADDRESS" ? (
        <>
          <RHFField control={control} name="address" label="Full address" multiline margin="none" error={errors.address?.message} />
          <Stack direction="row" spacing={2}>
            <RHFField control={control} name="city" label="City" margin="none" error={errors.city?.message} />
            <RHFField control={control} name="pincode" label="Pin code" margin="none" error={errors.pincode?.message} />
          </Stack>
          <RHFSelect control={control} name="state" label="State" options={STATE_OPTIONS} margin="none" error={errors.state?.message} />
        </>
      ) : (
        <>
          <RHFSelect control={control} name="society" label="Society" options={societyOptions} margin="none" error={errors.society?.message} />
          <Stack direction="row" spacing={2}>
            <RHFField control={control} name="block" label="Block" margin="none" error={errors.block?.message} />
            <RHFField control={control} name="flat" label="Flat number" margin="none" error={errors.flat?.message} />
          </Stack>
          {fullAddress ? (
            <Typography variant="body2" color="text.secondary">{fullAddress}{coords}</Typography>
          ) : null}
        </>
      )}

      <LocationPicker value={pin} onChange={setPin} onClear={clearPin} />
    </>
  );
}

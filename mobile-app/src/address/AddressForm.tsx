import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { YStack, XStack, Text, Button } from "tamagui";
import { SocietyPicker, type Society } from "../checkout/SocietyPicker";
import { RHFTextField, BlockPicker, addressSchema, type AddressForm as AddressFormValues } from "../form";
import { useColors } from "../theme";

export interface NewAddressInput {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

/** Add-address form (society + flat + block). Owns its own RHF state and builds
 *  the address input; the parent runs the mutation and reports failures back. */
export function AddressForm({ saving, onCancel, onSubmit }: Readonly<{ saving: boolean; onCancel: () => void; onSubmit: (input: NewAddressInput) => Promise<void> }>) {
  const brand = useColors();
  const [society, setSociety] = useState<Society | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const { control, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", societyId: "", flatNumber: "", block: "" },
  });

  function pickSociety(s: Society) {
    setSociety(s);
    setValue("societyId", s.id, { shouldValidate: true });
  }

  async function submit(form: AddressFormValues) {
    if (!society) {
      setError("societyId", { message: "Select your society" });
      return;
    }
    try {
      await onSubmit({
        label: form.label?.trim() || "Home",
        line1: `Flat ${form.flatNumber.trim()}, Block ${form.block}`,
        line2: society.area || undefined,
        city: society.name,
        pincode: society.pincode || "",
        isDefault,
      });
    } catch (e: unknown) {
      setError("flatNumber", { message: e instanceof Error ? e.message : "Could not add address." });
    }
  }

  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={12} padding={16} gap={10}>
      <Text fontWeight="800" color={brand.text} fontSize={15}>Add new address</Text>

      <RHFTextField control={control} name="label" label="Label" placeholder="e.g. Home, Office" error={errors.label?.message} />

      <YStack gap={5}>
        <Text fontSize={12} color={brand.muted} fontWeight="700">Society</Text>
        <SocietyPicker selectedId={watch("societyId") || null} onSelect={pickSociety} />
        {errors.societyId ? <Text fontSize={12} color={brand.red}>{errors.societyId.message}</Text> : null}
      </YStack>

      <RHFTextField control={control} name="flatNumber" label="Flat number" keyboard="number-pad" error={errors.flatNumber?.message} />
      <BlockPicker label="Block" value={watch("block") ?? ""} onChange={(b) => setValue("block", b, { shouldValidate: true })} error={errors.block?.message} />

      <XStack gap={10} alignItems="center" paddingVertical={8}>
        <Button
          flex={1}
          height={40}
          backgroundColor={isDefault ? "rgba(228,182,92,0.16)" : brand.card}
          borderColor={isDefault ? brand.goldDeep : brand.border}
          borderWidth={1}
          color={isDefault ? brand.gold : brand.dim}
          fontWeight="700"
          onPress={() => setIsDefault(!isDefault)}
        >
          {isDefault ? "✓ Set as default" : "Set as default"}
        </Button>
      </XStack>

      <XStack gap={10}>
        <Button flex={1} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} fontWeight="700" onPress={onCancel}>
          Cancel
        </Button>
        <Button flex={1} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={saving} onPress={handleSubmit(submit)}>
          {saving ? "Saving…" : "Save address"}
        </Button>
      </XStack>
    </YStack>
  );
}

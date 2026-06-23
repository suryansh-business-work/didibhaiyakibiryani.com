import { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { ME, ADD_ADDRESS, REMOVE_ADDRESS } from "../src/graphql";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";
import { SocietyPicker, type Society } from "../src/checkout/SocietyPicker";
import { RHFTextField, BlockPicker, addressSchema, type AddressForm } from "../src/form";
import { BackButton, MIcon } from "../src/components";

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
}

export default function Addresses() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, refetch } = useQuery<{ me: { addresses: Address[] } }>(ME, { skip: !user });
  const [addAddr, { loading: adding }] = useMutation(ADD_ADDRESS);
  const [removeAddr, { loading: removing }] = useMutation(REMOVE_ADDRESS);

  const [showForm, setShowForm] = useState(false);
  const [society, setSociety] = useState<Society | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", societyId: "", flatNumber: "", block: "" },
  });

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={20} fontWeight="800" color={brand.text}>Please log in</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.replace("/login")}>Log in</Button>
      </YStack>
    );
  }

  const addresses = data?.me?.addresses ?? [];

  function pickSociety(s: Society) {
    setSociety(s);
    setValue("societyId", s.id, { shouldValidate: true });
  }

  function closeForm() {
    setShowForm(false);
    setSociety(null);
    setIsDefault(false);
    reset();
  }

  async function onSubmit(form: AddressForm) {
    if (!society) {
      setError("societyId", { message: "Select your society" });
      return;
    }
    try {
      await addAddr({
        variables: {
          input: {
            label: form.label?.trim() || "Home",
            line1: `Flat ${form.flatNumber.trim()}, Block ${form.block}`,
            line2: society.area || undefined,
            city: society.name,
            pincode: society.pincode || "",
            isDefault,
          },
        },
      });
      closeForm();
      await refetch();
    } catch (e: unknown) {
      setError("flatNumber", { message: e instanceof Error ? e.message : "Could not add address." });
    }
  }

  async function deleteAddress(id: string) {
    try {
      await removeAddr({ variables: { addressId: id } });
      await refetch();
    } catch (e: unknown) {
      console.error("Delete failed:", e);
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Saved addresses</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}>
        {loading && !data ? (
          <YStack alignItems="center" justifyContent="center" padding={40}><Spinner color={brand.gold} /></YStack>
        ) : addresses.length === 0 && !showForm ? (
          <YStack gap={12}>
            <YStack alignItems="center" padding={28} gap={12}>
              <MIcon name="map-marker-outline" size={40} color={brand.gold} />
              <Text color={brand.muted} textAlign="center">No saved addresses yet.</Text>
            </YStack>
            <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => setShowForm(true)}>
              Add your first address
            </Button>
          </YStack>
        ) : (
          <>
            {addresses.map((a) => (
              <YStack key={a.id} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={12} padding={14} gap={8}>
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <YStack flex={1}>
                    <XStack gap={8} alignItems="center">
                      <Text fontWeight="800" color={brand.text}>{a.label}</Text>
                      {a.isDefault && <Text fontSize={11} fontWeight="800" color={brand.gold} backgroundColor="rgba(228,182,92,0.2)" paddingHorizontal={6} paddingVertical={2} borderRadius={4}>Default</Text>}
                    </XStack>
                    <Text fontSize={13} color={brand.dim}>{a.line1}</Text>
                    <Text fontSize={12} color={brand.muted}>{a.city}{a.pincode ? ` — ${a.pincode}` : ""}</Text>
                  </YStack>
                  <Button size="$2" circular backgroundColor="rgba(224,88,75,0.12)" borderColor="rgba(224,88,75,0.4)" borderWidth={1} disabled={removing} onPress={() => deleteAddress(a.id)}>
                    <MIcon name="trash-can-outline" size={16} color={brand.red} />
                  </Button>
                </XStack>
              </YStack>
            ))}
            {!showForm && (
              <Button backgroundColor="rgba(228,182,92,0.12)" borderColor={brand.gold} borderWidth={1} color={brand.gold} fontWeight="800" onPress={() => setShowForm(true)}>
                + Add another address
              </Button>
            )}
          </>
        )}

        {showForm && (
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
              <Button flex={1} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} fontWeight="700" onPress={closeForm}>
                Cancel
              </Button>
              <Button flex={1} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={adding} onPress={handleSubmit(onSubmit)}>
                {adding ? "Saving…" : "Save address"}
              </Button>
            </XStack>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}

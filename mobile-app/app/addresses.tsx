import { useMemo, useState } from "react";
import { ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@apollo/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner, Input } from "tamagui";
import { ME, ADD_ADDRESS, REMOVE_ADDRESS, SET_DEFAULT_ADDRESS } from "../src/graphql";
import { useAuth } from "../src/auth";
import { useColors } from "../src/theme";
import { errorMessage } from "../src/error";
import { AddressForm, type NewAddressInput } from "../src/address/AddressForm";
import { AddressRow, type SavedAddress } from "../src/address/AddressRow";
import { BackButton, ErrorState, MIcon } from "../src/components";

export default function Addresses() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const { data, loading, error, refetch } = useQuery<{ me: { addresses: SavedAddress[] } }>(ME, { skip: !user });
  const [addAddr, { loading: adding }] = useMutation(ADD_ADDRESS);
  const [removeAddr, { loading: removing }] = useMutation(REMOVE_ADDRESS);
  const [setDefault] = useMutation(SET_DEFAULT_ADDRESS);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const addresses = data?.me?.addresses ?? [];
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter((a) => `${a.label} ${a.line1} ${a.line2 ?? ""} ${a.city}`.toLowerCase().includes(q));
  }, [addresses, search]);

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={20} fontWeight="800" color={brand.text}>Please log in</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.replace("/login")}>Log in</Button>
      </YStack>
    );
  }

  async function onSubmit(input: NewAddressInput) {
    await addAddr({ variables: { input } });
    setShowForm(false);
    await refetch();
  }

  async function deleteAddress(id: string) {
    try {
      await removeAddr({ variables: { addressId: id } });
      await refetch();
    } catch (e: unknown) {
      Alert.alert("Couldn't remove address", errorMessage(e));
    }
  }

  async function selectAddress(a: SavedAddress) {
    if (a.isDefault) {
      router.back();
      return;
    }
    try {
      await setDefault({ variables: { addressId: a.id } });
      await Promise.all([refetch(), refresh()]);
      router.back();
    } catch (e: unknown) {
      Alert.alert("Couldn't set delivery location", errorMessage(e));
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Delivery location</Text>
      </XStack>

      <XStack marginHorizontal={16} marginBottom={8} alignItems="center" gap={8} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={12} paddingHorizontal={12}>
        <MIcon name="magnify" size={20} color={brand.muted} />
        <Input flex={1} unstyled color={brand.text} placeholder="Search your saved locations" placeholderTextColor={brand.faint} value={search} onChangeText={setSearch} height={46} />
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12, paddingBottom: 30 }}>
        {loading && !data ? (
          <YStack alignItems="center" justifyContent="center" padding={40}><Spinner color={brand.gold} /></YStack>
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={() => { refetch().catch(() => {}); }} />
        ) : (
          <>
            {addresses.length > 0 && (
              <YStack gap={2}>
                <Text fontSize={13} fontWeight="800" color={brand.muted} textTransform="uppercase" letterSpacing={0.5}>Saved addresses</Text>
                <Text fontSize={12} color={brand.faint}>Tap an address to deliver there.</Text>
              </YStack>
            )}
            {shown.map((a) => (
              <AddressRow key={a.id} address={a} removing={removing} onSelect={() => selectAddress(a)} onDelete={() => deleteAddress(a.id)} />
            ))}
            {addresses.length > 0 && shown.length === 0 && <Text color={brand.muted} textAlign="center" paddingVertical={20}>No address matches “{search}”.</Text>}
            {addresses.length === 0 && !showForm && (
              <YStack alignItems="center" padding={28} gap={12}>
                <MIcon name="map-marker-outline" size={40} color={brand.gold} />
                <Text color={brand.muted} textAlign="center">No saved addresses yet.</Text>
              </YStack>
            )}

            {showForm ? (
              <AddressForm saving={adding} onCancel={() => setShowForm(false)} onSubmit={onSubmit} />
            ) : (
              <Button backgroundColor="rgba(228,182,92,0.12)" borderColor={brand.gold} borderWidth={1} color={brand.gold} fontWeight="800" icon={<MIcon name="plus" size={18} color={brand.gold} />} onPress={() => setShowForm(true)}>
                Add a new address
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </YStack>
  );
}

import { useState } from "react";
import { Linking, ScrollView } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { YStack, XStack, Text, Button } from "tamagui";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { DELIVERY_QUEUE, UPDATE_ORDER_STATUS } from "../../src/graphql";
import { Loading, Empty, StatusBadge, RiderHeader } from "../../src/ui";
import { brand, inr, fmtDate } from "../../src/theme";
import type { QueueOrder } from "../../src/types";

function mapsUrl(o: QueueOrder): string {
  const a = o.address;
  const q = a.lat && a.lng ? `${a.lat},${a.lng}` : `${a.line1}, ${a.city} ${a.pincode}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

function nextAction(status: string): { to: string; label: string } | null {
  if (status === "PREPARING") return { to: "OUT_FOR_DELIVERY", label: "Picked up — start delivery" };
  if (status === "OUT_FOR_DELIVERY") return { to: "DELIVERED", label: "Mark delivered ✓" };
  return null;
}

interface CardProps {
  order: QueueOrder;
  saving: boolean;
  onMove: (o: QueueOrder, status: string) => void;
}

function OrderCard({ order, saving, onMove }: Readonly<CardProps>) {
  const a = order.address;
  const action = nextAction(order.status);
  const phone = a.phone ?? order.user?.phone;
  const cod = order.paymentMethod === "COD";
  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={8}>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="800" color={brand.text}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </XStack>
      <Text fontSize={12} color={brand.faint}>{fmtDate(order.placedAt)}</Text>
      <YStack gap={2}>
        <Text color={brand.text} fontWeight="700">{order.user?.name ?? "Customer"}</Text>
        <Text color={brand.muted} fontSize={13}>
          {a.line1}{a.line2 ? `, ${a.line2}` : ""} · {a.city} — {a.pincode}
        </Text>
      </YStack>
      <Text color={brand.muted} fontSize={13} numberOfLines={2}>
        {order.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
      </Text>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize={12} fontWeight="700" color={cod ? brand.gold : brand.green}>
          {cod ? `Collect ${inr(order.total)} (cash)` : "Paid online"}
        </Text>
        <Text fontWeight="800" color={brand.gold}>{inr(order.total)}</Text>
      </XStack>
      {order.notes ? <Text color={brand.muted} fontSize={13}>📝 {order.notes}</Text> : null}
      <XStack gap={8} flexWrap="wrap" marginTop={2}>
        <Button size="$2" backgroundColor={brand.cardSoft} borderColor={brand.border} borderWidth={1} color={brand.dim}
          icon={<MaterialDesignIcons name="map-marker-path" size={16} color={brand.dim} />}
          onPress={() => Linking.openURL(mapsUrl(order))}>
          Navigate
        </Button>
        {phone ? (
          <Button size="$2" backgroundColor={brand.cardSoft} borderColor={brand.border} borderWidth={1} color={brand.dim}
            icon={<MaterialDesignIcons name="phone" size={16} color={brand.dim} />}
            onPress={() => Linking.openURL(`tel:${phone}`)}>
            Call
          </Button>
        ) : null}
        {action ? (
          <Button size="$2" backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={saving} onPress={() => onMove(order, action.to)}>
            {action.label}
          </Button>
        ) : (
          <Text color={brand.muted} fontSize={12} alignSelf="center">Waiting for the kitchen…</Text>
        )}
      </XStack>
    </YStack>
  );
}

export default function Queue() {
  const { data, loading, refetch } = useQuery<{ deliveryQueue: QueueOrder[] }>(DELIVERY_QUEUE, {
    pollInterval: 20000,
  });
  const [updateStatus, { loading: saving }] = useMutation(UPDATE_ORDER_STATUS);
  const orders = data?.deliveryQueue ?? [];

  async function move(o: QueueOrder, status: string) {
    try {
      await updateStatus({ variables: { id: o.id, status } });
      await refetch();
    } catch {
      /* surfaced via Apollo error UI on next render; keep the queue responsive */
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <RiderHeader title="My queue" />
      {loading && !data ? (
        <Loading label="Loading your orders…" />
      ) : orders.length === 0 ? (
        <Empty>No assigned orders right now — new assignments appear here automatically.</Empty>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} saving={saving} onMove={move} />
          ))}
        </ScrollView>
      )}
    </YStack>
  );
}

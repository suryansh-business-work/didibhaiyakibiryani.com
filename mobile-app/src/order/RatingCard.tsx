import { useState } from "react";
import { useMutation } from "@apollo/client";
import { YStack, XStack, Text, Button, Input } from "tamagui";
import { RATE_ORDER } from "../graphql";
import { brand } from "../theme";
import { DropIn } from "../animations";

export interface OrderRating {
  food: number;
  delivery: number;
  comment?: string;
}

interface RatingCardProps {
  orderId: string;
  rating?: OrderRating | null;
  onRated: () => void;
}

function StarRow({ value, onChange, label }: Readonly<{ value: number; onChange: (n: number) => void; label: string }>) {
  return (
    <YStack gap={4}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <XStack gap={6}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text
            key={n}
            fontSize={28}
            color={n <= value ? brand.gold : brand.faint}
            onPress={() => onChange(n)}
          >
            ★
          </Text>
        ))}
      </XStack>
    </YStack>
  );
}

/** Post-delivery survey: rate the food and the delivery, right in the app. */
export function RatingCard({ orderId, rating, onRated }: Readonly<RatingCardProps>) {
  const [food, setFood] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [rate, { loading }] = useMutation(RATE_ORDER);

  if (rating) {
    return (
      <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={6}>
        <Text fontWeight="800" color={brand.text}>Your rating 🙏</Text>
        <Text color={brand.dim}>Food {"★".repeat(rating.food)} · Delivery {"★".repeat(rating.delivery)}</Text>
        {rating.comment ? <Text color={brand.muted} fontSize={13}>“{rating.comment}”</Text> : null}
      </YStack>
    );
  }

  async function submit() {
    setError("");
    if (food < 1 || delivery < 1) {
      setError("Tap the stars to rate both food and delivery.");
      return;
    }
    try {
      await rate({ variables: { orderId, food, delivery, comment: comment.trim() || null } });
      onRated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save your rating.");
    }
  }

  return (
    <DropIn>
      <YStack backgroundColor={brand.card} borderColor={brand.goldDeep} borderWidth={1} borderRadius={16} padding={16} gap={12}>
        <Text fontWeight="800" color={brand.text} fontSize={16}>How was it? 🌟</Text>
        <StarRow label="Food quality" value={food} onChange={setFood} />
        <StarRow label="Delivery experience" value={delivery} onChange={setDelivery} />
        <Input
          value={comment}
          onChangeText={setComment}
          placeholder="Anything else? (optional)"
          backgroundColor={brand.bgSoft}
          borderColor={brand.borderStrong}
          color={brand.text}
          placeholderTextColor={brand.faint}
        />
        {error ? <Text color={brand.red} fontSize={12}>{error}</Text> : null}
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={loading} onPress={submit}>
          {loading ? "Saving…" : "Submit rating"}
        </Button>
      </YStack>
    </DropIn>
  );
}

import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { YStack, XStack, Text, Button } from "tamagui";
import { RATE_ORDER } from "../graphql";
import { brand } from "../theme";
import { DropIn } from "../animations";
import { MIcon } from "../components";
import { RHFTextField, ratingSchema, type RatingForm } from "../form";

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

function StarRow({ value, onChange, label, error }: Readonly<{ value: number; onChange: (n: number) => void; label: string; error?: string }>) {
  return (
    <YStack gap={4}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <XStack gap={6}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text key={n} fontSize={28} color={n <= value ? brand.gold : brand.faint} onPress={() => onChange(n)}>
            ★
          </Text>
        ))}
      </XStack>
      {error ? <Text fontSize={12} color={brand.red}>{error}</Text> : null}
    </YStack>
  );
}

/** Post-delivery survey: rate the food and the delivery, right in the app. */
export function RatingCard({ orderId, rating, onRated }: Readonly<RatingCardProps>) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RatingForm>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { food: 0, delivery: 0, comment: "" },
  });
  const [rate, { loading }] = useMutation(RATE_ORDER);

  if (rating) {
    return (
      <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={6}>
        <XStack gap={6} alignItems="center">
          <Text fontWeight="800" color={brand.text}>Your rating</Text>
          <MIcon name="hand-heart-outline" size={16} color={brand.gold} />
        </XStack>
        <Text color={brand.dim}>Food {"★".repeat(rating.food)} · Delivery {"★".repeat(rating.delivery)}</Text>
        {rating.comment ? <Text color={brand.muted} fontSize={13}>“{rating.comment}”</Text> : null}
      </YStack>
    );
  }

  async function onSubmit(data: RatingForm) {
    try {
      await rate({ variables: { orderId, food: data.food, delivery: data.delivery, comment: data.comment?.trim() || null } });
      onRated();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save your rating." });
    }
  }

  return (
    <DropIn>
      <YStack backgroundColor={brand.card} borderColor={brand.goldDeep} borderWidth={1} borderRadius={16} padding={16} gap={12}>
        <XStack gap={6} alignItems="center">
          <Text fontWeight="800" color={brand.text} fontSize={16}>How was it?</Text>
          <MIcon name="star-outline" size={18} color={brand.gold} />
        </XStack>
        <StarRow label="Food quality" value={watch("food")} onChange={(n) => setValue("food", n, { shouldValidate: true })} error={errors.food?.message} />
        <StarRow label="Delivery experience" value={watch("delivery")} onChange={(n) => setValue("delivery", n, { shouldValidate: true })} error={errors.delivery?.message} />
        <RHFTextField control={control} name="comment" label="Comment (optional)" placeholder="Anything else?" error={errors.comment?.message} />
        {errors.root ? <Text color={brand.red} fontSize={12}>{errors.root.message}</Text> : null}
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={loading} onPress={handleSubmit(onSubmit)}>
          {loading ? "Saving…" : "Submit rating"}
        </Button>
      </YStack>
    </DropIn>
  );
}

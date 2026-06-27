import { useState } from "react";
import { useMutation } from "@apollo/client";
import { YStack, XStack, Text, Button } from "tamagui";
import { CANCEL_ORDER } from "../graphql";
import { useColors } from "../theme";
import { errorMessage } from "../error";

interface CancelOrderProps {
  orderId: string;
  onCancelled: () => void;
}

/** Inline cancel flow (no native Alert — works on web too). */
export function CancelOrder({ orderId, onCancelled }: Readonly<CancelOrderProps>) {
  const brand = useColors();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [cancel, { loading }] = useMutation(CANCEL_ORDER);

  async function doCancel() {
    setError("");
    try {
      await cancel({ variables: { id: orderId } });
      onCancelled();
    } catch (e: unknown) {
      setError(errorMessage(e, "Could not cancel — try again."));
    }
  }

  if (!confirming) {
    return (
      <Button
        backgroundColor="rgba(224,88,75,0.12)"
        borderColor="rgba(224,88,75,0.4)"
        borderWidth={1}
        color={brand.red}
        fontWeight="800"
        onPress={() => setConfirming(true)}
      >
        Cancel order
      </Button>
    );
  }

  return (
    <YStack gap={10} backgroundColor={brand.card} borderColor="rgba(224,88,75,0.4)" borderWidth={1} borderRadius={14} padding={14}>
      <Text color={brand.text} fontWeight="800">Cancel this order? This can't be undone.</Text>
      {error ? <Text color={brand.red} fontSize={12}>{error}</Text> : null}
      <XStack gap={10}>
        <Button flex={1} chromeless color={brand.dim} borderColor={brand.border} borderWidth={1} onPress={() => setConfirming(false)}>
          Keep order
        </Button>
        <Button flex={1} backgroundColor={brand.red} color="#fff" fontWeight="800" disabled={loading} onPress={doCancel}>
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Button>
      </XStack>
    </YStack>
  );
}

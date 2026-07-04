import { useQuery } from "@apollo/client";
import { YStack, Text, Button, Spinner } from "tamagui";
import { SOCIETIES } from "../graphql";
import { useColors } from "../theme";

export interface Society {
  id: string;
  name: string;
  area?: string;
  pincode?: string;
}

interface SocietyPickerProps {
  selectedId: string | null;
  onSelect: (society: Society) => void;
}

/** Admin-managed delivery societies, shown as a single-select list. */
export function SocietyPicker({ selectedId, onSelect }: Readonly<SocietyPickerProps>) {
  const brand = useColors();
  const { data, loading } = useQuery<{ societies: Society[] }>(SOCIETIES);
  const societies = data?.societies ?? [];

  if (loading && !data) {
    return <Spinner color={brand.gold} />;
  }

  if (societies.length === 0) {
    return (
      <Text color={brand.muted} fontSize={12}>
        No delivery societies available yet. Please check back soon.
      </Text>
    );
  }

  return (
    <YStack gap={8}>
      {societies.map((s) => {
        const active = selectedId === s.id;
        return (
          <Button
            key={s.id}
            height="auto"
            paddingVertical={12}
            paddingHorizontal={14}
            backgroundColor={active ? "rgba(228,182,92,0.16)" : brand.card}
            borderColor={active ? brand.goldDeep : brand.border}
            borderWidth={1}
            pressStyle={{ opacity: 0.9 }}
            onPress={() => onSelect(s)}
          >
            <YStack gap={2} width="100%">
              <Text color={active ? brand.gold : brand.text} fontWeight="700" fontSize={13}>
                {s.name}
              </Text>
              {s.area ? (
                <Text color={active ? brand.dim : brand.muted} fontSize={11}>
                  {s.area}
                  {s.pincode ? ` — ${s.pincode}` : ""}
                </Text>
              ) : null}
            </YStack>
          </Button>
        );
      })}
    </YStack>
  );
}

import { useState } from "react";
import { Image, Linking, ScrollView, useWindowDimensions } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { useColors } from "../theme";
import type { Banner } from "./types";

interface HomeSliderProps {
  banners: Banner[];
}

const H = 150;

export function HomeSlider({ banners }: Readonly<HomeSliderProps>) {
  const brand = useColors();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (banners.length === 0) return null;

  const slideWidth = width - 28; // 14px horizontal padding each side

  const openLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch((e) => console.warn("Could not open slide link:", e));
  };

  return (
    <YStack paddingVertical={10}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / (slideWidth + 12)))
        }
      >
        {banners.map((b) => (
          <YStack
            key={b.id}
            width={slideWidth}
            height={H}
            borderRadius={16}
            overflow="hidden"
            backgroundColor={brand.cardSoft}
            pressStyle={b.linkUrl ? { opacity: 0.9, scale: 0.99 } : undefined}
            onPress={b.linkUrl ? () => openLink(b.linkUrl) : undefined}
          >
            <Image source={{ uri: b.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            {(b.title || b.subtitle) && (
              <YStack
                position="absolute"
                left={0}
                right={0}
                bottom={0}
                padding={14}
                backgroundColor="rgba(12,8,5,0.55)"
              >
                {b.title ? (
                  <Text fontSize={16} fontWeight="800" color="#fff">
                    {b.title}
                  </Text>
                ) : null}
                {b.subtitle ? (
                  <Text fontSize={12} color={brand.gold} marginTop={2}>
                    {b.subtitle}
                  </Text>
                ) : null}
              </YStack>
            )}
          </YStack>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <XStack alignSelf="center" gap={6} marginTop={10}>
          {banners.map((b, i) => (
            <YStack
              key={b.id}
              width={i === index ? 18 : 6}
              height={6}
              borderRadius={999}
              backgroundColor={i === index ? brand.gold : brand.border}
            />
          ))}
        </XStack>
      )}
    </YStack>
  );
}

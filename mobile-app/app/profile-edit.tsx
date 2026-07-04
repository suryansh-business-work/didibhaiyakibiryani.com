import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useMutation } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input } from "tamagui";
import { UPDATE_PROFILE, UPLOAD_AVATAR } from "../src/graphql";
import { useAuth } from "../src/auth";
import { useColors } from "../src/theme";
import { errorMessage } from "../src/error";
import { BackButton, MIcon } from "../src/components";

export default function ProfileEdit() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [update, { loading: saving }] = useMutation(UPDATE_PROFILE);
  const [uploadAvatar] = useMutation(UPLOAD_AVATAR);

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={20} fontWeight="800" color={brand.text}>Please log in</Text>
        <Button backgroundColor={brand.gold} color={brand.onGold} fontWeight="800" onPress={() => router.replace("/login")}>Log in</Button>
      </YStack>
    );
  }

  async function pickPhoto() {
    setUploading(true);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
      const asset = picked.assets?.[0];
      if (picked.canceled || !asset?.base64) return;
      const { data } = await uploadAvatar({ variables: { file: `data:image/jpeg;base64,${asset.base64}`, fileName: asset.fileName ?? "avatar.jpg" } });
      setAvatarUrl(data.uploadAvatarImage.url);
    } catch (e: unknown) {
      Alert.alert("Upload failed", errorMessage(e, "Could not upload the photo."));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    try {
      await update({ variables: { name: name.trim(), phone: phone.trim(), avatarUrl } });
      await refresh();
      router.back();
    } catch (e: unknown) {
      Alert.alert("Couldn't save", errorMessage(e));
    }
  }

  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Edit profile</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 40 }}>
        <YStack alignItems="center" gap={12}>
          <YStack width={110} height={110} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center" overflow="hidden" borderColor={brand.gold} borderWidth={2}>
            {avatarUrl ? (
              <Image source={avatarUrl} style={{ width: 110, height: 110 }} contentFit="cover" />
            ) : (
              <Text fontSize={40} fontWeight="800" color={brand.gold}>{initial}</Text>
            )}
          </YStack>
          <Button
            backgroundColor="rgba(228,182,92,0.12)"
            borderColor={brand.gold}
            borderWidth={1}
            color={brand.gold}
            fontWeight="700"
            disabled={uploading}
            icon={<MIcon name="camera-outline" size={16} color={brand.gold} />}
            onPress={pickPhoto}
          >
            {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add a photo"}
          </Button>
        </YStack>

        <YStack gap={6}>
          <Text fontSize={12} color={brand.muted} fontWeight="700">Name</Text>
          <Input value={name} onChangeText={setName} placeholder="Your name" backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} placeholderTextColor={brand.faint} />
        </YStack>

        <YStack gap={6}>
          <Text fontSize={12} color={brand.muted} fontWeight="700">Phone</Text>
          <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone number" backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} placeholderTextColor={brand.faint} />
        </YStack>

        <Button height={50} backgroundColor={brand.gold} color={brand.onGold} fontWeight="800" fontSize={16} borderRadius={12} disabled={saving || uploading} onPress={save}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </ScrollView>
    </YStack>
  );
}

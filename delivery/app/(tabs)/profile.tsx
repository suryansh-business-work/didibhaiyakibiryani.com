import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@apollo/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Image } from "tamagui";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { UPDATE_PROFILE, UPLOAD_AVATAR } from "../../src/graphql";
import { useAuth } from "../../src/auth";
import { brand } from "../../src/theme";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, refresh, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [update, { loading: saving }] = useMutation(UPDATE_PROFILE);
  const [uploadAvatar] = useMutation(UPLOAD_AVATAR);

  async function pickPhoto() {
    setUploading(true);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
      const asset = picked.assets?.[0];
      if (picked.canceled || !asset?.base64) return;
      const { data } = await uploadAvatar({ variables: { file: `data:image/jpeg;base64,${asset.base64}`, fileName: asset.fileName ?? "avatar.jpg" } });
      setAvatarUrl(data.uploadAvatarImage.url);
    } catch (e: unknown) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload the photo.");
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
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: unknown) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Please try again.");
    }
  }

  const initial = (name.trim().charAt(0) || "R").toUpperCase();

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <YStack paddingTop={insets.top + 12} paddingHorizontal={18} paddingBottom={8}>
        <Text fontSize={24} fontWeight="800" color={brand.text}>Profile</Text>
      </YStack>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 40 }}>
        <YStack alignItems="center" gap={12}>
          <YStack width={110} height={110} borderRadius={999} backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={2} alignItems="center" justifyContent="center" overflow="hidden">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl, width: 110, height: 110 }} width={110} height={110} />
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
            icon={<MaterialDesignIcons name="camera-outline" size={16} color={brand.gold} />}
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

        <Text fontSize={12} color={brand.faint}>{user?.email}</Text>

        <Button height={50} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={saving || uploading} onPress={save}>
          {saving ? "Saving…" : "Save changes"}
        </Button>

        <Button
          backgroundColor="rgba(224,88,75,0.12)"
          borderColor="rgba(224,88,75,0.4)"
          borderWidth={1}
          color={brand.red}
          fontWeight="800"
          onPress={logout}
        >
          Sign out
        </Button>
      </ScrollView>
    </YStack>
  );
}

import { useState } from "react";
import { useMutation } from "@apollo/client";
import * as ImagePicker from "expo-image-picker";
import { YStack, XStack, Text, Button, Input } from "tamagui";
import { CREATE_SUPPORT_TICKET, UPLOAD_SUPPORT_IMAGE } from "../graphql";
import { useSettings } from "../settings";
import { brand } from "../theme";

const OTHER = "Other (custom subject)";

interface SupportFormProps {
  orderId: string;
  onCreated: () => void;
}

/** Raise a support request: subject (admin-managed list + custom), photo, details. */
export function SupportForm({ orderId, onCreated }: Readonly<SupportFormProps>) {
  const settings = useSettings();
  const subjects = [...settings.supportSubjects, OTHER];

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [uploadImage] = useMutation(UPLOAD_SUPPORT_IMAGE);
  const [createTicket, { loading: creating }] = useMutation(CREATE_SUPPORT_TICKET);

  async function pickImage() {
    setError("");
    setUploading(true);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      const asset = picked.assets?.[0];
      if (picked.canceled || !asset?.base64) return;
      const { data } = await uploadImage({
        variables: {
          file: `data:image/jpeg;base64,${asset.base64}`,
          fileName: asset.fileName ?? "support.jpg",
        },
      });
      setImageUrl(data.uploadSupportImage.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError("");
    const finalSubject = subject === OTHER ? customSubject.trim() : subject;
    if (!finalSubject) {
      setError("Please choose what you need help with.");
      return;
    }
    if (!body.trim()) {
      setError("Please describe the issue briefly.");
      return;
    }
    try {
      await createTicket({
        variables: { orderId, subject: finalSubject, body: body.trim(), imageUrl: imageUrl || null },
      });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send — please try again.");
    }
  }

  return (
    <YStack gap={10}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">What do you need help with?</Text>
      <XStack gap={8} flexWrap="wrap">
        {subjects.map((s) => (
          <Button
            key={s}
            size="$2.5"
            borderRadius={999}
            backgroundColor={subject === s ? "rgba(228,182,92,0.16)" : "rgba(255,255,255,0.04)"}
            borderColor={subject === s ? brand.goldDeep : brand.border}
            borderWidth={1}
            color={subject === s ? brand.gold : brand.dim}
            fontWeight="700"
            onPress={() => setSubject(s)}
          >
            {s}
          </Button>
        ))}
      </XStack>

      {subject === OTHER && (
        <Input
          value={customSubject}
          onChangeText={setCustomSubject}
          placeholder="Type your subject…"
          backgroundColor={brand.bgSoft}
          borderColor={brand.borderStrong}
          color={brand.text}
          placeholderTextColor={brand.faint}
        />
      )}

      <Input
        value={body}
        onChangeText={setBody}
        placeholder="Tell us what happened…"
        multiline
        numberOfLines={3}
        backgroundColor={brand.bgSoft}
        borderColor={brand.borderStrong}
        color={brand.text}
        placeholderTextColor={brand.faint}
      />

      <XStack gap={10} alignItems="center">
        <Button
          size="$3"
          backgroundColor="rgba(228,182,92,0.12)"
          borderColor={brand.gold}
          borderWidth={1}
          color={brand.gold}
          fontWeight="700"
          disabled={uploading}
          onPress={pickImage}
        >
          {uploading ? "Uploading…" : imageUrl ? "📷 Change photo" : "📷 Add a photo"}
        </Button>
        {imageUrl ? <Text fontSize={12} color={brand.green}>Photo attached ✓</Text> : null}
      </XStack>

      {error ? <Text color={brand.red} fontSize={12}>{error}</Text> : null}

      <Button
        backgroundColor={brand.gold}
        color="#2a1a06"
        fontWeight="800"
        disabled={creating || uploading}
        onPress={submit}
      >
        {creating ? "Sending…" : "Send to support"}
      </Button>
    </YStack>
  );
}

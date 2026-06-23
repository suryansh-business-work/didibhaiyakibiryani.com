import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { YStack, XStack, Text, Button } from "tamagui";
import { CREATE_SUPPORT_TICKET, UPLOAD_SUPPORT_IMAGE } from "../graphql";
import { useSettings } from "../settings";
import { brand } from "../theme";
import { MIcon } from "../components";
import { RHFTextField, supportSchema, OTHER_SUBJECT, type SupportForm as SupportFormData } from "../form";

interface SupportFormProps {
  orderId: string;
  onCreated: () => void;
}

/** Raise a support request: subject (admin-managed list + custom), photo, details. */
export function SupportForm({ orderId, onCreated }: Readonly<SupportFormProps>) {
  const settings = useSettings();
  const subjects = [...settings.supportSubjects, OTHER_SUBJECT];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: { subject: "", customSubject: "", body: "" },
  });
  const subject = watch("subject");

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [uploadImage] = useMutation(UPLOAD_SUPPORT_IMAGE);
  const [createTicket, { loading: creating }] = useMutation(CREATE_SUPPORT_TICKET);

  async function pickImage() {
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
      setError("root", { message: e instanceof Error ? e.message : "Could not upload the photo." });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: SupportFormData) {
    const finalSubject = data.subject === OTHER_SUBJECT ? (data.customSubject?.trim() ?? "") : data.subject;
    try {
      await createTicket({
        variables: { orderId, subject: finalSubject, body: data.body.trim(), imageUrl: imageUrl || null },
      });
      onCreated();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not send — please try again." });
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
            onPress={() => setValue("subject", s, { shouldValidate: true })}
          >
            {s}
          </Button>
        ))}
      </XStack>
      {errors.subject ? <Text fontSize={12} color={brand.red}>{errors.subject.message}</Text> : null}

      {subject === OTHER_SUBJECT && (
        <RHFTextField control={control} name="customSubject" label="Custom subject" placeholder="Type your subject…" error={errors.customSubject?.message} />
      )}

      <RHFTextField control={control} name="body" label="Details" placeholder="Tell us what happened…" multiline error={errors.body?.message} />

      <XStack gap={10} alignItems="center">
        <Button size="$3" backgroundColor="rgba(228,182,92,0.12)" borderColor={brand.gold} borderWidth={1} color={brand.gold} fontWeight="700" disabled={uploading} onPress={pickImage}
          icon={<MIcon name="camera-outline" size={16} color={brand.gold} />}>
          {uploading ? "Uploading…" : imageUrl ? "Change photo" : "Add a photo"}
        </Button>
        {imageUrl ? <Text fontSize={12} color={brand.green}>Photo attached ✓</Text> : null}
      </XStack>

      {errors.root ? <Text color={brand.red} fontSize={12}>{errors.root.message}</Text> : null}

      <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" disabled={creating || uploading} onPress={handleSubmit(onSubmit)}>
        {creating ? "Sending…" : "Send to support"}
      </Button>
    </YStack>
  );
}

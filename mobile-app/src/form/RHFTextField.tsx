import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { YStack, Text, Input } from "tamagui";
import { useColors } from "../theme";

interface RHFTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  secure?: boolean;
  multiline?: boolean;
  placeholder?: string;
  keyboard?: "default" | "email-address" | "number-pad" | "phone-pad";
}

/** A react-hook-form-bound text field with an inline error message. */
export function RHFTextField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  secure,
  multiline,
  placeholder,
  keyboard,
}: Readonly<RHFTextFieldProps<T>>) {
  const brand = useColors();
  return (
    <YStack gap={5}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secure}
            placeholder={placeholder}
            keyboardType={keyboard ?? "default"}
            autoCapitalize={keyboard === "email-address" || secure ? "none" : "sentences"}
            multiline={multiline}
            numberOfLines={multiline ? 3 : undefined}
            backgroundColor={brand.bgSoft}
            borderColor={error ? brand.red : brand.borderStrong}
            color={brand.text}
            placeholderTextColor={brand.faint}
          />
        )}
      />
      {error ? (
        <Text fontSize={12} color={brand.red}>
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}

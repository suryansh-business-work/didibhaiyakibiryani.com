import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client";
import { Stack, Typography } from "@mui/material";
import { CREATE_PARTY_ORDER } from "../../graphql/mutations";
import { FormActions, Modal } from "../../components/ui";
import { RHFField, partyOrderSchema, type PartyOrderForm } from "../../form";

const BLANK: PartyOrderForm = {
  name: "", phone: "", email: "", eventDate: "", guests: "", location: "", message: "",
};

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

/** Staff-entered party enquiry (no captcha / customer email — unlike the public form). */
export default function PartyOrderModal({ onClose, onCreated }: Readonly<Props>) {
  const [create] = useMutation(CREATE_PARTY_ORDER);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartyOrderForm>({ resolver: zodResolver(partyOrderSchema), defaultValues: BLANK });

  async function onSave(form: PartyOrderForm) {
    const input = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      eventDate: form.eventDate?.trim() || null,
      guests: form.guests === "" || form.guests === undefined ? null : Number(form.guests),
      location: form.location?.trim() || null,
      message: form.message?.trim() || null,
    };
    try {
      await create({ variables: { input } });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save the party order." });
    }
  }

  return (
    <Modal
      title="Add party order"
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={handleSubmit(onSave)} busy={isSubmitting} saveLabel="Create" />}
    >
      <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
      <Stack direction="row" spacing={1}>
        <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
        <RHFField control={control} name="email" label="Email" type="email" error={errors.email?.message} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <RHFField control={control} name="eventDate" label="Event date (optional)" hint="e.g. 12 Aug, evening" error={errors.eventDate?.message} />
        <RHFField control={control} name="guests" label="Guests (optional)" type="number" error={errors.guests?.message} />
      </Stack>
      <RHFField control={control} name="location" label="Location (optional)" error={errors.location?.message} />
      <RHFField control={control} name="message" label="Message / requirements (optional)" multiline error={errors.message?.message} />
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}

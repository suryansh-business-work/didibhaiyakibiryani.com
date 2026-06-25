import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client";
import { Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { format, isValid, parse } from "date-fns";
import { CREATE_PARTY_ORDER, UPDATE_PARTY_ORDER } from "../../graphql/mutations";
import { FormActions, Modal } from "../../components/ui";
import { RHFField, RHFSelect, partyOrderSchema, type PartyOrderForm } from "../../form";
import { STATE_OPTIONS } from "../../constants/india";

export interface PartyOrderRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  eventTime?: string;
  guests?: number;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  message?: string;
}

const BLANK: PartyOrderForm = {
  name: "", phone: "", email: "", eventDate: "", eventTime: "", guests: "",
  line1: "", city: "", state: "", pincode: "", message: "",
};

function toForm(p: PartyOrderRow): PartyOrderForm {
  return {
    name: p.name, phone: p.phone, email: p.email,
    eventDate: p.eventDate ?? "", eventTime: p.eventTime ?? "", guests: p.guests ?? "",
    line1: p.line1 ?? "", city: p.city ?? "", state: p.state ?? "", pincode: p.pincode ?? "", message: p.message ?? "",
  };
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editing?: PartyOrderRow;
}

/** Staff-entered / edited party enquiry (no captcha / customer email). */
export default function PartyOrderModal({ onClose, onSaved, editing }: Readonly<Props>) {
  const [create] = useMutation(CREATE_PARTY_ORDER);
  const [update] = useMutation(UPDATE_PARTY_ORDER);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartyOrderForm>({ resolver: zodResolver(partyOrderSchema), defaultValues: editing ? toForm(editing) : BLANK });

  async function onSave(form: PartyOrderForm) {
    const input = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      eventDate: form.eventDate || null,
      eventTime: form.eventTime || null,
      guests: form.guests === "" ? null : Number(form.guests),
      line1: form.line1.trim(),
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      pincode: form.pincode?.trim() || null,
      message: form.message?.trim() || null,
    };
    try {
      if (editing) await update({ variables: { id: editing.id, input } });
      else await create({ variables: { input } });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save the party order." });
    }
  }

  return (
    <Modal
      title={editing ? "Edit party order" : "Add party order"}
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={handleSubmit(onSave)} busy={isSubmitting} saveLabel={editing ? "Save" : "Create"} />}
    >
      <Stack spacing={2}>
        <RHFField control={control} name="name" label="Name" margin="none" error={errors.name?.message} />
        <Stack direction="row" spacing={2}>
          <RHFField control={control} name="phone" label="Phone" type="tel" margin="none" error={errors.phone?.message} />
          <RHFField control={control} name="email" label="Email" type="email" margin="none" error={errors.email?.message} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Controller
            control={control}
            name="eventDate"
            render={({ field }) => (
              <DatePicker
                label="Event date *"
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d && isValid(d) ? format(d, "yyyy-MM-dd") : "")}
                slotProps={{ textField: { size: "small", fullWidth: true, error: Boolean(errors.eventDate), helperText: errors.eventDate?.message } }}
              />
            )}
          />
          <Controller
            control={control}
            name="eventTime"
            render={({ field }) => (
              <TimePicker
                label="Event time *"
                value={field.value ? parse(field.value, "HH:mm", new Date()) : null}
                onChange={(d) => field.onChange(d && isValid(d) ? format(d, "HH:mm") : "")}
                slotProps={{ textField: { size: "small", fullWidth: true, error: Boolean(errors.eventTime), helperText: errors.eventTime?.message } }}
              />
            )}
          />
        </Stack>
        <RHFField control={control} name="guests" label="Guests" type="number" margin="none" error={errors.guests?.message} />
        <RHFField control={control} name="line1" label="Address line" margin="none" error={errors.line1?.message} />
        <Stack direction="row" spacing={2}>
          <RHFField control={control} name="city" label="City (optional)" margin="none" error={errors.city?.message} />
          <RHFField control={control} name="pincode" label="Pin code (optional)" margin="none" error={errors.pincode?.message} />
        </Stack>
        <RHFSelect control={control} name="state" label="State (optional)" options={STATE_OPTIONS} margin="none" error={errors.state?.message} />
        <RHFField control={control} name="message" label="Message / requirements (optional)" multiline margin="none" error={errors.message?.message} />
      </Stack>
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}

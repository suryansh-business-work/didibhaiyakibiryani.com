import type { Control, FieldErrors } from "react-hook-form";
import { Section } from "../checkout/fields";
import { RHFTextField, DateField, TimeField, type PartyForm } from "../form";

interface PartyFormBodyProps {
  control: Control<PartyForm>;
  errors: FieldErrors<PartyForm>;
  eventDate: string;
  eventTime: string;
  onEventDate: (v: string) => void;
  onEventTime: (v: string) => void;
}

/** All the input rows for the party-order enquiry, kept out of the screen file. */
export function PartyFormBody({
  control,
  errors,
  eventDate,
  eventTime,
  onEventDate,
  onEventTime,
}: Readonly<PartyFormBodyProps>) {
  return (
    <>
      <Section title="Your details">
        <RHFTextField control={control} name="name" label="Name *" error={errors.name?.message} />
        <RHFTextField control={control} name="phone" label="Phone *" keyboard="phone-pad" error={errors.phone?.message} />
        <RHFTextField control={control} name="email" label="Email *" keyboard="email-address" error={errors.email?.message} />
      </Section>

      <Section title="Party details">
        <DateField label="Event date *" value={eventDate} onChange={onEventDate} error={errors.eventDate?.message} />
        <TimeField label="Event time *" value={eventTime} onChange={onEventTime} error={errors.eventTime?.message} />
        <RHFTextField control={control} name="guests" label="Approx. guests *" keyboard="number-pad" error={errors.guests?.message} />
        <RHFTextField control={control} name="message" label="Anything else? (menu, budget, timing)" multiline error={errors.message?.message} />
      </Section>

      <Section title="Event address">
        <RHFTextField control={control} name="line1" label="Address line *" error={errors.line1?.message} />
        <RHFTextField control={control} name="city" label="City" error={errors.city?.message} />
        <RHFTextField control={control} name="state" label="State" error={errors.state?.message} />
        <RHFTextField control={control} name="pincode" label="Pin code" keyboard="number-pad" error={errors.pincode?.message} />
      </Section>
    </>
  );
}

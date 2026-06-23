import type { Control, FieldErrors } from "react-hook-form";
import { Typography } from "@mui/material";
import { Modal, FormActions } from "../../components/ui";
import { RHFField, RHFCheckbox, type RiderForm } from "../../form";

interface RiderModalProps {
  control: Control<RiderForm>;
  errors: FieldErrors<RiderForm>;
  editing: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function RiderModal({
  control,
  errors,
  editing,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<RiderModalProps>) {
  return (
    <Modal
      title={editing ? "Edit delivery partner" : "New delivery partner"}
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={onSubmit} busy={isSubmitting} saveLabel={editing ? "Save changes" : "Create rider"} />}
    >
      <RHFField control={control} name="name" label="Full name" error={errors.name?.message} />
      <RHFField
        control={control}
        name="email"
        label="Email (login id for the delivery app)"
        type="email"
        disabled={editing}
        hint={editing ? "Email is the rider's login id and can't be changed." : undefined}
        error={errors.email?.message}
      />
      <div className="field-row">
        <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
        <RHFField
          control={control}
          name="password"
          label={editing ? "New password (optional)" : "Password"}
          type="password"
          placeholder={editing ? "Leave blank to keep current" : ""}
          error={errors.password?.message}
        />
      </div>
      {editing && <RHFCheckbox control={control} name="isActive" label="Active (can sign in & receive deliveries)" />}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        The rider signs in at delivery.didibhaiyakibiryani.com with these credentials.
      </Typography>
      {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
    </Modal>
  );
}

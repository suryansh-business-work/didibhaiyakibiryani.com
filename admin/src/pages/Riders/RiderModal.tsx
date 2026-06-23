import type { Control, FieldErrors } from "react-hook-form";
import { Modal } from "../../components/ui";
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
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create rider"}
          </button>
        </>
      }
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
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        The rider signs in at delivery.didibhaiyakibiryani.com with these credentials.
      </p>
      {errors.root && <div className="error-text">{errors.root.message}</div>}
    </Modal>
  );
}

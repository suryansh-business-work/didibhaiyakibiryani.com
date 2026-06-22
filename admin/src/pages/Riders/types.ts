export interface RiderRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RiderForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
}

export const BLANK_RIDER: RiderForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns a user-facing problem with the form, or null when it's valid.
 * On edit the email is fixed and the password is optional (validated only when set).
 */
export function validateRiderForm(form: RiderForm, isEdit = false): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!isEdit && !EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
  if (!isEdit && form.password.length < 6) return "Password must be at least 6 characters.";
  if (isEdit && form.password && form.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

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
}

export const BLANK_RIDER: RiderForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a user-facing problem with the form, or null when it's valid. */
export function validateRiderForm(form: RiderForm): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
  if (form.password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

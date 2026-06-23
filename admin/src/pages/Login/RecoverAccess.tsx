import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLazyQuery, useMutation } from "@apollo/client";
import { CAPTCHA } from "../../graphql/queries";
import { EMAIL_ADMIN_CREDENTIALS } from "../../graphql/mutations";
import { RHFField, recoverSchema, type RecoverForm } from "../../form";

interface CaptchaData {
  captcha: { id: string; question: string };
}

/**
 * "Email me the admin password" — confirms the admin email + a server-issued
 * captcha, then the server rotates the password and emails the credentials.
 */
export default function RecoverAccess() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecoverForm>({ resolver: zodResolver(recoverSchema), defaultValues: { email: "", answer: "" } });

  const [loadCaptcha, { data, loading: captchaLoading }] = useLazyQuery<CaptchaData>(CAPTCHA, {
    fetchPolicy: "network-only",
  });
  const [send] = useMutation(EMAIL_ADMIN_CREDENTIALS);

  async function start() {
    setOpen(true);
    setMessage("");
    reset({ email: "", answer: "" });
    await loadCaptcha();
  }

  async function onSubmit(form: RecoverForm) {
    setMessage("");
    if (!data?.captcha) {
      setError("answer", { message: "Captcha unavailable — refresh it." });
      return;
    }
    try {
      await send({
        variables: { email: form.email.trim(), captchaId: data.captcha.id, captchaAnswer: form.answer.trim() },
      });
      setMessage("If that address belongs to the admin, a fresh password has been emailed to it.");
      reset({ email: form.email, answer: "" });
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not send — try again." });
      await loadCaptcha();
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={start}>
        Forgot password? Email admin credentials
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 14 }}>
      <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 10 }}>
        Confirm the admin email and solve the captcha — a new password will be sent to the admin inbox.
      </p>
      <RHFField control={control} name="email" label="Admin email" type="email" autoComplete="email" error={errors.email?.message} />
      <div className="field">
        <label>
          Captcha: {captchaLoading ? "…" : data?.captcha?.question ?? "…"}{" "}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => loadCaptcha()} aria-label="New captcha">
            ↻
          </button>
        </label>
      </div>
      <RHFField control={control} name="answer" label="Your answer" error={errors.answer?.message} />
      {errors.root && <div className="error-text">{errors.root.message}</div>}
      {message && <p style={{ color: "var(--green)", fontSize: "0.85rem", fontWeight: 700 }}>{message}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Close
        </button>
        <button type="button" className="btn btn-gold btn-sm" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isSubmitting ? "Sending…" : "Send credentials to admin mail"}
        </button>
      </div>
    </div>
  );
}

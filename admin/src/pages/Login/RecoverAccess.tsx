import { useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { CAPTCHA } from "../../graphql/queries";
import { EMAIL_ADMIN_CREDENTIALS } from "../../graphql/mutations";

interface CaptchaData {
  captcha: { id: string; question: string };
}

/**
 * "Email me the admin password" — confirms the admin email + a server-issued
 * captcha, then the server rotates the password and emails the credentials.
 * Nothing secret is ever displayed in the UI.
 */
export default function RecoverAccess() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loadCaptcha, { data, loading: captchaLoading }] = useLazyQuery<CaptchaData>(CAPTCHA, {
    fetchPolicy: "network-only",
  });
  const [send, { loading: sending }] = useMutation(EMAIL_ADMIN_CREDENTIALS);

  async function start() {
    setOpen(true);
    setMessage("");
    setError("");
    setAnswer("");
    await loadCaptcha();
  }

  async function submit() {
    setError("");
    setMessage("");
    if (!email.trim() || !answer.trim() || !data?.captcha) {
      setError("Enter the admin email and solve the captcha.");
      return;
    }
    try {
      await send({
        variables: { email: email.trim(), captchaId: data.captcha.id, captchaAnswer: answer.trim() },
      });
      setMessage(
        "If that address belongs to the admin, a fresh password has been emailed to it."
      );
      setAnswer("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send — try again.");
      await loadCaptcha();
      setAnswer("");
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
        Confirm the admin email and solve the captcha — a new password will be sent to the
        admin inbox.
      </p>
      <div className="field">
        <label>Admin email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label>
          Captcha: {captchaLoading ? "…" : data?.captcha?.question ?? "…"}{" "}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => loadCaptcha()}
            aria-label="New captcha"
          >
            ↻
          </button>
        </label>
        <input
          value={answer}
          inputMode="numeric"
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
        />
      </div>
      {error && <div className="error-text">{error}</div>}
      {message && (
        <p style={{ color: "var(--green)", fontSize: "0.85rem", fontWeight: 700 }}>{message}</p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Close
        </button>
        <button type="button" className="btn btn-gold btn-sm" disabled={sending} onClick={submit}>
          {sending ? "Sending…" : "Send credentials to admin mail"}
        </button>
      </div>
    </div>
  );
}

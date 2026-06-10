import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand__badge" />
          <div>
            <div className="brand__name">Didi Bhaiya</div>
            <div className="brand__sub">Delivery Partner</div>
          </div>
        </div>
        <h2>Rider sign in</h2>
        <p className="sub">Your assigned orders are waiting.</p>
        <div className="field">
          <label>Email or phone</label>
          <input
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-gold" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="login-hint">
          No account? Ask the admin to add you under Riders in the admin panel.
        </p>
      </form>
    </div>
  );
}

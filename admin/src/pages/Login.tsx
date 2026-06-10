import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@didibhaiyakibiryani.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed.");
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
            <div className="brand__name">Didi Bhaiya ki Biryani</div>
            <div className="brand__sub">Admin Console</div>
          </div>
        </div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to manage orders, menu &amp; offers.</p>

        <div className="field">
          <label>Email or phone</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@didibhaiyakibiryani.com"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {err && <div className="error-text">{err}</div>}

        <button className="btn btn-gold" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="login-hint">
          Seeded admin: <b>admin@didibhaiyakibiryani.com</b> / <b>Admin@123</b>
          <br />
          (run <code>npm run seed</code> in the server first)
        </p>
      </form>
    </div>
  );
}

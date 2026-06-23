import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../auth";
import BrandLogo from "../../components/BrandLogo";
import RecoverAccess from "./RecoverAccess";
import { RHFField, adminLoginSchema, type AdminLoginForm } from "../../form";

export default function Login() {
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: AdminLoginForm) {
    try {
      await login(data.email, data.password);
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Login failed." });
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
        <div className="brand">
          <BrandLogo size={44} />
          <div>
            <div className="brand__name">Didi Bhaiya ki Biryani</div>
            <div className="brand__sub">Admin Console</div>
          </div>
        </div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to manage orders, menu &amp; offers.</p>

        <RHFField control={control} name="email" label="Email or phone" placeholder="you@didibhaiyakibiryani.com" autoComplete="username" error={errors.email?.message} />
        <RHFField control={control} name="password" label="Password" type="password" placeholder="••••••••" autoComplete="current-password" error={errors.password?.message} />

        {errors.root && <div className="error-text">{errors.root.message}</div>}

        <button className="btn btn-gold" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <RecoverAccess />
      </form>
    </div>
  );
}

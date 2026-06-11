import { useQuery } from "@apollo/client";
import Shell from "../components/Shell";
import { Spinner } from "../components/ui";
import { SETTINGS_LITE } from "../graphql";

interface SettingsData {
  settings: {
    brandName: string;
    supportPhone: string;
    supportEmail: string;
  };
}

export default function Support() {
  const { data, loading } = useQuery<SettingsData>(SETTINGS_LITE);
  const settings = data?.settings;

  if (loading) {
    return (
      <Shell title="Support">
        <Spinner label="Loading…" />
      </Shell>
    );
  }

  return (
    <Shell title="Support">
      <div className="card" style={{ maxWidth: 500, margin: "40px auto" }}>
        <h2>Need help?</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Contact {settings?.brandName || "our"} support team for any issues or questions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {settings?.supportPhone && (
            <a
              href={`tel:${settings.supportPhone}`}
              className="btn btn-gold"
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              📞 Call support
            </a>
          )}

          {settings?.supportEmail && (
            <a
              href={`mailto:${settings.supportEmail}`}
              className="btn btn-ghost"
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              📧 Email support
            </a>
          )}

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>FAQ</summary>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>How do I accept an order?</h4>
                <p className="muted">Orders appear in your "My queue" tab. Click the green button to confirm pickup and start delivery.</p>
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>How is my earnings calculated?</h4>
                <p className="muted">You earn a delivery fee per order. Visit the "Earnings" tab to see your earnings history.</p>
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>Can I cancel an accepted order?</h4>
                <p className="muted">Contact support immediately if you need to cancel. Cancellations may affect your ratings.</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </Shell>
  );
}

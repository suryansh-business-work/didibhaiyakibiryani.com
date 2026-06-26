import { useQuery } from "@apollo/client";
import { SETTINGS_LOGO } from "../graphql";
import brandLogo from "../assets/brand-logo.png";
import "./DeliveryTruck.css";

/**
 * On-brand pure-CSS delivery-truck banner shown on the live tracking page.
 * The van carries the Didi Bhaiya ki Biryani logo (admin-configured, falling
 * back to the bundled brand logo). Decorative only, so it's hidden from
 * assistive tech.
 */
export default function DeliveryTruck() {
  const { data } = useQuery<{ settings?: { logoUrl?: string | null } }>(SETTINGS_LOGO);
  const logoSrc = data?.settings?.logoUrl?.trim() || brandLogo;

  return (
    <div className="ddb-truck" aria-hidden="true">
      <div className="container">
        <div className="car-wrapper">
          <div className="car-wrapper_inner">
            <div className="car_outter">
              <div className="car">
                <div className="body">
                  <div />
                </div>
                <div className="decos">
                  <div className="line-bot" />
                  <div className="door">
                    <div className="handle" />
                    <div className="bottom" />
                  </div>
                  <div className="window" />
                  <div className="light" />
                  <div className="light-front" />
                  <div className="antenna" />
                </div>
                <div>
                  <div className="wheel" />
                  <div className="wheel" />
                </div>
                <div className="wind">
                  <div className="p p1" />
                  <div className="p p2" />
                  <div className="p p3" />
                  <div className="p p4" />
                  <div className="p p5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="background-stuff">
          <div className="bg" />
          <div className="bg bg-2" />
          <div className="bg bg-3" />
          <div className="ground" />
        </div>
      </div>
    </div>
  );
}

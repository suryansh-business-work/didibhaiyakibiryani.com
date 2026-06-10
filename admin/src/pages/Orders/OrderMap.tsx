import { Modal } from "../../components/ui";
import { orderMapEmbedUrl, type Order } from "./types";

interface OrderMapProps {
  order: Order;
  onClose: () => void;
}

/** Google Map of where the order came from (customer's drop location). */
export default function OrderMap({ order, onClose }: Readonly<OrderMapProps>) {
  const a = order.address;
  return (
    <Modal title={`Order ${order.orderNumber} — location`} onClose={onClose}>
      <p className="muted" style={{ marginBottom: 12 }}>
        {a.line1}
        {a.line2 ? `, ${a.line2}` : ""} · {a.city} — {a.pincode}
      </p>
      <iframe
        className="map-frame"
        title={`Map for order ${order.orderNumber}`}
        src={orderMapEmbedUrl(a)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div style={{ marginTop: 12 }}>
        <a
          className="btn btn-ghost btn-sm"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            a.lat && a.lng ? `${a.lat},${a.lng}` : `${a.line1}, ${a.city} ${a.pincode}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps ↗
        </a>
      </div>
    </Modal>
  );
}

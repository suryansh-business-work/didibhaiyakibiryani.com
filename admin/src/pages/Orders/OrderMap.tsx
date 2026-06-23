import { useEffect, useState } from "react";
import { Modal, Spinner } from "../../components/ui";
import {
  addressText,
  geocodeAddress,
  googleMapsLink,
  osmEmbedUrl,
  type LatLng,
  type Order,
} from "./types";

interface OrderMapProps {
  order: Order;
  onClose: () => void;
}

/** OpenStreetMap view of where the order should be delivered (drop location). */
export default function OrderMap({ order, onClose }: Readonly<OrderMapProps>) {
  const a = order.address ?? null;
  const [coords, setCoords] = useState<LatLng | null>(
    a?.lat && a?.lng ? { lat: a.lat, lng: a.lng } : null
  );
  const [loading, setLoading] = useState(Boolean(a) && !coords);

  useEffect(() => {
    if (coords || !a) return;
    let cancelled = false;
    geocodeAddress(a)
      .then((c) => {
        if (!cancelled) setCoords(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [a, coords]);

  return (
    <Modal title={`Order ${order.orderNumber} — location`} onClose={onClose}>
      {a ? (
        <>
          <p className="muted" style={{ marginBottom: 12 }}>
            {addressText(a)}
          </p>

          {loading && <Spinner />}

          {!loading && coords && (
            <iframe
              className="map-frame"
              title={`Map for order ${order.orderNumber}`}
              src={osmEmbedUrl(coords)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}

          {!loading && !coords && (
            <p className="muted">
              Couldn’t pin this address on the map — open it in Google Maps below.
            </p>
          )}

          <div style={{ marginTop: 12 }}>
            <a className="btn btn-ghost btn-sm" href={googleMapsLink(a)} target="_blank" rel="noreferrer">
              Open in Google Maps ↗
            </a>
          </div>
        </>
      ) : (
        <p className="muted">This is a takeaway / counter order — no delivery location.</p>
      )}
    </Modal>
  );
}

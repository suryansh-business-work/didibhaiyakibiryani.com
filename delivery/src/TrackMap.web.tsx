import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { brand } from "./theme";
import type { QueueOrder } from "./types";

// Leaflet's default marker icons break under bundlers because the CSS-relative
// image URLs are lost; re-point them at the bundled asset URLs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Brand-gold rider marker (distinct from the blue destination pins).
const riderIcon = L.divIcon({
  className: "ddb-rider-marker",
  html: `<div style="font-size:26px;line-height:26px">🛵</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

type LatLng = { lat: number; lng: number };
const DEFAULT_CENTER: LatLng = { lat: 26.85, lng: 80.95 };

function hasCoords(o: QueueOrder): boolean {
  return typeof o.address.lat === "number" && typeof o.address.lng === "number";
}

function destinations(orders: ReadonlyArray<QueueOrder>): Array<{ order: QueueOrder; coord: LatLng }> {
  return orders.filter(hasCoords).map((order) => ({
    order,
    coord: { lat: order.address.lat as number, lng: order.address.lng as number },
  }));
}

function pickCenter(rider: LatLng | null, dests: ReadonlyArray<{ coord: LatLng }>): LatLng {
  if (rider) {
    return rider;
  }
  return dests[0]?.coord ?? DEFAULT_CENTER;
}

// Pans the map to the rider as their position updates. Hoisted (not nested).
function Recenter({ center }: Readonly<{ center: LatLng | null }>) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.panTo([center.lat, center.lng]);
    }
  }, [center, map]);
  return null;
}

function useRiderPosition(): LatLng | null {
  const [rider, setRider] = useState<LatLng | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => setRider({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return rider;
}

export default function TrackMap({ orders }: Readonly<{ orders: ReadonlyArray<QueueOrder> }>) {
  const dests = destinations(orders);
  const rider = useRiderPosition();
  const center = pickCenter(rider, dests);

  return (
    <div style={{ flex: 1, minHeight: 0, height: "100%", backgroundColor: brand.bg }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />
        <Recenter center={rider} />
        {dests.map(({ order, coord }) => (
          <Marker key={order.id} position={[coord.lat, coord.lng]}>
            <Popup>
              {order.orderNumber} · {order.address.line1}, {order.address.city}
            </Popup>
          </Marker>
        ))}
        {rider ? (
          <Marker position={[rider.lat, rider.lng]} icon={riderIcon}>
            <Popup>You</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}

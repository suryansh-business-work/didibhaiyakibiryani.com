import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Box } from "@mui/material";
import type { LatLng } from "../graphql";

// Explicit icon so the destination pin always renders under Vite.
const destinationIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// A distinct rider marker rendered as a scooter emoji via a divIcon.
const riderIcon = L.divIcon({
  className: "ddb-rider-marker",
  html: '<div style="font-size:28px;line-height:1">\u{1F6F5}</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  destination: LatLng | null;
  rider: LatLng | null;
}

/** Keeps the view tracking the delivery partner as they move (and the drop point
 * in frame when we know it), re-running whenever the rider's position updates. */
function Follow({ destination, rider }: Readonly<Props>) {
  const map = useMap();
  useEffect(() => {
    if (rider && destination) {
      map.fitBounds(
        L.latLngBounds([
          [rider.lat, rider.lng],
          [destination.lat, destination.lng],
        ]),
        { padding: [50, 50], maxZoom: 16 }
      );
    } else if (rider) {
      map.setView([rider.lat, rider.lng], 16);
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 15);
    }
  }, [map, destination, rider]);
  return null;
}

export default function TrackMap({ destination, rider }: Readonly<Props>) {
  const center = rider ?? destination;
  if (!center) return null;
  return (
    <Box sx={{ height: 300, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {destination ? <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} /> : null}
        {rider ? <Marker position={[rider.lat, rider.lng]} icon={riderIcon} /> : null}
        <Follow destination={destination} rider={rider} />
      </MapContainer>
    </Box>
  );
}

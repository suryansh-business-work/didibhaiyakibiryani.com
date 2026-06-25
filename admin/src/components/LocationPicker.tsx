import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Box, Button, Stack, Typography } from "@mui/material";

// Vite serves the marker images as URLs. We build an explicit icon (rather than
// only patching L.Icon.Default) so the pin always renders instead of a broken image.
const pinIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

// Fallback view (centre of India) used when a contact has no saved pin yet.
const INDIA_CENTER: LatLng = { lat: 22.9734, lng: 78.6569 };

function ClickToPlace({ onChange }: Readonly<{ onChange: (next: LatLng) => void }>) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function Recenter({ value }: Readonly<{ value: LatLng | null }>) {
  const map = useMap();
  useEffect(() => {
    if (value) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, value]);
  return null;
}

interface Props {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  onClear?: () => void;
  height?: number;
  label?: string;
}

/**
 * A Leaflet (OpenStreetMap) location picker: click the map or drag the pin to
 * set a precise lat/lng. Keyless — matches the app's existing OSM approach.
 */
export default function LocationPicker({ value, onChange, onClear, height = 260, label = "Pin location on map" }: Readonly<Props>) {
  const center = value ?? INDIA_CENTER;
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        {value && onClear ? (
          <Button size="small" color="inherit" onClick={onClear}>Clear pin</Button>
        ) : null}
      </Stack>
      <Box sx={{ height, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <MapContainer center={[center.lat, center.lng]} zoom={value ? 15 : 5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onChange={onChange} />
          <Recenter value={value} />
          {value ? (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onChange({ lat, lng });
                },
              }}
            />
          ) : null}
        </MapContainer>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {value ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Tap the map to drop a pin (optional)."}
      </Typography>
    </Box>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { YStack, Text } from "tamagui";
import {
  LeafletView,
  MapLayerType,
  type LatLng,
  type MapLayer,
  type MapMarker,
} from "react-native-leaflet-view";
import { brand } from "./theme";
import type { QueueOrder } from "./types";

// Keyless OpenStreetMap raster tiles — no Google, no API key.
const OSM_LAYER: MapLayer = {
  baseLayer: true,
  baseLayerIsChecked: true,
  baseLayerName: "OpenStreetMap",
  layerType: MapLayerType.TILE_LAYER,
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '© OpenStreetMap contributors',
};

// Sensible India default centre, used until we have coords to centre on.
const DEFAULT_CENTER: LatLng = { lat: 26.85, lng: 80.95 };
const RIDER_MARKER_ID = "rider";

function hasCoords(o: QueueOrder): boolean {
  return typeof o.address.lat === "number" && typeof o.address.lng === "number";
}

function destinationMarkers(orders: ReadonlyArray<QueueOrder>): MapMarker[] {
  return orders.filter(hasCoords).map((order) => ({
    id: order.id,
    position: { lat: order.address.lat as number, lng: order.address.lng as number },
    icon: "📍",
    size: [28, 28],
    title: `${order.orderNumber} · ${order.address.line1}`,
  }));
}

function pickCenter(rider: LatLng | null, dests: ReadonlyArray<MapMarker>): LatLng {
  if (rider) {
    return rider;
  }
  return dests[0]?.position ?? DEFAULT_CENTER;
}

type OnLocation = (lat: number, lng: number) => void;

export default function TrackMap({ orders, onLocation }: Readonly<{ orders: ReadonlyArray<QueueOrder>; onLocation?: OnLocation }>) {
  const [rider, setRider] = useState<LatLng | null>(null);
  const [denied, setDenied] = useState(false);
  // Latest callback in a ref so the location watcher is set up only once.
  const cbRef = useRef(onLocation);
  cbRef.current = onLocation;

  useEffect(() => {
    let watcher: Location.LocationSubscription | undefined;
    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (active) {
          setDenied(true);
        }
        return;
      }
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 15 },
        (loc) => {
          if (active) {
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            setRider({ lat, lng });
            cbRef.current?.(lat, lng);
          }
        },
      );
      // The component may have unmounted while we awaited the watcher — if so,
      // remove the just-created subscription immediately to avoid a leak.
      if (active) watcher = sub;
      else sub.remove();
    })().catch(() => {
      if (active) {
        setDenied(true);
      }
    });
    return () => {
      active = false;
      watcher?.remove();
    };
  }, []);

  const dests = useMemo(() => destinationMarkers(orders), [orders]);
  const markers = useMemo<MapMarker[]>(() => {
    if (!rider) {
      return dests;
    }
    const riderMarker: MapMarker = {
      id: RIDER_MARKER_ID,
      position: rider,
      icon: "🛵",
      size: [34, 34],
      title: "You",
    };
    return [riderMarker, ...dests];
  }, [rider, dests]);

  return (
    <YStack flex={1}>
      <LeafletView
        mapLayers={[OSM_LAYER]}
        mapMarkers={markers}
        mapCenterPosition={pickCenter(rider, dests)}
        zoom={13}
        onMessageReceived={() => undefined}
      />
      {denied ? (
        <YStack
          position="absolute"
          bottom={16}
          left={16}
          right={16}
          backgroundColor={brand.card}
          borderColor={brand.border}
          borderWidth={1}
          borderRadius={12}
          padding={12}
        >
          <Text color={brand.text} fontWeight="700">Location permission needed</Text>
          <Text color={brand.muted} fontSize={13}>
            Enable location access to see your live position on the map.
          </Text>
        </YStack>
      ) : null}
    </YStack>
  );
}

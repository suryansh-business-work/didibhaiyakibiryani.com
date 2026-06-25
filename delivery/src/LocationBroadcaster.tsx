import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useMutation } from "@apollo/client";
import { UPDATE_RIDER_LOCATION } from "./graphql";

const PUSH_MS = 20000;

/**
 * Broadcasts the signed-in rider's GPS to the server (throttled) from ANY tab,
 * so the customer's public tracking page follows the rider wherever they go.
 * The server only surfaces this location on orders that are out for delivery.
 */
export default function LocationBroadcaster() {
  const [push] = useMutation(UPDATE_RIDER_LOCATION);
  const lastSent = useRef(0);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 25, timeInterval: PUSH_MS },
        (loc) => {
          const now = Date.now();
          if (now - lastSent.current < PUSH_MS) return;
          lastSent.current = now;
          push({ variables: { lat: loc.coords.latitude, lng: loc.coords.longitude } }).catch(() => undefined);
        },
      );
      // The screen may have unmounted while we awaited the watcher.
      if (active) sub = s;
      else s.remove();
    })().catch(() => undefined);
    return () => {
      active = false;
      sub?.remove();
    };
  }, [push]);

  return null;
}

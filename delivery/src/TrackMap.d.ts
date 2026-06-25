import type { QueueOrder } from "./types";

// Type surface shared by TrackMap.native.tsx and TrackMap.web.tsx. Metro resolves
// the platform file at runtime; this lets `import "../../src/TrackMap"` typecheck.
export default function TrackMap(
  props: Readonly<{ orders: ReadonlyArray<QueueOrder>; onLocation?: (lat: number, lng: number) => void }>
): JSX.Element;

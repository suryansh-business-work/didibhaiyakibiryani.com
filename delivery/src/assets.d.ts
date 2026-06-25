// Ambient declaration so static image imports (e.g. Leaflet's bundled marker
// icons used by TrackMap.web.tsx) typecheck under `tsc`. Metro/Vite resolve
// these to an asset URL string at bundle time.
declare module "*.png" {
  const src: string;
  export default src;
}

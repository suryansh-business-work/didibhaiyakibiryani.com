/**
 * Static front-of-house configuration for the customer app.
 * HERO_STATS are presentational marketing figures; wire them to a server
 * aggregate once the API exposes one (kept here as reusable config, not inline).
 */
export const HERO_STATS: ReadonlyArray<{ id: string; big: string; small: string }> = [
  { id: "rating", big: "4.8★", small: "12.4k ratings" },
  { id: "delivery", big: "35 min", small: "avg delivery" },
  { id: "veg", big: "100%", small: "pure-veg" },
];

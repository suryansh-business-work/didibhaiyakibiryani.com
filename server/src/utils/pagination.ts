import type { Model, FilterQuery, PopulateOptions } from "mongoose";

export type SortDir = "ASC" | "DESC";

/** Common admin list arguments: free-text search, sort, and a page window. */
export interface PageArgs {
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
  limit?: number;
  offset?: number;
}

/** A single page of results plus the unpaginated total (for page counts). */
export interface Page<T> {
  items: T[];
  total: number;
}

interface Opts<T> {
  filter?: FilterQuery<T>;
  search?: string;
  searchFields?: string[]; // regex-OR'd, case-insensitive
  sortBy?: string;
  sortDir?: SortDir;
  sortAllow?: string[]; // whitelist; falls back to defaultSort
  defaultSort?: string; // default "createdAt"
  limit?: number; // default 20, clamp 1..200
  offset?: number; // default 0
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

/** Clamp the page size to [1, MAX_LIMIT], defaulting when not a positive number. */
function clampLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

/** Floor a non-negative offset, defaulting to 0. */
function clampOffset(offset?: number): number {
  if (typeof offset !== "number" || !Number.isFinite(offset) || offset < 0) return 0;
  return Math.floor(offset);
}

/** Build the Mongo filter, OR-ing a case-insensitive regex over each search field. */
function buildFilter<T>(opts: Opts<T>): FilterQuery<T> {
  const filter: Record<string, unknown> = { ...opts.filter };
  const term = opts.search?.trim();
  if (term && opts.searchFields?.length) {
    filter.$or = opts.searchFields.map((field) => ({ [field]: { $regex: term, $options: "i" } }));
  }
  return filter as FilterQuery<T>;
}

/** Pick a whitelisted sort field (falling back to defaultSort) with a numeric direction. */
function buildSort<T>(opts: Opts<T>): Record<string, 1 | -1> {
  const fallback = opts.defaultSort ?? "createdAt";
  const allowed = opts.sortBy && opts.sortAllow?.includes(opts.sortBy);
  const field = allowed ? opts.sortBy! : fallback;
  const dir: 1 | -1 = opts.sortDir === "ASC" ? 1 : -1;
  return { [field]: dir };
}

/**
 * Reusable server-side pagination: applies an optional regex search and a
 * whitelisted sort, then returns the requested window alongside the full count.
 */
export async function paginate<T>(model: Model<T>, opts: Opts<T>): Promise<Page<T>> {
  const filter = buildFilter(opts);
  const sort = buildSort(opts);
  const limit = clampLimit(opts.limit);
  const offset = clampOffset(opts.offset);

  let query = model.find(filter).sort(sort).skip(offset).limit(limit);
  if (opts.populate) {
    // Normalise to the array overload so a string, options object, or list all fit.
    const paths = Array.isArray(opts.populate) ? opts.populate : [opts.populate];
    query = query.populate(paths);
  }

  const [items, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

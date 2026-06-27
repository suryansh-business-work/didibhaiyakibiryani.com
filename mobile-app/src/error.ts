import { ApolloError } from "@apollo/client";

const NETWORK_FALLBACK = "Can't reach the server. Check your internet and try again.";
const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/**
 * Turn any thrown value (Apollo query/mutation error, plain Error, string) into
 * a single, human-friendly line for the UI. Prefers the server's own GraphQL
 * message; falls back to a connection message for pure network failures.
 */
export function errorMessage(e: unknown, fallback: string = GENERIC_FALLBACK): string {
  if (e instanceof ApolloError) {
    const gql = e.graphQLErrors?.[0]?.message;
    if (gql) {
      return gql;
    }
    if (e.networkError) {
      return NETWORK_FALLBACK;
    }
    return e.message || fallback;
  }
  if (e instanceof Error) {
    return e.message || fallback;
  }
  if (typeof e === "string" && e.trim()) {
    return e;
  }
  return fallback;
}

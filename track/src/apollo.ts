import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// Public tracking app — no auth header is ever sent.
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL || "http://localhost:3001/graphql",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});

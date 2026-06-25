import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename";

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL || "http://localhost:3001/graphql",
});

// Strip the `__typename` Apollo adds to query results so any fetched object
// echoed back into a mutation input doesn't fail server-side validation.
const removeTypename = removeTypenameFromVariables();

export const client = new ApolloClient({
  link: from([removeTypename, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});

import { GraphQLScalarType, Kind } from "graphql";

export const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string" || typeof value === "number")
      return new Date(value).toISOString();
    return null;
  },
  parseValue(value) {
    return typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  },
});

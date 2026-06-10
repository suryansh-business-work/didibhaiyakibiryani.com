import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import type { Role } from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

export interface TokenPayload {
  id: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Auth context shape attached to every resolver. */
export interface Context {
  user: TokenPayload | null;
}

export function getUserFromAuthHeader(header?: string): TokenPayload | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return verifyToken(token);
}

/** Throws if not authenticated. Returns the user payload. */
export function requireAuth(ctx: Context): TokenPayload {
  if (!ctx.user) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }
  return ctx.user;
}

/** Throws if the user does not have one of the allowed roles. */
export function requireRole(ctx: Context, ...roles: Role[]): TokenPayload {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) {
    throw new GraphQLError("You do not have permission to do that.", {
      extensions: { code: "FORBIDDEN", http: { status: 403 } },
    });
  }
  return user;
}

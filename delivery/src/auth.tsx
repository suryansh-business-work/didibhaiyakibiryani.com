import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApolloClient } from "@apollo/client";
import { TOKEN_KEY } from "./apollo";
import { ME, LOGIN } from "./graphql";
import type { RiderUser } from "./types";

/** Roles allowed into the rider app (admins may sign in to supervise). */
const ALLOWED_ROLES = new Set(["DELIVERY", "ADMIN"]);

interface AuthCtx {
  user: RiderUser | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const apollo = useApolloClient();
  const [user, setUser] = useState<RiderUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await apollo.query({ query: ME, fetchPolicy: "network-only" });
      if (data?.me && ALLOWED_ROLES.has(data.me.role)) {
        setUser(data.me);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(emailOrPhone: string, password: string) {
    const { data } = await apollo.mutate({ mutation: LOGIN, variables: { emailOrPhone, password } });
    const payload = data?.login;
    if (!payload) throw new Error("Login failed.");
    if (!ALLOWED_ROLES.has(payload.user.role)) {
      throw new Error("This account is not a delivery partner.");
    }
    await AsyncStorage.setItem(TOKEN_KEY, payload.token);
    await load();
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    await apollo.clearStore();
  }

  return <Ctx.Provider value={{ user, loading, login, logout, refresh: load }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

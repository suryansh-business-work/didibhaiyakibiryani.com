import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useApolloClient, useMutation, useLazyQuery } from "@apollo/client";
import { getToken, setToken, clearToken } from "./apollo";
import { LOGIN } from "./graphql/mutations";
import { ME } from "./graphql/queries";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "DELIVERY" | "CUSTOMER";
}

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const apollo = useApolloClient();
  const [loginMutation] = useMutation(LOGIN);
  const [fetchMe] = useLazyQuery(ME, { fetchPolicy: "network-only" });

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await fetchMe();
        if (data?.me && ["ADMIN", "STAFF", "DELIVERY"].includes(data.me.role)) {
          setUser(data.me);
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(emailOrPhone: string, password: string) {
    const { data } = await loginMutation({ variables: { emailOrPhone, password } });
    const payload = data?.login;
    if (!payload) throw new Error("Login failed.");
    if (!["ADMIN", "STAFF", "DELIVERY"].includes(payload.user.role)) {
      throw new Error("This account doesn't have staff access.");
    }
    setToken(payload.token);
    setUser(payload.user);
  }

  function logout() {
    clearToken();
    setUser(null);
    apollo.clearStore();
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

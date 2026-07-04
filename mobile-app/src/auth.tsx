import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApolloClient } from "@apollo/client";
import { TOKEN_KEY } from "./apollo";
import { ME, LOGIN, REGISTER, REQUEST_SIGNUP_OTP } from "./graphql";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dob?: string;
  anniversary?: string;
  addresses?: Address[];
}
export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  requestSignupOtp: (name: string, email: string) => Promise<void>;
  register: (name: string, email: string, password: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const apollo = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
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
      setUser(data?.me ?? null);
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
    const { data } = await apollo.mutate({
      mutation: LOGIN,
      variables: { emailOrPhone, password },
    });
    await AsyncStorage.setItem(TOKEN_KEY, data.login.token);
    await load();
  }

  async function requestSignupOtp(name: string, email: string) {
    await apollo.mutate({
      mutation: REQUEST_SIGNUP_OTP,
      variables: { name, email },
    });
  }

  async function register(name: string, email: string, password: string, otp: string) {
    const { data } = await apollo.mutate({
      mutation: REGISTER,
      variables: { input: { name, email, password, otp } },
    });
    await AsyncStorage.setItem(TOKEN_KEY, data.register.token);
    await load();
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    await apollo.clearStore();
  }

  return (
    <Ctx.Provider value={{ user, loading, login, requestSignupOtp, register, logout, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

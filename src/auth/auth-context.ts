import { createContext } from "react";

export type Member = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  phone: string | null;
};

export type AuthActionResult =
  { ok: true; needsEmailConfirmation?: boolean } | { ok: false; message: string };

export type SignUpInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

export type AuthContextValue = {
  member: Member | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (input: SignUpInput) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

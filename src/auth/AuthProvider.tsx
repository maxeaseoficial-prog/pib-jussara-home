"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue, type Member } from "@/auth/auth-context";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { firstNameFrom, normalizeFullName, toCanonicalBrazilianPhone } from "@/auth/member-auth";

type MemberProfile = {
  full_name: string;
  phone: string;
};

function fallbackProfile(user: User): MemberProfile {
  const metadataName =
    typeof user.user_metadata["full_name"] === "string"
      ? normalizeFullName(user.user_metadata["full_name"])
      : "";
  const fallbackName = metadataName || user.email?.split("@")[0] || "Membro";
  const metadataPhone =
    typeof user.user_metadata["phone"] === "string" ? user.user_metadata["phone"] : "";

  return { full_name: fallbackName, phone: metadataPhone };
}

async function loadProfile(user: User, client: SupabaseClient): Promise<MemberProfile> {
  const { data, error } = await client
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle<MemberProfile>();

  if (error || !data) return fallbackProfile(user);
  return data;
}

async function getAvailableSupabase() {
  try {
    return await getSupabase();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void getSupabase()
      .then(async (client) => {
        if (!active || !client) return;

        const syncSession = async (nextSession: Session | null) => {
          if (!active) return;
          setSession(nextSession);

          if (!nextSession?.user) {
            setProfile(null);
            return;
          }

          const nextProfile = await loadProfile(nextSession.user, client);
          if (active) setProfile(nextProfile);
        };

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, nextSession) => {
          void Promise.resolve().then(() => syncSession(nextSession));
        });
        unsubscribe = () => subscription.unsubscribe();

        const { data } = await client.auth.getSession();
        await syncSession(data.session);
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setProfile(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const member = useMemo<Member | null>(() => {
    if (!session?.user) return null;

    const resolvedProfile = profile ?? fallbackProfile(session.user);
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      fullName: resolvedProfile.full_name,
      firstName: firstNameFrom(resolvedProfile.full_name),
      phone: resolvedProfile.phone || null,
    };
  }, [profile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      member,
      isLoading,
      isConfigured: isSupabaseConfigured,
      async signIn(email, password) {
        const client = await getAvailableSupabase();
        if (!client) {
          return {
            ok: false,
            message: "Área de membros temporariamente indisponível. Tente novamente mais tarde.",
          };
        }

        try {
          const { error } = await client.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          return error ? { ok: false, message: "E-mail ou senha inválidos." } : { ok: true };
        } catch {
          return { ok: false, message: "E-mail ou senha inválidos." };
        }
      },
      async signUp(input) {
        const client = await getAvailableSupabase();
        if (!client) {
          return {
            ok: false,
            message: "Área de membros temporariamente indisponível. Tente novamente mais tarde.",
          };
        }

        const phone = toCanonicalBrazilianPhone(input.phone);
        if (!phone) {
          return { ok: false, message: "Informe um telefone válido com DDD." };
        }

        try {
          const { data, error } = await client.auth.signUp({
            email: input.email.trim().toLowerCase(),
            password: input.password,
            options: {
              data: {
                full_name: normalizeFullName(input.fullName),
                phone,
              },
            },
          });

          if (error) {
            return {
              ok: false,
              message: "Não foi possível criar sua conta. Revise os dados e tente novamente.",
            };
          }

          return { ok: true, needsEmailConfirmation: !data.session };
        } catch {
          return {
            ok: false,
            message: "Não foi possível criar sua conta. Revise os dados e tente novamente.",
          };
        }
      },
      async signOut() {
        const client = await getAvailableSupabase();
        if (!client) {
          return {
            ok: false,
            message: "Não foi possível sair. Tente novamente.",
          };
        }

        try {
          const { error } = await client.auth.signOut({ scope: "local" });
          if (error) return { ok: false, message: "Não foi possível sair. Tente novamente." };

          setSession(null);
          setProfile(null);
          return { ok: true };
        } catch {
          return { ok: false, message: "Não foi possível sair. Tente novamente." };
        }
      },
    }),
    [isLoading, member],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

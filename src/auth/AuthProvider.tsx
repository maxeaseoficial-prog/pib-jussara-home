"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue, type Member } from "@/auth/auth-context";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  firstNameFrom,
  normalizeFullName,
  signUpErrorMessage,
  toCanonicalBrazilianPhone,
} from "@/auth/member-auth";

type MemberProfile = {
  full_name: string;
  phone: string | null;
  role: "member" | "admin" | null;
};

const PROFILE_CACHE_PREFIX = "pibjussara:profile:";

function profileCacheKey(userId: string) {
  return `${PROFILE_CACHE_PREFIX}${userId}`;
}

function readCachedProfile(userId: string): MemberProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(profileCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemberProfile>;
    if (typeof parsed.full_name !== "string") return null;
    if (parsed.phone !== null && typeof parsed.phone !== "string") return null;
    if (parsed.role !== "admin" && parsed.role !== "member") return null;

    return {
      full_name: parsed.full_name,
      phone: parsed.phone ?? null,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function cacheProfile(userId: string, profile: MemberProfile) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(profileCacheKey(userId), JSON.stringify(profile));
  } catch {
    // Cache is an optimization only. Authentication must keep working without it.
  }
}

function clearCachedProfile(userId?: string) {
  if (typeof window === "undefined") return;
  try {
    if (userId) window.sessionStorage.removeItem(profileCacheKey(userId));
  } catch {
    // Ignore storage failures.
  }
}

function fallbackProfile(user: User): MemberProfile {
  const metadataName =
    typeof user.user_metadata["full_name"] === "string"
      ? normalizeFullName(user.user_metadata["full_name"])
      : "";
  const fallbackName = metadataName || user.email?.split("@")[0] || "Membro";
  const metadataPhone =
    typeof user.user_metadata["phone"] === "string" ? user.user_metadata["phone"] : "";

  return { full_name: fallbackName, phone: metadataPhone || null, role: null };
}

async function loadProfile(user: User, client: SupabaseClient): Promise<MemberProfile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle<MemberProfile>();

  if (error || !data) return null;
  return {
    full_name: data.full_name,
    phone: data.phone ?? null,
    role: data.role === "admin" ? "admin" : "member",
  };
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
    let lastSyncedUserId: string | null = null;

    const applySession = async (nextSession: Session | null, client: SupabaseClient) => {
      if (!active) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        lastSyncedUserId = null;
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const user = nextSession.user;
      const cached = readCachedProfile(user.id);

      if (cached) {
        setProfile(cached);
        setIsLoading(false);
      } else {
        setProfile(fallbackProfile(user));
        setIsLoading(false);
      }

      if (lastSyncedUserId === user.id && cached) return;
      lastSyncedUserId = user.id;

      const freshProfile = await loadProfile(user, client);
      if (!active || !freshProfile) return;

      cacheProfile(user.id, freshProfile);
      setProfile(freshProfile);
    };

    void getSupabase()
      .then(async (client) => {
        if (!active || !client) {
          if (active) setIsLoading(false);
          return;
        }

        const { data } = await client.auth.getSession();
        await applySession(data.session, client);

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, nextSession) => {
          if (event === "TOKEN_REFRESHED" && nextSession?.user.id === lastSyncedUserId) {
            setSession(nextSession);
            return;
          }
          void applySession(nextSession, client);
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setProfile(null);
          setIsLoading(false);
        }
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
      role: resolvedProfile.role,
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
              message: signUpErrorMessage(error),
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
          const currentUserId = session?.user.id;
          const { error } = await client.auth.signOut({ scope: "local" });
          if (error) return { ok: false, message: "Não foi possível sair. Tente novamente." };

          clearCachedProfile(currentUserId);
          setSession(null);
          setProfile(null);
          return { ok: true };
        } catch {
          return { ok: false, message: "Não foi possível sair. Tente novamente." };
        }
      },
    }),
    [isLoading, member, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { getSupabase } from "@/lib/supabase";

export type AdminAccessStatus = "checking" | "guest" | "denied" | "admin" | "error";

export function useAdminAccess() {
  const { member, isLoading, isConfigured } = useAuth();
  const [status, setStatus] = useState<AdminAccessStatus>("checking");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    if (isLoading) {
      setStatus("checking");
      return () => {
        active = false;
      };
    }

    if (!member) {
      setStatus("guest");
      return () => {
        active = false;
      };
    }

    if (!isConfigured) {
      setStatus("error");
      return () => {
        active = false;
      };
    }

    setStatus("checking");

    void getSupabase()
      .then(async (client) => {
        if (!client) throw new Error("Supabase unavailable");
        const { data, error } = await client.rpc("current_user_is_admin");
        if (error) throw error;
        if (active) setStatus(data ? "admin" : "denied");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [attempt, isConfigured, isLoading, member]);

  return { status, retry };
}

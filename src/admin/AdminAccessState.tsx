"use client";

import { ArrowLeft, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/useAuth";

export function AdminChecking() {
  return (
    <main className="admin-auth grid min-h-screen place-items-center bg-background px-5">
      <div className="text-center" role="status" aria-live="polite">
        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-green-700" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold text-green-950">Verificando acesso administrativo…</p>
      </div>
    </main>
  );
}

export function AdminDenied() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    const result = await signOut();
    setIsSigningOut(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <main className="admin-auth grid min-h-screen place-items-center bg-background px-5 py-16">
      <section className="w-full max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-soft text-green-800">
          <LockKeyhole className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <h1 className="mt-7 text-3xl font-extrabold tracking-[-0.025em] text-green-950 sm:text-4xl">
          Acesso não autorizado
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-text-secondary">
          Sua conta de membro está ativa, mas não possui permissão para acessar o painel
          administrativo.
        </p>
        {error ? (
          <p className="mt-5 text-sm font-semibold text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao site
          </a>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSigningOut ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isSigningOut ? "Saindo…" : "Entrar com outra conta"}
          </button>
        </div>
      </section>
    </main>
  );
}

export function AdminVerificationError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="admin-auth grid min-h-screen place-items-center bg-background px-5 py-16">
      <section className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-green-950">
          Não foi possível verificar o acesso
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-text-secondary">
          O painel continua protegido. Confira sua conexão e tente novamente.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-bold text-white transition-colors hover:bg-green-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

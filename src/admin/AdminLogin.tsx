"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/auth/useAuth";
import { isValidEmail } from "@/auth/member-auth";
import { Input } from "@/components/ui/input";

export function AdminLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isValidEmail(email) || !password) {
      setError("Informe um e-mail válido e sua senha.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.ok) setError(result.message);
  };

  return (
    <main className="admin-auth min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(32rem,1.2fr)]">
      <section className="relative hidden overflow-hidden bg-green-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <a href="/" className="inline-flex w-fit items-center gap-3" aria-label="Voltar ao site">
          <img src={logo} alt="" className="h-14 w-14 object-contain" width={56} height={56} />
          <span>
            <span className="block text-sm font-extrabold">PIB Jussara</span>
            <span className="block text-xs text-white/60">Primeira Igreja Batista</span>
          </span>
        </a>

        <div className="max-w-lg pb-8">
          <LockKeyhole className="h-8 w-8 text-brand-lime" strokeWidth={1.6} aria-hidden="true" />
          <p className="mt-8 text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] xl:text-5xl">
            Cuidado com as informações da nossa comunidade.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            Este acesso é reservado às pessoas autorizadas a administrar os dados institucionais da
            PIB Jussara.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <a
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-green-800 transition-colors hover:text-green-700 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao site
          </a>

          <div className="flex items-center gap-3 lg:hidden">
            <img src={logo} alt="" className="h-12 w-12 object-contain" width={48} height={48} />
            <span className="text-sm font-extrabold text-green-950">PIB Jussara</span>
          </div>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-[-0.03em] text-green-950 sm:text-5xl lg:mt-0">
            Área administrativa
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-7 text-text-secondary">
            Entre com sua conta. O acesso ao painel será liberado somente após a verificação da
            permissão administrativa.
          </p>

          {error ? (
            <p
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="admin-email" className="text-sm font-bold text-text-primary">
                E-mail
              </label>
              <Input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 rounded-xl bg-white text-base shadow-none md:text-sm"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-sm font-bold text-text-primary">
                Senha
              </label>
              <div className="relative mt-2">
                <Input
                  id="admin-password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl bg-white pr-14 text-base shadow-none md:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((current) => !current)}
                  className="absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-soft hover:text-green-900"
                  aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={passwordVisible}
                >
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(2,82,56,0.2)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-[0_14px_30px_rgba(2,82,56,0.24)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? "Verificando…" : "Entrar no painel"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/auth/useAuth";
import {
  formatBrazilianPhone,
  isValidEmail,
  validateSignUp,
  type SignUpErrors,
  type SignUpValues,
} from "@/auth/member-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";
type Notice = { tone: "error" | "success"; message: string } | null;

type MemberAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptySignUp: SignUpValues = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-bold text-text-primary">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-12 rounded-xl bg-white pr-12 text-base shadow-none focus-visible:ring-2 md:text-sm",
          invalid && "border-destructive focus-visible:ring-destructive",
        )}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-soft hover:text-green-900"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}

export function MemberAuthDialog({ open, onOpenChange }: MemberAuthDialogProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [signUpValues, setSignUpValues] = useState<SignUpValues>(emptySignUp);
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeMode = (nextMode: AuthMode) => {
    if (nextMode === "signup" && loginEmail) {
      setSignUpValues((values) => ({ ...values, email: loginEmail }));
    }
    if (nextMode === "login" && signUpValues.email) setLoginEmail(signUpValues.email);
    setMode(nextMode);
    setNotice(null);
    setLoginErrors({});
    setSignUpErrors({});
    setLoginPassword("");
    setSignUpValues((values) => ({ ...values, password: "", confirmPassword: "" }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode("login");
      setNotice(null);
      setLoginErrors({});
      setSignUpErrors({});
      setLoginPassword("");
      setSignUpValues((values) => ({ ...values, password: "", confirmPassword: "" }));
    }
    onOpenChange(nextOpen);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: typeof loginErrors = {};
    if (!isValidEmail(loginEmail)) errors.email = "Informe um e-mail válido.";
    if (!loginPassword) errors.password = "Informe sua senha.";
    setLoginErrors(errors);
    setNotice(null);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }

    handleOpenChange(false);
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateSignUp(signUpValues);
    setSignUpErrors(errors);
    setNotice(null);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    const result = await signUp(signUpValues);
    setIsSubmitting(false);

    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }

    if (result.needsEmailConfirmation) {
      const email = signUpValues.email;
      changeMode("login");
      setLoginEmail(email);
      setNotice({
        tone: "success",
        message: "Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre aqui.",
      });
      return;
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        closeLabel="Fechar"
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[900px] gap-0 overflow-y-auto border-0 bg-surface p-0 shadow-[0_24px_80px_rgba(2,44,30,0.28)] sm:rounded-2xl"
      >
        <div className="grid min-h-[590px] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative hidden overflow-hidden bg-green-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div
              className="pointer-events-none absolute -bottom-24 -right-28 h-80 w-80 rounded-full bg-brand-green/20 blur-3xl"
              aria-hidden="true"
            />
            <img
              src={logo}
              alt=""
              width={72}
              height={72}
              className="relative h-16 w-16 object-contain"
            />
            <div className="relative max-w-xs">
              <LockKeyhole className="mb-6 h-7 w-7 text-brand-lime" aria-hidden="true" />
              <p className="text-3xl font-extrabold leading-tight tracking-[-0.025em]">
                Sua igreja, também perto de você.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/75">
                Entre com segurança para acessar sua identificação de membro no site da PIB Jussara.
              </p>
            </div>
          </div>

          <div className="flex items-center px-5 py-14 sm:px-10 lg:px-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <img
                  src={logo}
                  alt=""
                  width={48}
                  height={48}
                  className="h-11 w-11 object-contain"
                />
                <span className="text-sm font-extrabold text-green-950">PIB Jussara</span>
              </div>

              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-3xl font-extrabold tracking-[-0.025em] text-green-950 sm:text-4xl">
                  {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
                </DialogTitle>
                <DialogDescription className="max-w-[46ch] text-sm leading-6 text-text-secondary">
                  {mode === "login"
                    ? "Use seu e-mail e senha para continuar como membro."
                    : "Cadastre seus dados para se identificar como membro da PIB Jussara."}
                </DialogDescription>
              </DialogHeader>

              {notice ? (
                <div
                  className={cn(
                    "mt-6 rounded-xl px-4 py-3 text-sm font-medium leading-5",
                    notice.tone === "error"
                      ? "bg-red-50 text-red-800"
                      : "bg-surface-soft text-green-900",
                  )}
                  role={notice.tone === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {notice.message}
                </div>
              ) : null}

              {mode === "login" ? (
                <form className="mt-7 space-y-5" onSubmit={handleLogin} noValidate>
                  <Field id="member-email" label="E-mail" error={loginErrors.email}>
                    <Input
                      id="member-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="voce@exemplo.com"
                      aria-invalid={Boolean(loginErrors.email) || undefined}
                      aria-describedby={loginErrors.email ? "member-email-error" : undefined}
                      className={cn(
                        "h-12 rounded-xl bg-white text-base shadow-none focus-visible:ring-2 md:text-sm",
                        loginErrors.email && "border-destructive focus-visible:ring-destructive",
                      )}
                      required
                    />
                  </Field>
                  <Field id="member-password" label="Senha" error={loginErrors.password}>
                    <PasswordInput
                      id="member-password"
                      value={loginPassword}
                      onChange={setLoginPassword}
                      autoComplete="current-password"
                      invalid={Boolean(loginErrors.password)}
                      describedBy={loginErrors.password ? "member-password-error" : undefined}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(2,82,56,0.22)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-[0_12px_28px_rgba(2,82,56,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Entrando…
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </button>
                </form>
              ) : (
                <form className="mt-7 space-y-4" onSubmit={handleSignUp} noValidate>
                  <Field id="signup-name" label="Nome completo" error={signUpErrors.fullName}>
                    <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={signUpValues.fullName}
                      onChange={(event) =>
                        setSignUpValues((values) => ({ ...values, fullName: event.target.value }))
                      }
                      placeholder="Nome e sobrenome"
                      aria-invalid={Boolean(signUpErrors.fullName) || undefined}
                      aria-describedby={signUpErrors.fullName ? "signup-name-error" : undefined}
                      className={cn(
                        "h-12 rounded-xl bg-white text-base shadow-none focus-visible:ring-2 md:text-sm",
                        signUpErrors.fullName &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      required
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="signup-phone" label="Telefone" error={signUpErrors.phone}>
                      <Input
                        id="signup-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        value={signUpValues.phone}
                        onChange={(event) => {
                          const phone = formatBrazilianPhone(event.target.value);
                          setSignUpValues((values) => ({
                            ...values,
                            phone,
                          }));
                        }}
                        placeholder="(62) 99999-9999"
                        aria-invalid={Boolean(signUpErrors.phone) || undefined}
                        aria-describedby={signUpErrors.phone ? "signup-phone-error" : undefined}
                        className={cn(
                          "h-12 rounded-xl bg-white text-base shadow-none focus-visible:ring-2 md:text-sm",
                          signUpErrors.phone && "border-destructive focus-visible:ring-destructive",
                        )}
                        required
                      />
                    </Field>
                    <Field id="signup-email" label="E-mail" error={signUpErrors.email}>
                      <Input
                        id="signup-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={signUpValues.email}
                        onChange={(event) =>
                          setSignUpValues((values) => ({ ...values, email: event.target.value }))
                        }
                        placeholder="voce@exemplo.com"
                        aria-invalid={Boolean(signUpErrors.email) || undefined}
                        aria-describedby={signUpErrors.email ? "signup-email-error" : undefined}
                        className={cn(
                          "h-12 rounded-xl bg-white text-base shadow-none focus-visible:ring-2 md:text-sm",
                          signUpErrors.email && "border-destructive focus-visible:ring-destructive",
                        )}
                        required
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="signup-password"
                      label="Senha"
                      error={signUpErrors.password}
                      hint="Mínimo de 6 caracteres."
                    >
                      <PasswordInput
                        id="signup-password"
                        value={signUpValues.password}
                        onChange={(password) =>
                          setSignUpValues((values) => ({ ...values, password }))
                        }
                        autoComplete="new-password"
                        invalid={Boolean(signUpErrors.password)}
                        describedBy={
                          signUpErrors.password ? "signup-password-error" : "signup-password-hint"
                        }
                      />
                    </Field>
                    <Field
                      id="signup-confirm-password"
                      label="Confirmar senha"
                      error={signUpErrors.confirmPassword}
                    >
                      <PasswordInput
                        id="signup-confirm-password"
                        value={signUpValues.confirmPassword}
                        onChange={(confirmPassword) =>
                          setSignUpValues((values) => ({ ...values, confirmPassword }))
                        }
                        autoComplete="new-password"
                        invalid={Boolean(signUpErrors.confirmPassword)}
                        describedBy={
                          signUpErrors.confirmPassword ? "signup-confirm-password-error" : undefined
                        }
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(2,82,56,0.22)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-[0_12px_28px_rgba(2,82,56,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Criando conta…
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-text-secondary">
                {mode === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"}{" "}
                <button
                  type="button"
                  onClick={() => changeMode(mode === "login" ? "signup" : "login")}
                  className="font-bold text-green-800 underline decoration-brand-green/50 underline-offset-4 transition-colors hover:text-green-700"
                >
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

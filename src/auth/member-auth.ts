export type SignUpValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

type AuthErrorLike = {
  code?: string | undefined;
  status?: number | undefined;
};

export function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function localPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2)
    : digits;
}

export function formatBrazilianPhone(value: string) {
  const digits = localPhoneDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const firstGroupLength = subscriber.length > 8 ? 5 : 4;
  const firstGroup = subscriber.slice(0, firstGroupLength);
  const lastGroup = subscriber.slice(firstGroupLength);

  return `(${areaCode}) ${firstGroup}${lastGroup ? `-${lastGroup}` : ""}`;
}

export function toCanonicalBrazilianPhone(value: string) {
  const digits = localPhoneDigits(value);
  return /^[1-9]\d{9,10}$/.test(digits) ? `+55${digits}` : null;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function signUpErrorMessage(error: AuthErrorLike | null) {
  switch (error?.code) {
    case "weak_password":
      return "Escolha uma senha forte e exclusiva, evitando palavras ou sequências comuns.";
    case "email_exists":
    case "user_already_exists":
      return "Já existe uma conta com este e-mail. Volte para Entrar e use sua senha.";
    case "email_address_invalid":
    case "validation_failed":
      return "Confira o e-mail e os demais dados informados antes de tentar novamente.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente.";
    case "captcha_failed":
      return "Não foi possível concluir a verificação de segurança. Atualize a página e tente novamente.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Novos cadastros estão temporariamente indisponíveis. Entre em contato com a igreja.";
    case "unexpected_failure":
      return "O servidor não conseguiu concluir o cadastro. Tente novamente em alguns minutos.";
    default:
      return error?.status === 429
        ? "Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente."
        : "Não foi possível criar sua conta. Confira os dados e tente novamente.";
  }
}

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const nameParts = normalizeFullName(values.fullName).split(" ").filter(Boolean);

  if (nameParts.length < 2) errors.fullName = "Informe seu nome e sobrenome.";
  if (!toCanonicalBrazilianPhone(values.phone)) {
    errors.phone = "Informe um telefone válido com DDD.";
  }
  if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  if (values.password.length < 8) {
    errors.password = "Use uma senha com pelo menos 8 caracteres.";
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}

export function firstNameFrom(fullName: string) {
  return normalizeFullName(fullName).split(" ")[0] || "membro";
}

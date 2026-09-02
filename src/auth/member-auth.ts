export type SignUpValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

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

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const nameParts = normalizeFullName(values.fullName).split(" ").filter(Boolean);

  if (nameParts.length < 2) errors.fullName = "Informe seu nome e sobrenome.";
  if (!toCanonicalBrazilianPhone(values.phone)) {
    errors.phone = "Informe um telefone válido com DDD.";
  }
  if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  if (values.password.length < 6) {
    errors.password = "Use uma senha com pelo menos 6 caracteres.";
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

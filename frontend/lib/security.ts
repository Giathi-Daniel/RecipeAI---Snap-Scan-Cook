const MAX_TEXT_LENGTH = 10000;

function stripControlCharacters(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ");
}

export function sanitizePlainText(value: string, maxLength = MAX_TEXT_LENGTH) {
  return stripControlCharacters(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: string, maxLength = MAX_TEXT_LENGTH) {
  return stripControlCharacters(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: string) {
  return sanitizePlainText(value, 320).toLowerCase();
}

export function sanitizeFullName(value: string) {
  return sanitizePlainText(value, 120).replace(/[^a-zA-Z0-9 .,'-]/g, "");
}

export function normalizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function validatePasswordStrength(value: string) {
  if (value.length < 8) {
    return "Use at least 8 characters for your password.";
  }

  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Use uppercase, lowercase, and a number in your password.";
  }

  return null;
}

import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeNextPath,
  sanitizeEmail,
  sanitizeFullName,
  sanitizeMultilineText,
  validatePasswordStrength,
} from "../lib/security";

test("sanitizeEmail trims and lowercases user input", () => {
  assert.equal(sanitizeEmail("  CHEF@Example.COM "), "chef@example.com");
});

test("sanitizeFullName removes unsupported characters", () => {
  assert.equal(sanitizeFullName(" Chef <Admin> "), "Chef Admin");
});

test("sanitizeMultilineText removes null bytes", () => {
  assert.equal(sanitizeMultilineText("Hello\u0000\nWorld"), "Hello  World");
});

test("normalizeNextPath blocks external redirect values", () => {
  assert.equal(normalizeNextPath("https://evil.example"), "/dashboard");
  assert.equal(normalizeNextPath("//evil.example"), "/dashboard");
  assert.equal(normalizeNextPath("/recipe/demo"), "/recipe/demo");
});

test("validatePasswordStrength requires stronger passwords", () => {
  assert.equal(validatePasswordStrength("short"), "Use at least 8 characters for your password.");
  assert.equal(
    validatePasswordStrength("passwordonly"),
    "Use uppercase, lowercase, and a number in your password.",
  );
  assert.equal(validatePasswordStrength("Recipe123"), null);
});

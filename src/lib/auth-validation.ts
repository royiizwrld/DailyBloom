export interface SignupFields { firstName: string; lastName: string; email: string; password: string; confirm: string }

export const MIN_PASSWORD = 8;
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function validatePassword(p: string, confirm: string) {
  const e: { password?: string; confirm?: string } = {};
  if (p.length < MIN_PASSWORD) e.password = `Password must be at least ${MIN_PASSWORD} characters.`;
  if (confirm !== p) e.confirm = "Passwords don't match.";
  return e;
}

export function validateSignup(f: SignupFields): Partial<Record<keyof SignupFields, string>> {
  const e: Partial<Record<keyof SignupFields, string>> = {};
  if (!f.firstName.trim()) e.firstName = "First name is required.";
  if (!isEmail(f.email)) e.email = "Enter a valid email address.";
  return { ...e, ...validatePassword(f.password, f.confirm) };
}

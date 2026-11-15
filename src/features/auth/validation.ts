export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailError(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email address.'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.'
  return undefined
}

function compact<T extends string>(
  errors: Record<T, string | undefined>,
): FieldErrors<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value),
  ) as FieldErrors<T>
}

export function validateLogin(values: {
  email: string
  password: string
}): FieldErrors<'email' | 'password'> {
  return compact({
    email: emailError(values.email),
    password: values.password ? undefined : 'Enter your password.',
  })
}

export function validateSignup(values: {
  displayName: string
  email: string
  password: string
}): FieldErrors<'displayName' | 'email' | 'password'> {
  const name = values.displayName.trim()
  return compact({
    displayName:
      name.length < 2 || name.length > 30
        ? 'Display name must be 2–30 characters.'
        : undefined,
    email: emailError(values.email),
    password:
      values.password.length < 8
        ? 'Password must be at least 8 characters.'
        : undefined,
  })
}

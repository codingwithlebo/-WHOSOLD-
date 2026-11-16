import { describe, expect, it } from 'vitest'
import { validateLogin, validateSignup } from './validation'

describe('validateLogin', () => {
  it('requires a valid email and a password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    })
    expect(validateLogin({ email: 'not-an-email', password: 'x' })).toEqual({
      email: 'Enter a valid email address.',
    })
  })

  it('returns no errors for valid input', () => {
    expect(validateLogin({ email: 'alice@test.dev', password: 'x' })).toEqual(
      {},
    )
  })
})

describe('validateSignup', () => {
  it('checks display name length and password strength', () => {
    expect(
      validateSignup({ displayName: 'A', email: 'a@b.co', password: 'short' }),
    ).toEqual({
      displayName: 'Display name must be 2–30 characters.',
      password: 'Password must be at least 8 characters.',
    })
  })

  it('returns no errors for valid input', () => {
    expect(
      validateSignup({
        displayName: 'Alice',
        email: 'alice@test.dev',
        password: 'Password123!',
      }),
    ).toEqual({})
  })
})

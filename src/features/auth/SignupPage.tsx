import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import TextField from '../../components/ui/TextField'
import { useAuth } from './AuthContext'
import AuthLayout from './AuthLayout'
import { validateSignup, type FieldErrors } from './validation'

type Field = 'displayName' | 'email' | 'password'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    const values = {
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    }
    const found = validateSignup(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { error } = await signUp(
      values.email,
      values.password,
      values.displayName,
    )
    setSubmitting(false)
    if (error) {
      setServerError(error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      footer={
        <>
          Already playing? <Link to="/login">Log in</Link>
        </>
      }
      subtitle="Create your account, then start or join a group."
      title="Join the game"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <TextField
          autoComplete="nickname"
          error={errors.displayName}
          hint="This is what your group sees."
          label="Display name"
          maxLength={30}
          onChange={(e) => setDisplayName(e.target.value)}
          value={displayName}
        />
        <TextField
          autoComplete="email"
          error={errors.email}
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          value={email}
        />
        <TextField
          autoComplete="new-password"
          error={errors.password}
          hint="At least 8 characters."
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          value={password}
        />
        {serverError ? (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        ) : null}
        <Button disabled={submitting} size="lg" type="submit" variant="primary">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}

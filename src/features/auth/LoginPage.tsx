import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import TextField from '../../components/ui/TextField'
import { useAuth } from './AuthContext'
import AuthLayout from './AuthLayout'
import { validateLogin, type FieldErrors } from './validation'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    const values = { email: email.trim(), password }
    const found = validateLogin(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)
    if (error) {
      setServerError(error)
      return
    }
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
      subtitle="Your crew is waiting. Log in to see your group."
      title="Welcome back"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <TextField
          autoComplete="email"
          error={errors.email}
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          value={email}
        />
        <TextField
          autoComplete="current-password"
          error={errors.password}
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
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileCheck2, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface PasswordStrength {
  minLength: boolean
  hasUppercase: boolean
  hasNumber: boolean
}

function checkStrength(password: string): PasswordStrength {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? 'text-approved' : 'text-ink-muted'}`}>
      <Check className={`size-3 ${met ? 'opacity-100' : 'opacity-30'}`} aria-hidden />
      {label}
    </li>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = checkStrength(password)
  const allMet = Object.values(strength).every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!allMet) { setError('Your password does not meet all requirements.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      await register(fullName.trim(), email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        setError(detail[0].msg)
      } else {
        setError(err?.message || 'Registration failed. Please make sure the backend server is running on port 8000.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="size-9 rounded-lg bg-mark flex items-center justify-center">
              <FileCheck2 className="size-5 text-approved-surface" />
            </div>
            <span className="font-display text-2xl font-bold text-ink">
              Clear<span className="text-accent">claim</span>
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold tracking-widest text-accent uppercase mb-2">
              Receipt workspace
            </p>
            <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Track and submit expense receipts with confidence.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-semibold text-ink-secondary">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-60"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-ink-secondary">
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-ink-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Requirements */}
              {password.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 pl-0.5">
                  <Requirement met={strength.minLength} label="At least 8 characters" />
                  <Requirement met={strength.hasUppercase} label="One uppercase letter" />
                  <Requirement met={strength.hasNumber} label="One number" />
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-ink-secondary">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 pr-11 rounded-lg border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:ring-2 transition-all disabled:opacity-60 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rejected focus:border-rejected focus:ring-rejected/20'
                      : 'border-border focus:border-accent focus:ring-accent/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-rejected">Passwords do not match.</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-error-surface text-error text-sm px-4 py-3 rounded-lg"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Note: new accounts always receive USER role */}
        <p className="text-center text-xs text-ink-muted mt-4 px-4">
          Accounts created here receive the <strong>USER</strong> role. Admin access is assigned by your organization.
        </p>
      </div>
    </div>
  )
}

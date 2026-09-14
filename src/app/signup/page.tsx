'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📧</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Check your inbox!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, margin: '0 0 32px' }}>
          We sent a confirmation link to <strong>{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/login" className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }}>
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
      {/* Top branding */}
      <div style={{ paddingTop: '52px', paddingBottom: '32px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72,
          background: 'var(--green-light)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 36,
        }}>
          🥗
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Create your account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Start cooking smarter with NormalMe
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="form-error" style={{ marginBottom: 18 }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Google button */}
      <button
        id="btn-google-signup"
        className="btn-secondary"
        onClick={handleGoogleSignup}
        disabled={googleLoading || loading}
        style={{ marginBottom: 18 }}
      >
        {googleLoading ? (
          <div className="spinner spinner-green" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? 'Connecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="divider" style={{ marginBottom: 18 }}>or</div>

      {/* Signup form */}
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Full name
          </label>
          <input
            id="input-name"
            type="text"
            className="input-field"
            placeholder="Arjun Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Email address
          </label>
          <input
            id="input-email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="input-password"
              type={showPass ? 'text' : 'password'}
              className="input-field"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: 18, padding: 0,
              }}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {password.length > 0 && password.length < 8 && (
            <p style={{ fontSize: 12, color: 'var(--orange-warn)', marginTop: 4 }}>
              Password must be at least 8 characters
            </p>
          )}
        </div>

        <button
          id="btn-email-signup"
          type="submit"
          className="btn-primary"
          disabled={loading || googleLoading || password.length < 8}
          style={{ marginTop: 4 }}
        >
          {loading ? <div className="spinner" /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {/* Terms */}
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        By creating an account, you agree to our{' '}
        <a href="#" style={{ color: 'var(--green-primary)' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="#" style={{ color: 'var(--green-primary)' }}>Privacy Policy</a>.
      </p>

      {/* Login link */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--green-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

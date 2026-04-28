import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { setCurrentPage } = useApp()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError(null)
    const err = await signIn(email.trim(), password)
    if (err) { setError(err); setLoading(false) }
    // On success: AuthContext fires → AppContext loads data → routing is automatic
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="font-serif text-3xl font-semibold text-stone-900">atelier</span>
          <h1 className="font-serif text-2xl text-stone-900 mt-6">Welcome back</h1>
          <p className="text-sm text-stone-400 mt-1">Sign in to your account</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3.5 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              placeholder="Email"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              placeholder="Password"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 bg-white"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-sm text-stone-500">
          New to Atelier?{' '}
          <button
            onClick={() => setCurrentPage('onboarding')}
            className="font-semibold text-stone-900 hover:underline"
          >
            Create an account
          </button>
        </p>

        <button
          onClick={() => setCurrentPage('landing')}
          className="w-full text-center text-sm text-stone-400 hover:text-stone-600"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

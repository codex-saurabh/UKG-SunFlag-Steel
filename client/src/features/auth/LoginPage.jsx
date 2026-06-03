// src/features/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Building2, AlertCircle } from 'lucide-react'
import { authApi } from '@/lib/api/queries'
import { useAuth } from '@/shared/hooks/useAuth'
import { Spinner } from '@/shared/ui/Spinner'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { setAuth } = useAuth()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const { token, user } = await authApi.login({ email, password })
      setAuth({ token, user })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Invalid credentials. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F6FA' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] flex-shrink-0 p-10"
        style={{ background: '#0D1233' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <div className="text-white text-[15px] font-semibold">UKG Reports</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color:'rgba(255,255,255,0.35)' }}>
              Steel Plant
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[32px] font-bold text-white leading-tight mb-4">
            Actionable insights.<br />
            <span style={{ color:'#60A5FA' }}>Better people</span>{' '}
            <span style={{ color:'#818CF8' }}>decisions.</span>
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color:'rgba(255,255,255,0.55)' }}>
            Secure. Trusted. Built for HR.
          </p>

          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl" style={{ background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background:'rgba(59,130,246,0.15)' }}>
              <Lock size={14} color="#60A5FA" />
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-white">Enterprise grade security</div>
              <div className="text-[11.5px] mt-0.5" style={{ color:'rgba(255,255,255,0.4)' }}>
                Your data is protected with industry-leading security and compliance standards.
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px]" style={{ color:'rgba(255,255,255,0.2)' }}>
          © 2026 UKG Reports · HR Department use only
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
              <Building2 size={15} color="#fff" />
            </div>
            <span className="text-[15px] font-semibold text-[#0F172A]">UKG Reports</span>
          </div>

          <h1 className="text-[22px] font-bold text-[#0F172A] mb-1">Welcome Back</h1>
          <p className="text-[13px] text-[#64748B] mb-7">Sign in to continue to UKG Reports</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[12px] font-medium text-[#334155] mb-1.5 block">
                Email address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@steelplant.in"
                  className="form-input pl-9"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] font-medium text-[#334155] mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-9 pr-9"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                <AlertCircle size={13} className="text-[#B91C1C] flex-shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-[#B91C1C]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center h-10 text-[13px] mt-1"
            >
              {loading ? <Spinner size="sm" className="border-white border-t-white/30" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3.5 rounded-xl" style={{ background:'#F8FAFC', border:'0.5px solid #E2E8F0' }}>
            <p className="text-[11px] font-semibold text-[#475569] mb-2">Demo credentials</p>
            {[
              { role:'IT Admin',    email:'admin@steelplant.in' },
              { role:'HR Admin',    email:'hr@steelplant.in' },
              { role:'Time Office', email:'timeoffice@steelplant.in' },
            ].map((c) => (
              <div key={c.email} className="flex items-center justify-between py-0.5">
                <span className="text-[11px] text-[#64748B]">{c.role}</span>
                <button
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword('Admin@123') }}
                  className="text-[11px] text-brand-500 hover:underline font-medium"
                >
                  {c.email}
                </button>
              </div>
            ))}
            <p className="text-[10.5px] text-[#94A3B8] mt-1.5">Password: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
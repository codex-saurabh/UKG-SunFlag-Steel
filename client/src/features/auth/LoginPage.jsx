
// src/features/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'
import { authApi } from '@/lib/api/queries'
import { useAuth } from '@/shared/hooks/useAuth'
import { Spinner } from '@/shared/ui/Spinner'
import logo from '@/assets/logo.png'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const { setAuth } = useAuth()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
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
    <div className="min-h-screen w-screen flex items-center justify-center bg-emerald-50 px-4 py-8">

      {/* ── CARD ── */}
      <div
        className="flex w-full max-w-[860px] min-h-[520px] rounded-[24px] overflow-hidden shadow-xl"
        style={{ border: '0.5px solid #d1fae5' }}
      >

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[42%] flex-shrink-0 p-9 relative overflow-hidden bg-emerald-50"
          style={{ borderRight: '0.5px solid #d1fae5' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'rgba(16,185,129,0.08)' }} />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'rgba(16,185,129,0.05)' }} />

          {/* Brand */}
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-[56px] h-[56px] rounded-[14px] bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ border: '0.5px solid #d1fae5', boxShadow: '0 2px 8px rgba(16,185,129,0.15)' }}
            >
              <img src={logo} alt="SunFlag Steel" className="w-full h-full object-contain p-1.5" />
            </div>
            <div>
              <p className="text-[17px] font-bold text-slate-900 leading-none tracking-tight">SunFlag Steel</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-600 mt-1.5 font-medium">UKG Reports · Attendance</p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="relative z-10">
            <h2 className="text-[26px] font-bold text-slate-900 leading-snug tracking-tight mb-2">
              Track.{' '}
              <span className="text-emerald-600">Comply.</span>
              <br />Empower.
            </h2>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Centralized attendance, shift, and workforce
              <br />data for SunFlag Steel operations.
            </p>
          </div>

          {/* Feature card */}
          <div
            className="relative z-10 bg-white rounded-xl p-4 flex items-start gap-3"
            style={{ border: '0.5px solid #d1fae5', boxShadow: '0 1px 6px rgba(16,185,129,0.07)' }}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-slate-800">Enterprise-grade security</p>
              <p className="text-[10.5px] text-gray-500 mt-0.5 leading-relaxed">
                Role-based access with audit trails and session control.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10">
            <div
              className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 w-fit"
              style={{ border: '0.5px solid #d1fae5' }}
            >
              <Lock size={9} className="text-emerald-600" />
              <span className="text-[9px] uppercase tracking-[0.12em] text-gray-400">Internal System v3.1</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-white flex items-center justify-center p-10">
          <div className="w-full max-w-[300px]">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-7 lg:hidden">
              <div
                className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                style={{ border: '0.5px solid #d1fae5' }}
              >
                <img src={logo} alt="SunFlag Steel" className="w-full h-full object-contain p-1" />
              </div>
              <span className="text-[14px] font-semibold text-slate-900">SunFlag Steel</span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Sign In</h1>
              <p className="text-[12px] text-gray-400 mt-1">Authorized entry only</p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-[8px] mb-4"
                style={{ background: '#fef2f2', border: '0.5px solid #fecaca' }}
              >
                <AlertCircle size={13} className="text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-700 leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="id@sunflagsteel.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full h-[42px] pl-9 pr-4 text-[13px] text-slate-900 bg-slate-50 rounded-[10px] outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10 disabled:opacity-50"
                    style={{ border: '0.5px solid #e2e8f0' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[10px] font-semibold text-emerald-600 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full h-[42px] pl-9 pr-10 text-[13px] text-slate-900 bg-slate-50 rounded-[10px] outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10 disabled:opacity-50"
                    style={{ border: '0.5px solid #e2e8f0' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[42px] bg-slate-900 hover:bg-emerald-600 text-white rounded-[10px] text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading
                  ? <Spinner size="sm" className="border-white border-t-white/30" />
                  : <><span>Sign In</span><ArrowRight size={14} /></>
                }
              </button>

            </form>

            <div className="h-px bg-slate-100 my-5" />

            <p className="text-center text-[10.5px] uppercase tracking-[0.1em] text-slate-400">
              Need access?{' '}
              <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                Register
              </Link>
            </p>

          </div>
        </div>
      </div>

      {/* Page footer */}
      <p className="absolute bottom-5 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 pointer-events-none">
        SunFlag Steel &amp; Iron Co. Ltd. · Proprietary Infrastructure
      </p>

    </div>
  )
}

// // src/features/auth/LoginPageDark.jsx
// import { useState } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'
// import { authApi } from '@/lib/api/queries'
// import { useAuth } from '@/shared/hooks/useAuth'
// import { Spinner } from '@/shared/ui/Spinner'
// import logo from '@/assets/logo.png'

// export default function LoginPageDark() {
//   const [email,    setEmail]    = useState('')
//   const [password, setPassword] = useState('')
//   const [showPwd,  setShowPwd]  = useState(false)
//   const [loading,  setLoading]  = useState(false)
//   const [error,    setError]    = useState('')

//   const { setAuth } = useAuth()
//   const navigate    = useNavigate()

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if (!email || !password) { setError('Please enter your email and password.'); return }
//     setLoading(true)
//     setError('')
//     try {
//       const { token, user } = await authApi.login({ email, password })
//       setAuth({ token, user })
//       navigate('/dashboard')
//     } catch (err) {
//       const msg = err.response?.data?.error?.message ?? 'Invalid credentials. Please try again.'
//       setError(msg)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen w-screen flex items-center justify-center px-4 py-8"
//       style={{ background: '#0a0f1e' }}>

//       {/* ── CARD ── */}
//       <div
//         className="flex w-full max-w-[860px] min-h-[520px] rounded-[24px] overflow-hidden"
//         style={{ border: '0.5px solid rgba(16,185,129,0.15)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
//       >

//         {/* ── LEFT PANEL ── */}
//         <div
//           className="hidden lg:flex flex-col justify-between w-[42%] flex-shrink-0 p-9 relative overflow-hidden"
//           style={{ background: '#0d1526', borderRight: '0.5px solid rgba(16,185,129,0.12)' }}
//         >
//           {/* Decorative circles */}
//           <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
//             style={{ background: 'rgba(16,185,129,0.06)' }} />
//           <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full pointer-events-none"
//             style={{ background: 'rgba(16,185,129,0.04)' }} />

//           {/* Brand */}
//           <div className="flex items-center gap-4 relative z-10">
//             <div
//               className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center flex-shrink-0 overflow-hidden"
//               style={{
//                 background: 'rgba(255,255,255,0.05)',
//                 border: '0.5px solid rgba(16,185,129,0.25)',
//                 boxShadow: '0 2px 12px rgba(16,185,129,0.1)',
//               }}
//             >
//               <img src={logo} alt="SunFlag Steel" className="w-full h-full object-contain p-1.5" />
//             </div>
//             <div>
//               <p className="text-[17px] font-bold text-white leading-none tracking-tight">SunFlag Steel</p>
//               <p className="text-[10px] uppercase tracking-[0.18em] mt-1.5 font-medium"
//                 style={{ color: '#10b981' }}>
//                 UKG Reports · Attendance
//               </p>
//             </div>
//           </div>

//           {/* Hero copy */}
//           <div className="relative z-10">
//             <h2 className="text-[26px] font-bold leading-snug tracking-tight mb-2"
//               style={{ color: '#f1f5f9' }}>
//               Track.{' '}
//               <span style={{ color: '#10b981' }}>Comply.</span>
//               <br />Empower.
//             </h2>
//             <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
//               Centralized attendance, shift, and workforce
//               <br />data for SunFlag Steel operations.
//             </p>
//           </div>

//           {/* Feature card */}
//           <div
//             className="relative z-10 rounded-xl p-4 flex items-start gap-3"
//             style={{
//               background: 'rgba(255,255,255,0.04)',
//               border: '0.5px solid rgba(16,185,129,0.15)',
//             }}
//           >
//             <div
//               className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
//               style={{ background: 'rgba(16,185,129,0.12)' }}
//             >
//               <ShieldCheck size={15} color="#10b981" />
//             </div>
//             <div>
//               <p className="text-[11.5px] font-semibold text-white">Enterprise-grade security</p>
//               <p className="text-[10.5px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
//                 Role-based access with audit trails and session control.
//               </p>
//             </div>
//           </div>

//           {/* Footer — pill only, no back link */}
//           <div className="relative z-10">
//             <div
//               className="flex items-center gap-1.5 rounded-full px-3 py-1 w-fit"
//               style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(16,185,129,0.2)' }}
//             >
//               <Lock size={9} color="#10b981" />
//               <span className="text-[9px] uppercase tracking-[0.12em]"
//                 style={{ color: 'rgba(255,255,255,0.35)' }}>
//                 Internal System v3.1
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── RIGHT PANEL ── */}
//         <div
//           className="flex-1 flex items-center justify-center p-10"
//           style={{ background: '#111827' }}
//         >
//           <div className="w-full max-w-[300px]">

//             {/* Mobile logo */}
//             <div className="flex items-center gap-3 mb-7 lg:hidden">
//               <div
//                 className="w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0"
//                 style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(16,185,129,0.25)' }}
//               >
//                 <img src={logo} alt="SunFlag Steel" className="w-full h-full object-contain p-1" />
//               </div>
//               <span className="text-[14px] font-semibold text-white">SunFlag Steel</span>
//             </div>

//             {/* Heading */}
//             <div className="mb-7">
//               <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#f1f5f9' }}>Sign In</h1>
//               <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Authorized entry only</p>
//             </div>

//             {/* Error */}
//             {error && (
//               <div
//                 className="flex items-start gap-2 px-3 py-2.5 rounded-[8px] mb-4"
//                 style={{ background: 'rgba(185,28,28,0.15)', border: '0.5px solid rgba(185,28,28,0.35)' }}
//               >
//                 <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
//                 <p className="text-[11px] leading-snug" style={{ color: '#f87171' }}>{error}</p>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-4">

//               {/* Email */}
//               <div>
//                 <label
//                   className="block text-[10.5px] font-semibold uppercase mb-1.5"
//                   style={{ letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
//                 >
//                   Corporate Email
//                 </label>
//                 <div className="relative">
//                   <Mail
//                     size={13}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//                     style={{ color: 'rgba(255,255,255,0.2)' }}
//                   />
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="id@sunflagsteel.com"
//                     autoComplete="email"
//                     disabled={loading}
//                     className="w-full h-[42px] pl-9 pr-4 text-[13px] rounded-[10px] outline-none transition-all disabled:opacity-50"
//                     style={{
//                       background: 'rgba(255,255,255,0.05)',
//                       border: '0.5px solid rgba(255,255,255,0.1)',
//                       color: '#f1f5f9',
//                     }}
//                     onFocus={e => {
//                       e.target.style.borderColor = 'rgba(16,185,129,0.6)'
//                       e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
//                       e.target.style.background = 'rgba(255,255,255,0.07)'
//                     }}
//                     onBlur={e => {
//                       e.target.style.borderColor = 'rgba(255,255,255,0.1)'
//                       e.target.style.boxShadow = 'none'
//                       e.target.style.background = 'rgba(255,255,255,0.05)'
//                     }}
//                   />
//                 </div>
//               </div>

//               {/* Password */}
//               <div>
//                 <div className="flex items-center justify-between mb-1.5">
//                   <label
//                     className="text-[10.5px] font-semibold uppercase"
//                     style={{ letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
//                   >
//                     Password
//                   </label>
//                   <Link
//                     to="/forgot-password"
//                     className="text-[10px] font-semibold hover:underline"
//                     style={{ color: '#10b981' }}
//                   >
//                     Forgot?
//                   </Link>
//                 </div>
//                 <div className="relative">
//                   <Lock
//                     size={13}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//                     style={{ color: 'rgba(255,255,255,0.2)' }}
//                   />
//                   <input
//                     type={showPwd ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="••••••••"
//                     autoComplete="current-password"
//                     disabled={loading}
//                     className="w-full h-[42px] pl-9 pr-10 text-[13px] rounded-[10px] outline-none transition-all disabled:opacity-50"
//                     style={{
//                       background: 'rgba(255,255,255,0.05)',
//                       border: '0.5px solid rgba(255,255,255,0.1)',
//                       color: '#f1f5f9',
//                     }}
//                     onFocus={e => {
//                       e.target.style.borderColor = 'rgba(16,185,129,0.6)'
//                       e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
//                       e.target.style.background = 'rgba(255,255,255,0.07)'
//                     }}
//                     onBlur={e => {
//                       e.target.style.borderColor = 'rgba(255,255,255,0.1)'
//                       e.target.style.boxShadow = 'none'
//                       e.target.style.background = 'rgba(255,255,255,0.05)'
//                     }}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPwd(v => !v)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
//                     style={{ color: 'rgba(255,255,255,0.25)' }}
//                     onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
//                     onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
//                   >
//                     {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Submit */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full h-[42px] text-white rounded-[10px] text-[11px] font-semibold uppercase flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
//                 style={{
//                   background: '#0f172a',
//                   border: '0.5px solid rgba(16,185,129,0.3)',
//                   letterSpacing: '0.12em',
//                 }}
//                 onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#10b981' }}
//                 onMouseLeave={e => { e.currentTarget.style.background = '#0f172a' }}
//               >
//                 {loading
//                   ? <Spinner size="sm" className="border-white border-t-white/30" />
//                   : <><span>Sign In</span><ArrowRight size={14} /></>
//                 }
//               </button>

//             </form>

//             <div className="my-5" style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />

//             <p className="text-center text-[10.5px] uppercase tracking-[0.1em]"
//               style={{ color: 'rgba(255,255,255,0.25)' }}>
//               Need access?{' '}
//               <Link
//                 to="/register"
//                 className="font-semibold hover:underline"
//                 style={{ color: '#10b981' }}
//               >
//                 Register
//               </Link>
//             </p>

//           </div>
//         </div>
//       </div>

//       {/* Page footer */}
//       <p
//         className="absolute bottom-5 text-[9px] font-bold uppercase pointer-events-none"
//         style={{ letterSpacing: '0.3em', color: 'rgba(255,255,255,0.15)' }}
//       >
//         SunFlag Steel &amp; Iron Co. Ltd. · Proprietary Infrastructure
//       </p>

//     </div>
//   )
// }


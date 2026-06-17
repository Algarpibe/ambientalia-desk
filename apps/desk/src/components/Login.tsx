import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await login(email, password) }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E9EDF2]">
      <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 w-[360px] flex flex-col gap-3">
        <h1 className="text-[18px] font-bold text-slate-800 mb-1">Ambientalia · Servicio Técnico</h1>
        <label className="text-[12px] font-medium text-slate-600">Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 w-full border border-slate-200 rounded p-2 text-[13px]" />
        </label>
        <label className="text-[12px] font-medium text-slate-600">Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="mt-1 w-full border border-slate-200 rounded p-2 text-[13px]" />
        </label>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <button type="submit" disabled={busy}
          className="bg-[#2C7BE5] text-white rounded p-2 text-[13px] font-bold disabled:opacity-50">
          {busy ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <i className="ti-flame text-terra text-3xl" />
          <span className="text-dark font-medium text-2xl tracking-tight">Facho</span>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
          <h1 className="text-sm font-medium text-dark mb-5 text-center">
            acesse sua base de conhecimento
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="input-base"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5">senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-btn px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ti-loader-2 animate-spin text-sm" />
                  entrando...
                </span>
              ) : (
                'entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-faint mt-5">
          sistema privado — Diggo Dev
        </p>
      </div>
    </div>
  );
}
